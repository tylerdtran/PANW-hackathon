import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = arr.slice();
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    // xorshift*
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    const j = s % (i + 1);
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function weekKey(d = new Date()): string {
  const onejan = new Date(d.getFullYear(), 0, 1);
  const millis = d.getTime() - onejan.getTime();
  const week = Math.floor((millis / 86400000 + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

function diversifySuggestions(base: string[], content: string, sentiment: string, themes: string[]): string[] {
  const lower = content.toLowerCase();
  const pools: Record<string, string[]> = {
    general: [
      'Write one intention for tomorrow and one thing you appreciate today.',
      'Take a 5-minute pause to breathe and name the feeling you notice.',
      'Go for a brief walk and capture one observation when you return.',
      'Message someone “thinking of you” and note how that feels.',
      'Tidy one small space for five minutes and reflect on the change.'
    ],
    stress: [
      'Try a 4-7-8 breathing cycle (2 minutes) and note any shift.',
      'Timebox one worry to 10 minutes; list one tiny next step.',
      'Step outside for fresh air and describe one sensory detail.'
    ],
    work: [
      'Set one boundary for tomorrow (e.g., a no‑meeting block).',
      'Define a “smallest next step” and schedule 15 focused minutes.',
      'Close the day with a 2‑line work log; let the rest wait.'
    ],
    relationships: [
      'Send a brief check‑in to someone you care about.',
      'Write a gratitude line about a person in your life.',
      'Plan a 10‑minute connection (call, walk, or shared tea).'
    ],
    health: [
      'Drink a glass of water and take three deep breaths.',
      'Stretch for two minutes and notice where you release tension.',
      'Plan a short walk or wind‑down ritual for tonight.'
    ],
    creativity: [
      'Brain‑dump five ideas without judgment for two minutes.',
      'Doodle or free‑write for 90 seconds; keep it playful.',
      'Capture one curiosity to explore this week.'
    ],
    gratitude: [
      'List three tiny things that brought ease today.',
      'Write one thank‑you note (can be unsent).',
      'Revisit a positive highlight and add one detail.'
    ]
  };

  let thematic: string[] = [];
  if (sentiment === 'negative' || lower.includes('stress') || lower.includes('anxiety')) thematic = thematic.concat(pools.stress);
  if (themes.includes('work')) thematic = thematic.concat(pools.work);
  if (themes.includes('family') || themes.includes('relationships') || lower.includes('friend')) thematic = thematic.concat(pools.relationships);
  if (themes.includes('health')) thematic = thematic.concat(pools.health);
  if (themes.includes('creativity')) thematic = thematic.concat(pools.creativity);
  if (themes.includes('gratitude') || lower.includes('grateful')) thematic = thematic.concat(pools.gratitude);

  // Seed by content and current week to rotate prompts over time but be stable within a week
  const seed = hashString(content + '|' + weekKey());
  const combined = Array.from(new Set([...(base || []), ...thematic, ...pools.general]));
  const shuffled = seededShuffle(combined, seed);

  // Keep suggestions short and distinct
  const picked: string[] = [];
  for (const s of shuffled) {
    const normalized = s.trim();
    if (!normalized) continue;
    if (picked.find(p => p.toLowerCase() === normalized.toLowerCase())) continue;
    picked.push(normalized);
    if (picked.length >= 3) break;
  }

  return picked;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required' });
    }

    const prompt = `You are an empathetic journaling companion analyzing a user's journal entry. Provide a thoughtful, gentle analysis and 2-3 actionable next steps.

Journal Entry:
"${content}"

Return JSON with:
{
  "sentiment": "positive|negative|neutral|mixed",
  "themes": ["theme1", "theme2", "theme3"],
  "insights": "A gentle, empathetic reflection summarizing what you heard",
  "wordCount": number,
  "emotionalIntensity": number,
  "keyTopics": ["topic1", "topic2"],
  "suggestions": ["one short, non-judgmental, practical suggestion", "another..."]
}

Be supportive, non-judgmental, and specific; avoid clinical claims. Keep suggestions brief and doable.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    const sentiment = analysis.sentiment || 'neutral';
    const themes = Array.isArray(analysis.themes) ? analysis.themes.slice(0, 5) : ['reflection'];

    let suggestions: string[] = Array.isArray(analysis.suggestions) ? analysis.suggestions.slice(0, 5) : [];
    suggestions = diversifySuggestions(suggestions, content, sentiment, themes);

    const validatedAnalysis = {
      sentiment,
      themes,
      insights: analysis.insights || 'Thank you for sharing your thoughts. Every entry helps you understand yourself better.',
      wordCount: parseInt(analysis.wordCount) || content.split(/\s+/).filter((w: string) => w.length > 0).length,
      emotionalIntensity: Math.min(Math.max(parseInt(analysis.emotionalIntensity) || 5, 1), 10),
      keyTopics: Array.isArray(analysis.keyTopics) ? analysis.keyTopics.slice(0, 3) : [],
      suggestions: suggestions.slice(0, 3)
    };

    res.status(200).json(validatedAnalysis);

  } catch (error) {
    console.error('Error analyzing journal entry:', error);

    const content: string = req.body?.content || '';
    const words = content.split(/\s+/).filter((word: string) => word.length > 0);
    const wordCount = words.length;

    const positiveWords = ['happy', 'joy', 'excited', 'grateful', 'love', 'wonderful', 'amazing', 'great', 'good', 'positive'];
    const negativeWords = ['sad', 'angry', 'frustrated', 'worried', 'anxious', 'stress', 'bad', 'terrible', 'awful', 'negative'];

    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach((word: string) => {
      const lowerWord = word.toLowerCase();
      if (positiveWords.some(pos => lowerWord.includes(pos))) positiveCount++;
      if (negativeWords.some(neg => lowerWord.includes(neg))) negativeCount++;
    });

    let sentiment = 'neutral';
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';
    else if (positiveCount === negativeCount && positiveCount > 0) sentiment = 'mixed';

    const lowerContent = content.toLowerCase();
    const themes: string[] = [];
    if (lowerContent.includes('work') || lowerContent.includes('job') || lowerContent.includes('career')) themes.push('work');
    if (lowerContent.includes('family') || lowerContent.includes('parent') || lowerContent.includes('child')) themes.push('family');
    if (lowerContent.includes('friend') || lowerContent.includes('relationship') || lowerContent.includes('love')) themes.push('relationships');
    if (lowerContent.includes('stress') || lowerContent.includes('anxiety') || lowerContent.includes('worry')) themes.push('stress');
    if (lowerContent.includes('health') || lowerContent.includes('sleep') || lowerContent.includes('exercise')) themes.push('health');
    if (lowerContent.includes('creative') || lowerContent.includes('art') || lowerContent.includes('music')) themes.push('creativity');

    const suggestions = diversifySuggestions([], content, sentiment, themes);

    const fallback = {
      sentiment,
      themes: themes.length ? themes : ['reflection'],
      insights: 'Thanks for reflecting. Consider noting one small win and one gentle next step.',
      wordCount,
      emotionalIntensity: Math.min(positiveCount + negativeCount, 10),
      keyTopics: themes.slice(0, 3),
      suggestions
    };

    res.status(200).json(fallback);
  }
}
