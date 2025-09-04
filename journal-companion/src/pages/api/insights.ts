import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { WeeklyInsight, JournalEntry } from '../../types/journal';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { entries, period, requestId } = req.body;

    if (!entries || !Array.isArray(entries) || !period) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Create context for the AI
    const context = createInsightContext(entries, period);
    
    const prompt = `You are an empathetic journaling companion analyzing a user's journal entries over time. Generate a gentle, insightful summary that helps them understand patterns in their thoughts, emotions, and experiences.

${context}

Generate insights that:
1. Are gentle and non-judgmental
2. Help identify recurring themes and patterns
3. Celebrate positive moments and growth
4. Offer gentle observations about emotional patterns
5. Provide supportive recommendations for continued reflection
6. Feel like a caring friend's perspective, not clinical analysis

Return the insights in this exact JSON format:
{
  "insights": {
    "period": "${period}",
    "summary": "A gentle, empathetic summary of key patterns and observations",
    "topThemes": ["theme1", "theme2", "theme3"],
    "dominantSentiment": "positive|negative|neutral|mixed",
    "growthAreas": ["area1", "area2", "area3"],
    "positiveMoments": ["moment1", "moment2"],
    "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
  }
}

Make the insights feel personal, caring, and helpful for self-reflection.`;

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
    
    if (!parsedResponse.insights) {
      throw new Error('Invalid AI response structure');
    }

    const aiInsights = parsedResponse.insights;
    
    // Validate and clean the insights
    const validatedInsights: WeeklyInsight = {
      period: aiInsights.period || period,
      summary: aiInsights.summary || 'Your journal shows a journey of self-discovery and growth.',
      topThemes: Array.isArray(aiInsights.topThemes) ? aiInsights.topThemes.slice(0, 3) : [],
      dominantSentiment: aiInsights.dominantSentiment || 'neutral',
      growthAreas: Array.isArray(aiInsights.growthAreas) ? aiInsights.growthAreas.slice(0, 3) : [],
      positiveMoments: [], // Will be populated from actual entries
      recommendations: Array.isArray(aiInsights.recommendations) ? aiInsights.recommendations.slice(0, 3) : []
    };

    // Add actual positive moments from entries
    const positiveEntries = entries
      .filter(entry => entry.sentiment === 'positive')
      .slice(0, 3);
    validatedInsights.positiveMoments = positiveEntries;

    res.status(200).json({ 
      insights: validatedInsights,
      requestId,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    
    // Fallback to basic insights if AI fails
    const fallbackInsights: WeeklyInsight = generateFallbackInsights(req.body.entries, req.body.period);

    res.status(200).json({ 
      insights: fallbackInsights,
      requestId: req.body.requestId,
      fallback: true,
      generatedAt: new Date().toISOString()
    });
  }
}

function createInsightContext(entries: JournalEntry[], period: string): string {
  if (entries.length === 0) {
    return "This user hasn't written any journal entries yet.";
  }

  const recentEntries = entries.slice(0, 10); // Last 10 entries for context
  const themes = recentEntries.flatMap(entry => entry.themes || []);
  const sentiments = recentEntries.map(entry => entry.sentiment || 'neutral');
  const wordCounts = recentEntries.map(entry => entry.wordCount || 0);
  
  let context = `Over the ${period}, the user has written ${entries.length} journal entries. `;
  context += `The most common themes are: ${getTopThemes(themes)}. `;
  context += `The emotional tone has been mostly ${getDominantSentiment(sentiments)}. `;
  context += `Average entry length: ${Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)} words. `;
  
  if (period === 'week') {
    context += `This represents their journaling activity for the past week.`;
  } else {
    context += `This represents their journaling activity for the past month.`;
  }
  
  return context;
}

function getTopThemes(themes: string[]): string {
  const themeCounts: { [key: string]: number } = {};
  themes.forEach(theme => {
    themeCounts[theme] = (themeCounts[theme] || 0) + 1;
  });
  
  const topThemes = Object.entries(themeCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
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

function generateFallbackInsights(entries: JournalEntry[], period: string): WeeklyInsight {
  if (entries.length === 0) {
    return {
      period: period as 'week' | 'month',
      summary: "No entries yet. Start journaling to see insights about your patterns and growth.",
      topThemes: [],
      dominantSentiment: 'neutral',
      growthAreas: ["Begin with daily journaling", "Try different writing prompts", "Reflect on your feelings regularly"],
      positiveMoments: [],
      recommendations: ["Start with gratitude", "Write about your day", "Notice your emotions"]
    };
  }

  const recentEntries = entries.slice(0, 7);
  const themes = recentEntries.flatMap(entry => entry.themes || []);
  const sentiments = recentEntries.map(entry => entry.sentiment || 'neutral');
  
  // Count theme frequency
  const themeCounts: { [key: string]: number } = {};
  themes.forEach(theme => {
    themeCounts[theme] = (themeCounts[theme] || 0) + 1;
  });
  
  const topThemes = Object.entries(themeCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([theme]) => theme);
  
  // Determine dominant sentiment
  const sentimentCounts: { [key: string]: number } = {};
  sentiments.forEach(sentiment => {
    sentimentCounts[sentiment] = (sentimentCounts[sentiment] || 0) + 1;
  });
  
  const dominantSentiment = (Object.entries(sentimentCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral') as 'positive' | 'negative' | 'neutral' | 'mixed';
  
  // Generate insights
  const insights = [];
  if (topThemes.includes('work')) {
    insights.push("Work appears frequently in your thoughts");
  }
  if (topThemes.includes('family')) {
    insights.push("Family relationships are important to you");
  }
  if (dominantSentiment === 'positive') {
    insights.push("You've been experiencing mostly positive emotions");
  } else if (dominantSentiment === 'negative') {
    insights.push("You've been dealing with challenging emotions");
  }
  
  return {
    period: period as 'week' | 'month',
    summary: insights.length > 0 ? insights.join('. ') : "Your journal shows a mix of experiences and emotions.",
    topThemes,
    dominantSentiment,
    growthAreas: ["Continue exploring your thoughts", "Notice patterns in your emotions", "Celebrate small wins"],
    positiveMoments: recentEntries.filter(entry => entry.sentiment === 'positive').slice(0, 3),
    recommendations: [
      "Write about what brings you joy",
      "Reflect on challenging situations",
      "Notice recurring themes in your life"
    ]
  };
}
