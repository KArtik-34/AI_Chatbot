export interface PersonalityMode {
  name: string;
  description: string;
  systemPrompt: string;
}

export interface Message {
  id: string;
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