import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transcript } = req.body as { transcript?: string };
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const prompt = `You are an empathetic journaling assistant. Clean up the user's spoken notes into a coherent, well-structured journal entry (first-person). Then provide a brief, gentle evaluation (2-3 sentences) with supportive observations and one actionable suggestion.

Return JSON:
{
  "composedText": "the cleaned, coherent journal entry",
  "evaluation": "brief, gentle evaluation and one actionable suggestion"
}

Spoken notes:
"""
${transcript}
"""`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response');
    const parsed = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      composedText: parsed.composedText || transcript,
      evaluation: parsed.evaluation || 'Thanks for sharing. Consider noting one small win and one gentle next step.'
    });
  } catch (e) {
    console.error('Compose API error', e);
    return res.status(200).json({
      composedText: req.body?.transcript || '',
      evaluation: 'Transcription complete. Consider clarifying the main feeling and one intention for tomorrow.'
    });
  }
}
