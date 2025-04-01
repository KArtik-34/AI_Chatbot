import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: Request) {
  try {
    console.log('Generate title API called');
    const { userMessage, assistantMessage } = await req.json();
    
    console.log('Received messages for title generation:', { 
      userMessageLength: userMessage?.length || 0,
      assistantMessageLength: assistantMessage?.length || 0
    });

    if (!process.env.GOOGLE_API_KEY) {
      console.error('GOOGLE_API_KEY not configured in environment');
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

    console.log('Sending title generation prompt to Gemini');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const title = response.text().trim();
    console.log('Generated title:', title);

    if (!title) {
      console.warn('Empty title returned from Gemini');
      return NextResponse.json(
        { error: 'Failed to generate title' },
        { status: 500 }
      );
    }

    return NextResponse.json({ title, response: title });
  } catch (error) {
    console.error('Error generating title:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate title' },
      { status: 500 }
    );
  }
} 