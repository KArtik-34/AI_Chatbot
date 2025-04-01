import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
export async function POST(req: Request) {
  try {
    const { userMessage, assistantMessage } = await req.json();

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Based on the following conversation, generate a concise and descriptive title (max 5 words) that captures the main topic or purpose of the discussion. The title should be clear, specific, and helpful for future reference.

User: ${userMessage}
Assistant: ${assistantMessage}

Generate a title that:
1. Is concise (max 5 words)
2. Captures the main topic or purpose
3. Is specific and descriptive
4. Uses proper capitalization
5. Avoids common words and articles unless necessary

Title:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const title = response.text().trim();

    if (!title) {
      return NextResponse.json(
        { error: 'Failed to generate title' },
        { status: 500 }
      );
    }

    return NextResponse.json({ title });
  } catch (error) {
    console.error('Error generating title:', error);
    return NextResponse.json({ error: 'Failed to generate title' }, { status: 500 });
  }
}
