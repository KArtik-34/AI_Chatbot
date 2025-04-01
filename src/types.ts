export interface PersonalityMode {
  name: string;
  description: string;
  systemPrompt: string;
}

export interface Message {
  content: string;
  timestamp: string;
  role: 'user' | 'assistant';
  sender?: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  timestamp: string;
  personality: PersonalityMode;
} 