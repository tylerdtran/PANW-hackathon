// Client-side functions that call the secure API routes
import { JournalEntry, ThemeAnalysis, WeeklyInsight, PromptSuggestion } from '../types/journal';

// Enhanced analysis function with better context understanding
export async function analyzeJournalEntry(content: string): Promise<{
  sentiment: string;
  themes: string[];
  insights: string;
  wordCount: number;
  emotionalIntensity: number;
  keyTopics: string[];
}> {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        analysisType: 'entry',
        requestId: Date.now().toString(),
      }),
    });

    if (!response.ok) {
      throw new Error('Analysis failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('AI analysis failed:', error);
    
    // Fallback analysis for development/testing
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Simple sentiment detection based on keywords
    const positiveWords = ['happy', 'joy', 'excited', 'grateful', 'love', 'wonderful', 'amazing', 'great', 'good', 'positive'];
    const negativeWords = ['sad', 'angry', 'frustrated', 'worried', 'anxious', 'stress', 'bad', 'terrible', 'awful', 'negative'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      const lowerWord = word.toLowerCase();
      if (positiveWords.some(pos => lowerWord.includes(pos))) positiveCount++;
      if (negativeWords.some(neg => lowerWord.includes(neg))) negativeCount++;
    });
    
    let sentiment = 'neutral';
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';
    else if (positiveCount === negativeCount && positiveCount > 0) sentiment = 'mixed';
    
    // Simple theme extraction
    const themes = extractSimpleThemes(content);
    
    return {
      sentiment,
      themes,
      insights: `This entry shows ${sentiment} emotions with ${wordCount} words.`,
      wordCount,
      emotionalIntensity: Math.min(positiveCount + negativeCount, 10),
      keyTopics: themes.slice(0, 3),
    };
  }
}

// Compose coherent entry from spoken transcript
export async function composeFromSpokenTranscript(transcript: string): Promise<{ composedText: string; evaluation: string; }>{
  try {
    const response = await fetch('/api/compose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, requestId: Date.now().toString() })
    });
    if (!response.ok) throw new Error('Compose failed');
    const data = await response.json();
    return { composedText: data.composedText, evaluation: data.evaluation };
  } catch (e) {
    console.error('Compose from speech failed', e);
    // Fallback: return transcript as-is
    return { composedText: transcript, evaluation: 'Transcribed your spoken notes. Consider adding specific feelings and one small intention.' };
  }
}

// Generate dynamic, empathetic prompts based on recent entries
export async function generateDynamicPrompts(entries: JournalEntry[], userGoals?: string[]): Promise<PromptSuggestion[]> {
  try {
    const response = await fetch('/api/prompts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recentEntries: entries.slice(0, 5), // Last 5 entries for context
        userGoals,
        requestId: Date.now().toString(),
      }),
    });

    if (!response.ok) {
      throw new Error('Prompt generation failed');
    }

    const data = await response.json();
    return data.prompts;
  } catch (error) {
    console.error('Dynamic prompt generation failed:', error);
    
    // Fallback to context-aware prompts based on recent entries
    return generateContextAwarePrompts(entries);
  }
}

// Generate weekly insights based on journal entries
export async function generateWeeklyInsights(entries: JournalEntry[], period: 'week' | 'month' = 'week'): Promise<WeeklyInsight> {
  try {
    const response = await fetch('/api/insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entries,
        period,
        requestId: Date.now().toString(),
      }),
    });

    if (!response.ok) {
      throw new Error('Insight generation failed');
    }

    const data = await response.json();
    return data.insights;
  } catch (error) {
    console.error('Weekly insight generation failed:', error);
    
    // Fallback to basic insights
    return generateBasicInsights(entries, period);
  }
}

// Enhanced theme analysis over time
export async function analyzeThemesOverTime(entries: JournalEntry[]): Promise<ThemeAnalysis[]> {
  try {
    const response = await fetch('/api/themes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entries,
        requestId: Date.now().toString(),
      }),
    });

    if (!response.ok) {
      throw new Error('Theme analysis failed');
    }

    const data = await response.json();
    return data.themes;
  } catch (error) {
    console.error('Theme analysis failed:', error);
    
    // Fallback to basic theme analysis
    return generateBasicThemeAnalysis(entries);
  }
}

// Fallback/helper functions (kept as before)
function extractSimpleThemes(content: string): string[] {
  const themes = [] as string[];
  const lowerContent = content.toLowerCase();
  if (lowerContent.includes('work') || lowerContent.includes('job') || lowerContent.includes('career')) themes.push('work');
  if (lowerContent.includes('family') || lowerContent.includes('parent') || lowerContent.includes('child')) themes.push('family');
  if (lowerContent.includes('health') || lowerContent.includes('exercise') || lowerContent.includes('sleep')) themes.push('health');
  if (lowerContent.includes('creative') || lowerContent.includes('art') || lowerContent.includes('music')) themes.push('creativity');
  if (lowerContent.includes('learn') || lowerContent.includes('grow') || lowerContent.includes('improve')) themes.push('personal growth');
  if (lowerContent.includes('friend') || lowerContent.includes('relationship') || lowerContent.includes('love')) themes.push('relationships');
  if (lowerContent.includes('stress') || lowerContent.includes('anxiety') || lowerContent.includes('worry')) themes.push('stress');
  if (lowerContent.includes('thankful') || lowerContent.includes('grateful') || lowerContent.includes('blessed')) themes.push('gratitude');
  return themes.slice(0, 5);
}

function generateContextAwarePrompts(entries: JournalEntry[]): PromptSuggestion[] {
  const prompts: PromptSuggestion[] = [];
  if (entries.length === 0) {
    return [
      { id: 'default-1', text: "What's one thing you're grateful for today?", category: 'gratitude', context: 'Start your journaling journey with gratitude' },
      { id: 'default-2', text: "How are you feeling right now, and what led to this feeling?", category: 'reflection', context: 'Begin exploring your emotional landscape' },
    ];
  }
  const recentThemes = entries.slice(0, 3).flatMap(e => e.themes);
  const recentSentiments = entries.slice(0, 3).map(e => e.sentiment);
  if (recentThemes.includes('stress') || recentSentiments.includes('negative')) prompts.push({ id: 'stress-relief', text: "What's one small thing that brought you peace today?", category: 'reflection', context: 'Focus on finding moments of calm' });
  if (recentThemes.includes('work')) prompts.push({ id: 'work-balance', text: 'How did you maintain work-life balance today?', category: 'reflection', context: 'Reflect on your work boundaries' });
  if (recentThemes.includes('family')) prompts.push({ id: 'family-connection', text: 'What\'s a meaningful interaction you had with family today?', category: 'relationship', context: 'Cherish family connections' });
  if (recentSentiments.includes('positive')) prompts.push({ id: 'positive-moment', text: 'What made today\'s positive moments possible?', category: 'reflection', context: 'Understand what brings you joy' });
  prompts.push({ id: 'growth-reflection', text: "What's one thing you learned about yourself this week?", category: 'growth', context: 'Track your personal development' });
  return prompts.slice(0, 6);
}

function generateBasicInsights(entries: JournalEntry[], period: 'week' | 'month') {
  const recentEntries = entries.slice(0, 7);
  const themes = recentEntries.flatMap(e => e.themes);
  const sentiments = recentEntries.map(e => e.sentiment);
  const themeCounts: Record<string, number> = {};
  themes.forEach(t => themeCounts[t] = (themeCounts[t] || 0) + 1);
  const topThemes = Object.entries(themeCounts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([t])=>t);
  const sentimentCounts: Record<string, number> = {};
  sentiments.forEach(s => sentimentCounts[s] = (sentimentCounts[s] || 0) + 1);
  const dominantSentiment = (Object.entries(sentimentCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'neutral') as 'positive'|'negative'|'neutral'|'mixed';
  return { period, summary: 'Your journal shows a mix of experiences and emotions.', topThemes, dominantSentiment, growthAreas: [], positiveMoments: [], recommendations: [] } as any;
}

function generateBasicThemeAnalysis(entries: JournalEntry[]): ThemeAnalysis[] {
  const themes = entries.flatMap(e => e.themes);
  const themeCounts: Record<string, number> = {};
  themes.forEach(t => themeCounts[t] = (themeCounts[t] || 0) + 1);
  return Object.entries(themeCounts).map(([theme, count]) => ({ theme, frequency: count, percentage: Math.round((count / Math.max(entries.length,1)) * 100), sentiment: 'neutral', examples: [], trend: 'stable', relatedThemes: [] }));
}
