import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ThemeAnalysis, JournalEntry } from '../../types/journal';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { entries, requestId } = req.body;

    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Create context for the AI
    const context = createThemeContext(entries);
    
    const prompt = `You are an empathetic journaling companion analyzing a user's journal entries to identify recurring themes and patterns. Analyze the themes and provide insights about how they relate to the user's emotional state and experiences.

${context}

Analyze the themes to:
1. Identify recurring topics and their frequency
2. Understand the emotional context around each theme
3. Notice relationships between different themes
4. Provide gentle observations about patterns
5. Suggest areas for continued exploration

Return the analysis in this exact JSON format:
{
  "themes": [
    {
      "theme": "theme name",
      "frequency": number,
      "percentage": number,
      "sentiment": "positive|negative|neutral|mixed",
      "examples": ["example1", "example2", "example3"],
      "trend": "increasing|decreasing|stable",
      "relatedThemes": ["related1", "related2"]
    }
  ]
}

Make the analysis feel caring and helpful for self-reflection.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    if (!parsedResponse.themes || !Array.isArray(parsedResponse.themes)) {
      throw new Error('Invalid AI response structure');
    }

    // Validate and clean the themes
    const validatedThemes: ThemeAnalysis[] = parsedResponse.themes
      .slice(0, 10) // Limit to top 10 themes
      .map((theme: Record<string, unknown>, index: number) => ({
        theme: (theme.theme as string) || `theme-${index}`,
        frequency: parseInt((theme.frequency as string) || '1'),
        percentage: Math.min(parseInt((theme.percentage as string) || '0'), 100),
        sentiment: (theme.sentiment as string) || 'neutral',
        examples: Array.isArray(theme.examples) ? (theme.examples as string[]).slice(0, 3) : [],
        trend: (theme.trend as string) || 'stable',
        relatedThemes: Array.isArray(theme.relatedThemes) ? (theme.relatedThemes as string[]).slice(0, 3) : []
      }));

    res.status(200).json({ 
      themes: validatedThemes,
      requestId,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error analyzing themes:', error);
    
    // Fallback to basic theme analysis if AI fails
    const fallbackThemes: ThemeAnalysis[] = generateFallbackThemeAnalysis(req.body.entries);

    res.status(200).json({ 
      themes: fallbackThemes,
      requestId: req.body.requestId,
      fallback: true,
      generatedAt: new Date().toISOString()
    });
  }
}

function createThemeContext(entries: JournalEntry[]): string {
  if (entries.length === 0) {
    return "This user hasn't written any journal entries yet.";
  }

  const themes = entries.flatMap(entry => entry.themes || []);
  const sentiments = entries.map(entry => entry.sentiment || 'neutral');
  const timeRange = getTimeRange(entries);
  
  let context = `The user has written ${entries.length} journal entries over ${timeRange}. `;
  context += `The most common themes are: ${getTopThemes(themes)}. `;
  context += `The emotional tone has been mostly ${getDominantSentiment(sentiments)}. `;
  
  // Add some specific examples
  const recentEntries = entries.slice(0, 5);
  context += `Recent entries include themes like: ${recentEntries.map(entry => 
    entry.themes?.slice(0, 2).join(', ') || 'general reflection'
  ).join(' | ')}`;
  
  return context;
}

function getTimeRange(entries: JournalEntry[]): string {
  if (entries.length === 0) return 'an unknown period';
  
  const dates = entries.map(entry => new Date(entry.timestamp)).sort((a, b) => a.getTime() - b.getTime());
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  
  const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 7) return 'the past week';
  if (diffDays <= 30) return 'the past month';
  if (diffDays <= 90) return 'the past few months';
  return 'several months';
}

function getTopThemes(themes: string[]): string {
  const themeCounts: { [key: string]: number } = {};
  themes.forEach(theme => {
    themeCounts[theme] = (themeCounts[theme] || 0) + 1;
  });
  
  const topThemes = Object.entries(themeCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([theme]) => theme);
  
  return topThemes.join(', ') || 'general reflection';
}

function getDominantSentiment(sentiments: string[]): string {
  const counts: { [key: string]: number } = {};
  sentiments.forEach(sentiment => {
    counts[sentiment] = (counts[sentiment] || 0) + 1;
  });
  
  const dominant = Object.entries(counts)
    .sort(([,a], [,b]) => b - a)[0]?.[0];
  
  return dominant || 'neutral';
}

function generateFallbackThemeAnalysis(entries: JournalEntry[]): ThemeAnalysis[] {
  if (entries.length === 0) return [];

  const themes = entries.flatMap(entry => entry.themes || []);
  const themeCounts: { [key: string]: number } = {};
  
  themes.forEach(theme => {
    themeCounts[theme] = (themeCounts[theme] || 0) + 1;
  });
  
  return Object.entries(themeCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8) // Top 8 themes
    .map(([theme, count]) => {
      // Find entries with this theme for examples
      const themeEntries = entries.filter(entry => entry.themes?.includes(theme));
      const examples = themeEntries.slice(0, 3).map(entry => 
        entry.content.substring(0, 100) + '...'
      );
      
      // Determine sentiment for this theme
      const themeSentiments = themeEntries.map(entry => entry.sentiment || 'neutral');
      const sentimentCounts: { [key: string]: number } = {};
      themeSentiments.forEach(sentiment => {
        sentimentCounts[sentiment] = (sentimentCounts[sentiment] || 0) + 1;
      });
      
      const dominantSentiment = Object.entries(sentimentCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';
      
      return {
        theme,
        frequency: count,
        percentage: Math.round((count / entries.length) * 100),
        sentiment: dominantSentiment as 'positive' | 'negative' | 'neutral' | 'mixed',
        examples,
        trend: 'stable', // Simplified for fallback
        relatedThemes: [] // Could be enhanced later
      };
    });
}
