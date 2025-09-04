export interface JournalEntry {
  id: string;
  content: string;
  timestamp: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  themes: string[];
  wordCount?: number;
  aiInsights?: string;
  emotionalIntensity?: number;
  keyTopics?: string[];
}

export interface ThemeAnalysis {
  theme: string;
  frequency: number;
  percentage: number;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  examples: string[];
  trend: 'increasing' | 'decreasing' | 'stable';
  relatedThemes: string[];
}

export interface SentimentTrend {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  mixed: number;
}

export interface WeeklyInsight {
  period: 'week' | 'month';
  summary: string;
  topThemes: string[];
  dominantSentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  growthAreas: string[];
  positiveMoments: JournalEntry[];
  recommendations: string[];
}

export interface PromptSuggestion {
  id: string;
  text: string;
  category: 'reflection' | 'gratitude' | 'growth' | 'relationship' | 'work' | 'creativity' | 'health' | 'stress';
  context?: string;
}

export interface AIAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  themes: string[];
  insights: string;
  wordCount: number;
  emotionalIntensity: number;
  keyTopics: string[];
}
