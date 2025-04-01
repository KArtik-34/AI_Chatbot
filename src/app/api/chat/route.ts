import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

interface ChatMessage {
  sender: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  message: string;
  personalityMode?: string | { name: string; [key: string]: any };
  conversationHistory?: ChatMessage[];
}

export async function POST(request: Request) {
  try {
    console.log('Chat API called');
    const body = await request.json();
    const { message, personalityMode, conversationHistory } = body as RequestBody;
    
    console.log('Request body:', { 
      messageLength: message?.length || 0, 
      personalityMode: personalityMode || 'default', 
      historyLength: conversationHistory?.length || 0 
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
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

    // Personality prompts
    const personalityPrompts: Record<string, string> = {
      casual: "You are a friendly and casual chatbot. Keep your responses light and conversational.",
      funny: "You are a humorous chatbot. Use wit and light humor in your responses while keeping them appropriate.",
      romantic: "You are a romantic and caring chatbot. Be sweet and affectionate in your responses.",
      supportive: "You are a supportive and empathetic chatbot. Show understanding and offer encouragement."
    };

    // For backward compatibility - handle if personality is sent as an object with name property
    let selectedPersonality = 'casual';
    if (typeof personalityMode === 'string') {
      selectedPersonality = personalityMode;
    } else if (personalityMode && typeof personalityMode === 'object' && 'name' in personalityMode) {
      selectedPersonality = personalityMode.name as string;
    }
    
    console.log('Selected personality:', selectedPersonality);

    // Get personality prompt
    const personalityPrompt = personalityPrompts[selectedPersonality] || personalityPrompts.casual;

    // Format conversation history
    function formatConversationHistory(history: ChatMessage[] | undefined): string {
      if (!history || !Array.isArray(history)) return '';
      
      const lastMessages = history.slice(-5); // Keep last 5 messages for context
      return lastMessages
        .map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');
    }

    // Format conversation history
    const formattedHistory = formatConversationHistory(conversationHistory);
    
    // Create the prompt
    const prompt = `
      ${personalityPrompt}
      
      Format your responses with the following rules:
      1. Use "**text**" for important points or emphasis
      2. Start sections or topics with capitalized words followed by a colon
      3. Use bullet points (•) for lists
      4. If including links, use markdown format: [text](url)
      5. Keep your responses well-structured and visually organized
      
      Previous conversation:
      ${formattedHistory}
      
      User: ${message}
      Assistant:`;

    console.log('Initializing Gemini model...');
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 2048,
      }
    });

    console.log('Sending prompt to model');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Received response:', text);
    
    return NextResponse.json({ response: text });
  } catch (error: unknown) {
    console.error('Chat route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 