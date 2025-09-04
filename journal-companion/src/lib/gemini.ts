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

// Fallback functions for development/testing
function extractSimpleThemes(content: string): string[] {
  const themes = [];
  const lowerContent = content.toLowerCase();
  
  // Work-related themes
  if (lowerContent.includes('work') || lowerContent.includes('job') || lowerContent.includes('career')) {
    themes.push('work');
  }
  
  // Family relationships
  if (lowerContent.includes('family') || lowerContent.includes('parent') || lowerContent.includes('child')) {
    themes.push('family');
  }
  
  // Health and wellness
  if (lowerContent.includes('health') || lowerContent.includes('exercise') || lowerContent.includes('sleep')) {
    themes.push('health');
  }
  
  // Creativity
  if (lowerContent.includes('creative') || lowerContent.includes('art') || lowerContent.includes('music')) {
    themes.push('creativity');
  }
  
  // Personal growth
  if (lowerContent.includes('learn') || lowerContent.includes('grow') || lowerContent.includes('improve')) {
    themes.push('personal growth');
  }
  
  // Relationships
  if (lowerContent.includes('friend') || lowerContent.includes('relationship') || lowerContent.includes('love')) {
    themes.push('relationships');
  }
  
  // Stress/anxiety
  if (lowerContent.includes('stress') || lowerContent.includes('anxiety') || lowerContent.includes('worry')) {
    themes.push('stress');
  }
  
  // Gratitude
  if (lowerContent.includes('thankful') || lowerContent.includes('grateful') || lowerContent.includes('blessed')) {
    themes.push('gratitude');
  }
  
  return themes.slice(0, 5); // Return top 5 themes
}

function generateContextAwarePrompts(entries: JournalEntry[]): PromptSuggestion[] {
  const prompts: PromptSuggestion[] = [];
  
  if (entries.length === 0) {
    // Default prompts for new users
    return [
      {
        id: 'default-1',
        text: "What's one thing you're grateful for today?",
        category: 'gratitude',
        context: 'Start your journaling journey with gratitude'
      },
      {
        id: 'default-2',
        text: "How are you feeling right now, and what led to this feeling?",
        category: 'reflection',
        context: 'Begin exploring your emotional landscape'
      }
    ];
  }
  
  // Analyze recent entries for context
  const recentThemes = entries.slice(0, 3).flatMap(entry => entry.themes);
  const recentSentiments = entries.slice(0, 3).map(entry => entry.sentiment);
  
  // Generate context-aware prompts
  if (recentThemes.includes('stress') || recentSentiments.includes('negative')) {
    prompts.push({
      id: 'stress-relief',
      text: "What's one small thing that brought you peace today?",
      category: 'reflection',
      context: 'Focus on finding moments of calm'
    });
  }
  
  if (recentThemes.includes('work')) {
    prompts.push({
      id: 'work-balance',
      text: "How did you maintain work-life balance today?",
      category: 'reflection',
      context: 'Reflect on your work boundaries'
    });
  }
  
  if (recentThemes.includes('family')) {
    prompts.push({
      id: 'family-connection',
      text: "What's a meaningful interaction you had with family today?",
      category: 'relationship',
      context: 'Cherish family connections'
    });
  }
  
  if (recentSentiments.includes('positive')) {
    prompts.push({
      id: 'positive-moment',
      text: "What made today's positive moments possible?",
      category: 'reflection',
      context: 'Understand what brings you joy'
    });
  }
  
  // Add some variety
  prompts.push({
    id: 'growth-reflection',
    text: "What's one thing you learned about yourself this week?",
    category: 'growth',
    context: 'Track your personal development'
  });
  
  return prompts.slice(0, 6); // Return 6 prompts max
}

function generateBasicInsights(entries: JournalEntry[], period: 'week' | 'month'): WeeklyInsight {
  if (entries.length === 0) {
    return {
      period,
      summary: "No entries yet. Start journaling to see insights about your patterns and growth.",
      topThemes: [],
      dominantSentiment: 'neutral',
      growthAreas: [],
      positiveMoments: [],
      recommendations: ["Begin with daily journaling", "Try different writing prompts", "Reflect on your feelings regularly"]
    };
  }
  
  const recentEntries = entries.slice(0, 7); // Last week
  const themes = recentEntries.flatMap(entry => entry.themes);
  const sentiments = recentEntries.map(entry => entry.sentiment);
  
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
    period,
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

function generateBasicThemeAnalysis(entries: JournalEntry[]): ThemeAnalysis[] {
  if (entries.length === 0) return [];
  
  const themes = entries.flatMap(entry => entry.themes);
  const themeCounts: { [key: string]: number } = {};
  
  themes.forEach(theme => {
    themeCounts[theme] = (themeCounts[theme] || 0) + 1;
  });
  
  return Object.entries(themeCounts).map(([theme, count]) => ({
    theme,
    frequency: count,
    percentage: Math.round((count / entries.length) * 100),
    sentiment: 'neutral', // Default sentiment for themes
    examples: entries.filter(entry => entry.themes.includes(theme)).slice(0, 3).map(entry => entry.content.substring(0, 100) + '...'),
    trend: 'stable', // Simplified for fallback
    relatedThemes: []
  }));
}
