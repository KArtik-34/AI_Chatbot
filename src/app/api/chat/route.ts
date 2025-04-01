import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { message, chatId, personality } = await request.json();

    if (!message || !chatId) {
      return NextResponse.json(
        { error: 'Message and chatId are required' },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_API_KEY) {
      console.error('GOOGLE_API_KEY is not set');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    console.log('Initializing Gemini model...');
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    console.log('Starting chat with system prompt:', personality?.systemPrompt || "You are a helpful AI assistant.");
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: personality?.systemPrompt || "You are a helpful AI assistant." }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    console.log('Sending message to Gemini:', message);
    const result = await chat.sendMessage(message);
    console.log('Received result from Gemini');
    
    const response = await result.response;
    console.log('Processed response from Gemini');
    
    if (!response || !response.text()) {
      console.error('Empty response received from Gemini API');
      throw new Error('Empty response from Gemini API');
    }

    const responseText = response.text();
    console.log('Successfully generated response:', responseText.substring(0, 100) + '...');
    return NextResponse.json({ message: responseText });
  } catch (error) {
    console.error('Detailed error in chat API:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid API key configuration' },
          { status: 401 }
        );
      }
      if (error.message.includes('Empty response')) {
        return NextResponse.json(
          { error: 'Empty response from AI model' },
          { status: 500 }
        );
      }
      if (error.message.includes('model')) {
        return NextResponse.json(
          { error: 'Invalid model name or configuration' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: `Failed to process chat request: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 