import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required' });
    }

    const prompt = `You are an empathetic journaling companion analyzing a user's journal entry. Provide a thoughtful, gentle analysis that helps them understand their thoughts and feelings.

Journal Entry:
"${content}"

Analyze this entry and provide:
1. Sentiment analysis (positive, negative, neutral, or mixed)
2. Key themes and topics discussed
3. Gentle insights about their emotional state
4. Word count
5. Emotional intensity (1-10 scale, where 1 is very calm and 10 is very intense)
6. Key topics for further reflection

Return the analysis in this exact JSON format:
{
  "sentiment": "positive|negative|neutral|mixed",
  "themes": ["theme1", "theme2", "theme3"],
  "insights": "A gentle, empathetic insight about their entry",
  "wordCount": number,
  "emotionalIntensity": number,
  "keyTopics": ["topic1", "topic2", "topic3"]
}

Be gentle, non-judgmental, and supportive in your analysis.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    // Validate and clean the analysis
    const validatedAnalysis = {
      sentiment: analysis.sentiment || 'neutral',
      themes: Array.isArray(analysis.themes) ? analysis.themes.slice(0, 5) : ['reflection'],
      insights: analysis.insights || 'Thank you for sharing your thoughts. Every entry helps you understand yourself better.',
      wordCount: parseInt(analysis.wordCount) || content.split(/\s+/).filter(word => word.length > 0).length,
      emotionalIntensity: Math.min(Math.max(parseInt(analysis.emotionalIntensity) || 5, 1), 10),
      keyTopics: Array.isArray(analysis.keyTopics) ? analysis.keyTopics.slice(0, 3) : []
    };

    res.status(200).json(validatedAnalysis);

  } catch (error) {
    console.error('Error analyzing journal entry:', error);
    
    // Fallback analysis for development/testing
    const fallbackAnalysis = generateFallbackAnalysis(req.body.content);
    res.status(200).json(fallbackAnalysis);
  }
}

function generateFallbackAnalysis(content: string) {
  const words = content.split(/\s+/).filter((word: string) => word.length > 0);
  const wordCount = words.length;
  
  // Simple sentiment detection
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
  
  // Simple theme extraction
  const themes = [];
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('work') || lowerContent.includes('job') || lowerContent.includes('career')) {
    themes.push('work');
  }
  if (lowerContent.includes('family') || lowerContent.includes('parent') || lowerContent.includes('child')) {
    themes.push('family');
  }
  if (lowerContent.includes('friend') || lowerContent.includes('relationship') || lowerContent.includes('love')) {
    themes.push('relationship');
  }
  if (lowerContent.includes('creative') || lowerContent.includes('art') || lowerContent.includes('write')) {
    themes.push('creativity');
  }
  if (lowerContent.includes('stress') || lowerContent.includes('anxiety') || lowerContent.includes('worry')) {
    themes.push('stress');
  }
  if (lowerContent.includes('grow') || lowerContent.includes('learn') || lowerContent.includes('improve')) {
    themes.push('growth');
  }
  if (lowerContent.includes('health') || lowerContent.includes('exercise') || lowerContent.includes('sleep')) {
    themes.push('health');
  }
  if (lowerContent.includes('thankful') || lowerContent.includes('grateful') || lowerContent.includes('blessed')) {
    themes.push('gratitude');
  }
  
  return {
    sentiment,
    themes: themes.length > 0 ? themes : ['reflection'],
    insights: 'Thank you for sharing your thoughts. Every entry helps you understand yourself better.',
    wordCount,
    emotionalIntensity: Math.min(positiveCount + negativeCount, 10),
    keyTopics: themes.slice(0, 3)
  };
}
