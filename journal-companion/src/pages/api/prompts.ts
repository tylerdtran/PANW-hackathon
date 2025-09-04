import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PromptSuggestion, JournalEntry } from '../../types/journal';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { recentEntries, userGoals, requestId } = req.body;

    if (!recentEntries || !Array.isArray(recentEntries)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Create context for the AI
    const context = createPromptContext(recentEntries, userGoals);
    
    const prompt = `You are an empathetic journaling companion. Based on the user's recent journal entries, generate 6 thoughtful, context-aware writing prompts that will help them continue their self-reflection journey.

${context}

Generate prompts that:
1. Show understanding of their current emotional state and themes
2. Offer gentle guidance for areas they might want to explore
3. Encourage positive reflection and growth
4. Feel like a caring conversation, not generic questions
5. Are specific to their situation and recent experiences

Return the prompts in this exact JSON format:
{
  "prompts": [
    {
      "id": "unique-id-1",
      "text": "The actual prompt question",
      "category": "one of: reflection, gratitude, growth, relationship, work, creativity, health, stress",
      "context": "Brief explanation of why this prompt is relevant"
    }
  ]
}

Make sure the prompts feel personal and empathetic, as if you're having a caring conversation with a friend.`;

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
    
    if (!parsedResponse.prompts || !Array.isArray(parsedResponse.prompts)) {
      throw new Error('Invalid AI response structure');
    }

    // Validate and clean the prompts
    const validatedPrompts: PromptSuggestion[] = parsedResponse.prompts
      .slice(0, 6)
      .map((prompt: Record<string, unknown>, index: number) => ({
        id: prompt.id || `generated-${index}`,
        text: prompt.text || 'What would you like to reflect on today?',
        category: prompt.category || 'reflection',
        context: prompt.context || 'Continue your journaling journey'
      }));

    res.status(200).json({ 
      prompts: validatedPrompts,
      requestId,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating prompts:', error);
    
    // Fallback to basic prompts if AI fails
    const fallbackPrompts: PromptSuggestion[] = [
      {
        id: 'fallback-1',
        text: "What's one thing you're grateful for today?",
        category: 'gratitude',
        context: 'Focus on the positive aspects of your day'
      },
      {
        id: 'fallback-2',
        text: "How are you feeling right now, and what led to this feeling?",
        category: 'reflection',
        context: 'Explore your current emotional state'
      },
      {
        id: 'fallback-3',
        text: "What's one challenge you're facing, and how are you growing through it?",
        category: 'growth',
        context: 'Reflect on personal development'
      }
    ];

    res.status(200).json({ 
      prompts: fallbackPrompts,
      requestId: req.body.requestId,
      fallback: true,
      generatedAt: new Date().toISOString()
    });
  }
}

function createPromptContext(entries: JournalEntry[], userGoals?: string[]): string {
  if (entries.length === 0) {
    return "This is a new user starting their journaling journey. They haven't written any entries yet.";
  }

  const recentEntries = entries.slice(0, 3);
  const themes = recentEntries.flatMap((entry: JournalEntry) => entry.themes || []);
  const sentiments = recentEntries.map((entry: JournalEntry) => entry.sentiment || 'neutral');
  
  let context = `Recent journal entries show these themes: ${themes.join(', ') || 'general reflection'}. `;
  context += `The emotional tone has been mostly ${getDominantSentiment(sentiments)}. `;
  
  if (userGoals && userGoals.length > 0) {
    context += `The user has stated goals: ${userGoals.join(', ')}. `;
  }
  
  context += `Recent entries include: ${recentEntries.map((entry: JournalEntry) => 
    `"${entry.content?.substring(0, 100)}..."`
  ).join(' | ')}`;
  
  return context;
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
