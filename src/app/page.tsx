'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  IconButton,
  Fab,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonalitySelector from '@/components/PersonalitySelector';
import type { Message, PersonalityMode, Chat } from '@/types/index';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { v4 as uuidv4 } from 'uuid';

// Replace the old backend URL with the internal API route
// const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const API_ROUTE = '/api';

const defaultPersonality: PersonalityMode = {
  name: 'casual',
  description: 'Friendly and conversational',
  systemPrompt: 'You are a helpful and friendly AI assistant.'
};

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Load chats and last active chat from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem('chats');
    const savedActiveChatId = localStorage.getItem('activeChatId');
    
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);
        setChats(parsedChats);
        
        // If there's a last active chat and it exists in the chats array, set it as active
        if (savedActiveChatId && parsedChats.some((chat: Chat) => chat.id === savedActiveChatId)) {
          setActiveChatId(savedActiveChatId);
        } else if (parsedChats.length > 0) {
          // If the last active chat doesn't exist, set the first chat as active
          setActiveChatId(parsedChats[0].id);
        } else {
          // If no chats exist, create a new one
          const initialChat: Chat = {
            id: '1',
            title: 'New Chat',
            messages: [],
            timestamp: new Date().toISOString(),
            personality: defaultPersonality
          };
          setChats([initialChat]);
          setActiveChatId(initialChat.id);
        }
      } catch (error) {
        console.error('Error parsing saved chats:', error);
        // If error parsing, create a new chat
        const initialChat: Chat = {
          id: '1',
          title: 'New Chat',
          messages: [],
          timestamp: new Date().toISOString(),
          personality: defaultPersonality
        };
        setChats([initialChat]);
        setActiveChatId(initialChat.id);
      }
    } else {
      // If no saved chats, create a new one
      const initialChat: Chat = {
        id: '1',
        title: 'New Chat',
        messages: [],
        timestamp: new Date().toISOString(),
        personality: defaultPersonality
      };
      setChats([initialChat]);
      setActiveChatId(initialChat.id);
    }
  }, []);

  // Save chats and active chat to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
    if (activeChatId) {
      localStorage.setItem('activeChatId', activeChatId);
    }
  }, [chats, activeChatId]);

  // Focus input when active chat changes
  useEffect(() => {
    if (activeChatId) {
      inputRef.current?.focus();
    }
  }, [activeChatId]);

  const activeChat = useMemo(() => chats.find(chat => chat.id === activeChatId), [chats, activeChatId]);
  const messages = useMemo(() => activeChat?.messages || [], [activeChat]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
      });
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100); // Add small delay to ensure animation completes
    return () => clearTimeout(timer);
  }, [messages]);

  // Separate effect for typing indicator
  useEffect(() => {
    if (isTyping) {
      scrollToBottom();
    }
  }, [isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll to bottom whenever messages change in the active chat
  const activeChatMessages = useMemo(() => {
    return activeChat?.messages;
  }, [activeChat]);

  useEffect(() => {
    if (activeChatMessages) {
        scrollToBottom();
    }
  }, [activeChatMessages]);

  // Effect for sorting chats based on timestamp
  useEffect(() => {
    setChats(prev => [...prev].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
  }, [messages]); // Now depends on the stable memoized messages array

  const generateChatTitle = (messages: Message[]): string => {
    if (messages.length < 2) return 'New Chat';

    const userMessage = messages[0].content;
    const assistantMessage = messages[1].content;

    // Combine both messages for better context
    const combinedText = `${userMessage} ${assistantMessage}`;

    // Common words to filter out (stop words)
    const commonWords = new Set([
      'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how',
      'the', 'and', 'but', 'or', 'for', 'nor', 'yet', 'so',
      'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about',
      'into', 'through', 'over', 'after', 'under', 'above',
      'this', 'that', 'these', 'those',
      'have', 'has', 'had', 'been', 'being', 'am', 'is', 'are', 'was', 'were',
      'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'can', 'could',
      'please', 'help', 'need', 'want', 'like', 'tell', 'could', 'would', 'should',
      'might', 'must', 'shall', 'will', 'do', 'does', 'did', 'doing', 'done',
      'get', 'got', 'getting', 'gotten', 'give', 'gave', 'given', 'giving',
      'go', 'went', 'gone', 'going', 'come', 'came', 'coming', 'came',
      'make', 'made', 'making', 'made', 'take', 'took', 'taking', 'taken',
      'see', 'saw', 'seeing', 'seen', 'know', 'knew', 'knowing', 'known',
      'think', 'thought', 'thinking', 'thought', 'look', 'looked', 'looking', 'looked',
      'want', 'wanted', 'wanting', 'wanted', 'feel', 'felt', 'feeling', 'felt',
      'try', 'tried', 'trying', 'tried', 'call', 'called', 'calling', 'called',
      'ask', 'asked', 'asking', 'asked', 'need', 'needed', 'needing', 'needed',
      'become', 'became', 'becoming', 'become', 'leave', 'left', 'leaving', 'left',
      'put', 'put', 'putting', 'put', 'mean', 'meant', 'meaning', 'meant',
      'keep', 'kept', 'keeping', 'kept', 'let', 'let', 'letting', 'let',
      'begin', 'began', 'beginning', 'begun', 'seem', 'seemed', 'seeming', 'seemed',
      'help', 'helped', 'helping', 'helped', 'talk', 'talked', 'talking', 'talked',
      'turn', 'turned', 'turning', 'turned', 'start', 'started', 'starting', 'started',
      'show', 'showed', 'showing', 'shown', 'hear', 'heard', 'hearing', 'heard',
      'play', 'played', 'playing', 'played', 'run', 'ran', 'running', 'run',
      'move', 'moved', 'moving', 'moved', 'like', 'liked', 'liking', 'liked',
      'live', 'lived', 'living', 'lived', 'believe', 'believed', 'believing', 'believed',
      'hold', 'held', 'holding', 'held', 'bring', 'brought', 'bringing', 'brought',
      'happen', 'happened', 'happening', 'happened', 'write', 'wrote', 'writing', 'written',
      'provide', 'provided', 'providing', 'provided', 'sit', 'sat', 'sitting', 'sat',
      'stand', 'stood', 'standing', 'stood', 'lose', 'lost', 'losing', 'lost',
      'pay', 'paid', 'paying', 'paid', 'meet', 'met', 'meeting', 'met',
      'include', 'included', 'including', 'included', 'continue', 'continued', 'continuing', 'continued',
      'set', 'set', 'setting', 'set', 'learn', 'learned', 'learning', 'learned',
      'change', 'changed', 'changing', 'changed', 'lead', 'led', 'leading', 'led',
      'understand', 'understood', 'understanding', 'understood', 'speak', 'spoke', 'speaking', 'spoken',
      'watch', 'watched', 'watching', 'watched', 'follow', 'followed', 'following', 'followed',
      'stop', 'stopped', 'stopping', 'stopped', 'create', 'created', 'creating', 'created',
      'remember', 'remembered', 'remembering', 'remembered', 'love', 'loved', 'loving', 'loved',
      'consider', 'considered', 'considering', 'considered', 'appear', 'appeared', 'appearing', 'appeared',
      'buy', 'bought', 'buying', 'bought', 'wait', 'waited', 'waiting', 'waited',
      'serve', 'served', 'serving', 'served', 'die', 'died', 'dying', 'died',
      'send', 'sent', 'sending', 'sent', 'expect', 'expected', 'expecting', 'expected',
      'build', 'built', 'building', 'built', 'stay', 'stayed', 'staying', 'stayed',
      'fall', 'fell', 'falling', 'fallen', 'cut', 'cut', 'cutting', 'cut',
      'reach', 'reached', 'reaching', 'reached', 'kill', 'killed', 'killing', 'killed',
      'remain', 'remained', 'remaining', 'remained', 'suggest', 'suggested', 'suggesting', 'suggested',
      'raise', 'raised', 'raising', 'raised', 'pass', 'passed', 'passing', 'passed',
      'sell', 'sold', 'selling', 'sold', 'require', 'required', 'requiring', 'required',
      'report', 'reported', 'reporting', 'reported', 'decide', 'decided', 'deciding', 'decided',
      'pull', 'pulled', 'pulling', 'pulled', 'return', 'returned', 'returning', 'returned',
      'break', 'broke', 'breaking', 'broken', 'run', 'ran', 'running', 'run',
      'walk', 'walked', 'walking', 'walked', 'begin', 'began', 'beginning', 'begun',
      'bring', 'brought', 'bringing', 'brought', 'catch', 'caught', 'catching', 'caught',
      'draw', 'drew', 'drawing', 'drawn', 'drive', 'drove', 'driving', 'driven',
      'eat', 'ate', 'eating', 'eaten', 'feel', 'felt', 'feeling', 'felt',
      'find', 'found', 'finding', 'found', 'forget', 'forgot', 'forgetting', 'forgotten',
      'get', 'got', 'getting', 'gotten', 'give', 'gave', 'giving', 'given',
      'go', 'went', 'going', 'gone', 'grow', 'grew', 'growing', 'grown',
      'have', 'had', 'having', 'had', 'hear', 'heard', 'hearing', 'heard',
      'hide', 'hid', 'hiding', 'hidden', 'hit', 'hit', 'hitting', 'hit',
      'hold', 'held', 'holding', 'held', 'hurt', 'hurt', 'hurting', 'hurt',
      'keep', 'kept', 'keeping', 'kept', 'know', 'knew', 'knowing', 'known',
      'lay', 'laid', 'laying', 'laid', 'lead', 'led', 'leading', 'led',
      'leave', 'left', 'leaving', 'left', 'let', 'let', 'letting', 'let',
      'lie', 'lay', 'lying', 'lain', 'lose', 'lost', 'losing', 'lost',
      'make', 'made', 'making', 'made', 'mean', 'meant', 'meaning', 'meant',
      'meet', 'met', 'meeting', 'met', 'pay', 'paid', 'paying', 'paid',
      'put', 'put', 'putting', 'put', 'read', 'read', 'reading', 'read',
      'ride', 'rode', 'riding', 'ridden', 'ring', 'rang', 'ringing', 'rung',
      'rise', 'rose', 'rising', 'risen', 'run', 'ran', 'running', 'run',
      'say', 'said', 'saying', 'said', 'see', 'saw', 'seeing', 'seen',
      'seek', 'sought', 'seeking', 'sought', 'sell', 'sold', 'selling', 'sold',
      'send', 'sent', 'sending', 'sent', 'set', 'set', 'setting', 'set',
      'shake', 'shook', 'shaking', 'shaken', 'shine', 'shone', 'shining', 'shone',
      'shoot', 'shot', 'shooting', 'shot', 'show', 'showed', 'showing', 'shown',
      'shut', 'shut', 'shutting', 'shut', 'sing', 'sang', 'singing', 'sung',
      'sink', 'sank', 'sinking', 'sunk', 'sit', 'sat', 'sitting', 'sat',
      'sleep', 'slept', 'sleeping', 'slept', 'speak', 'spoke', 'speaking', 'spoken',
      'spend', 'spent', 'spending', 'spent', 'stand', 'stood', 'standing', 'stood',
      'steal', 'stole', 'stealing', 'stolen', 'stick', 'stuck', 'sticking', 'stuck',
      'strike', 'struck', 'striking', 'struck', 'swear', 'swore', 'swearing', 'sworn',
      'sweep', 'swept', 'sweeping', 'swept', 'swim', 'swam', 'swimming', 'swum',
      'swing', 'swung', 'swinging', 'swung', 'take', 'took', 'taking', 'taken',
      'teach', 'taught', 'teaching', 'taught', 'tear', 'tore', 'tearing', 'torn',
      'tell', 'told', 'telling', 'told', 'think', 'thought', 'thinking', 'thought',
      'throw', 'threw', 'throwing', 'thrown', 'understand', 'understood', 'understanding', 'understood',
      'wake', 'woke', 'waking', 'woken', 'wear', 'wore', 'wearing', 'worn',
      'win', 'won', 'winning', 'won', 'write', 'wrote', 'writing', 'written'
    ]);

    // Clean and tokenize the text
    const words = combinedText
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => 
        word.length > 3 && 
        !commonWords.has(word)
      );

    // Calculate TF (Term Frequency)
    const tf = new Map<string, number>();
    words.forEach(word => {
      tf.set(word, (tf.get(word) || 0) + 1);
    });

    // Calculate IDF (Inverse Document Frequency)
    const idf = new Map<string, number>();
    const totalDocs = 1000; // Simulated total number of documents
    words.forEach(word => {
      // Simulate IDF calculation based on word characteristics
      const wordLength = word.length;
      const isTechnical = /[A-Z]/.test(word) || /\d/.test(word);
      const isRare = wordLength > 6 || isTechnical;
      
      // Higher IDF for longer words and technical terms
      idf.set(word, isRare ? Math.log(totalDocs / 10) : Math.log(totalDocs / 100));
    });

    // Calculate TF-IDF scores
    const tfIdf = new Map<string, number>();
    words.forEach(word => {
      tfIdf.set(word, (tf.get(word) || 0) * (idf.get(word) || 0));
    });

    // Extract keywords based on TF-IDF scores
    const keywords = Array.from(tfIdf.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([word]) => word);

    // If no keywords found through TF-IDF, try alternative methods
    if (keywords.length === 0) {
      // Method 1: Extract from first sentence
      const firstSentence = combinedText.split(/[.!?]+/)[0];
      const sentenceWords = firstSentence
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.has(word))
        .slice(0, 4);

      if (sentenceWords.length > 0) {
        return sentenceWords
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      // Method 2: Look for technical terms or capitalized words
      const technicalTerms = combinedText
        .split(/\s+/)
        .filter(word => 
          word.length > 3 && 
          (/[A-Z]/.test(word) || /\d/.test(word)) && 
          !commonWords.has(word.toLowerCase())
        )
        .slice(0, 4);

      if (technicalTerms.length > 0) {
        return technicalTerms
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      // Method 3: Look for compound words or hyphenated terms
      const compoundWords = combinedText
        .split(/\s+/)
        .filter(word => 
          word.includes('-') || 
          word.includes('_') || 
          /[A-Z][a-z]+[A-Z]/.test(word)
        )
        .slice(0, 4);

      if (compoundWords.length > 0) {
        return compoundWords
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }

    // If still no words found, return a default title
    if (keywords.length === 0) return 'New Chat';

    // Capitalize first letter of each word and join
    return keywords
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const generateTitleWithGemini = async (messages: Message[]): Promise<string> => {
    if (messages.length < 2) return 'New Chat';

    const userMessage = messages[0].content;
    const assistantMessage = messages[1].content;

    try {
      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage,
          assistantMessage
        }),
      });

      if (!response.ok) {
        let errorData = { error: 'Failed to generate title' };
        try {
          errorData = await response.json();
        } catch (parseError) {
          // Ignore if response body is not JSON
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorData.error || 'Failed to generate title from API');
      }

      const data = await response.json();
      return data.title || 'New Chat';
    } catch (error) {
      console.error('Error in generateTitleWithGemini:', error);
      // Re-throw the error so handleSendMessage can catch it and fallback
      throw error; 
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChatId) return;

    try {
      setIsTyping(true);
      setError(null);

      const userMessage: Message = {
        id: uuidv4(),
        content: inputMessage.trim(),
        timestamp: new Date().toISOString(),
        role: 'user'
      };

      const currentMessage = inputMessage.trim();
      setInputMessage('');
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            messages: [...chat.messages, userMessage]
          };
        }
        return chat;
      }));

      // Send to backend
      const response = await fetch(`${API_ROUTE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          personalityMode: activeChat?.personality,
          conversationHistory: activeChat?.messages
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      if (!data.response) {
        throw new Error('Invalid response from server');
      }

      const assistantMessage: Message = {
        id: uuidv4(),
        content: data.response,
        timestamp: new Date().toISOString(),
        role: 'assistant'
      };

      // Update messages and save to localStorage
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            messages: [...chat.messages, userMessage, assistantMessage],
            timestamp: new Date().toISOString()
          };
        }
        return chat;
      }));

      // Generate title if this is the first exchange
      if (activeChat?.messages.length === 0) {
        try {
          const titleResponse = await fetch(`${API_ROUTE}/generate-title`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userMessage: currentMessage,
              assistantMessage: data.response
            }),
          });

          if (titleResponse.ok) {
            const titleData = await titleResponse.json();
            const newTitle = titleData.response.trim();
            setChats(prev => prev.map(chat => {
              if (chat.id === activeChatId) {
                return {
                  ...chat,
                  title: newTitle,
                  timestamp: new Date().toISOString()
                };
              }
              return chat;
            }));
          }
        } catch (error) {
          console.error('Error generating title:', error);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    if (!activeChatId) return;
    setChats(prev => 
      prev.map(chat => 
        chat.id === activeChatId 
          ? { ...chat, messages: [] }
          : chat
      )
    );
    setInputMessage('');
    inputRef.current?.focus();
  };

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      timestamp: new Date().toISOString(),
      personality: defaultPersonality
    };
    setChats(prev => [...prev, newChat]);
    setActiveChatId(newChat.id);
    setInputMessage('');
    inputRef.current?.focus();
  };

  const handleChatSelect = (chatId: string) => {
    setActiveChatId(chatId);
    setInputMessage('');
    inputRef.current?.focus();
  };

  const handleDeleteChat = (chatId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (activeChatId === chatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId);
      if (remainingChats.length > 0) {
        setActiveChatId(remainingChats[remainingChats.length - 1].id);
      } else {
        const newChat: Chat = {
          id: Date.now().toString(),
          title: 'New Chat',
          messages: [],
          timestamp: new Date().toISOString(),
          personality: defaultPersonality
        };
        setChats([newChat]);
        setActiveChatId(newChat.id);
      }
    }
  };

  const handlePersonalityChange = (chatId: string, newPersonality: PersonalityMode) => {
    if (!chatId) return;
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          personality: newPersonality
        };
      }
      return chat;
    }));
  };

  const handleCopy = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 1500); // Reset after 1.5 seconds
    }, (err) => {
      console.error('Failed to copy text: ', err);
      // Optionally show an error message to the user
    });
  };

  const theme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#3b82f6',
      },
      secondary: {
        main: '#9333ea',
      },
      background: {
        default: '#111827',
        paper: 'rgba(17, 24, 39, 0.8)',
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backdropFilter: 'blur(10px)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: '12px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-1px)',
              },
            },
          },
        },
      },
    },
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(event.target.value);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)' }}>
        {/* Sidebar */}
        <Paper 
          elevation={0} 
          sx={{ 
            width: 300, 
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'rgba(17, 24, 39, 0.8)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewChat}
              fullWidth
              sx={{
                background: 'linear-gradient(135deg, #3b82f6, #9333ea)',
                color: 'white',
                height: '48px',
                fontSize: '1rem',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb, #7e22ce)',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                },
              }}
            >
              New Chat
            </Button>
          </Box>

          <List sx={{ flex: 1, overflow: 'auto', p: 1 }}>
            {chats.map((chat) => (
              <ListItem
                key={chat.id}
                component="div"
                onClick={() => handleChatSelect(chat.id)}
                sx={{
                  borderRadius: '12px',
                  mb: 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  bgcolor: activeChatId === chat.id 
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))'
                    : 'transparent',
                  border: activeChatId === chat.id
                    ? '1px solid rgba(59, 130, 246, 0.3)'
                    : '1px solid transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Typography
                      sx={{
                        fontWeight: 500,
                        color: activeChatId === chat.id ? 'primary.main' : 'text.primary',
                      }}
                    >
                      {chat.title}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        display: 'block',
                        mt: 0.5,
                      }}
                    >
                      {new Date(chat.timestamp).toLocaleString()}
                    </Typography>
                  }
                />
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(chat.id);
                  }}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'error.main',
                      bgcolor: 'rgba(239, 68, 68, 0.1)',
                    },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Main Content */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Container maxWidth="lg" sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden' }}>
            {/* Chat Header */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                mb: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <Typography 
                variant="h5" 
                sx={{ 
                  background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 600,
                }}
              >
                {activeChat?.title || 'New Chat'}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
              onClick={handleResetChat}
                disabled={!activeChatId}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'rgba(59, 130, 246, 0.1)',
                  },
                }}
            >
              Reset Chat
              </Button>
            </Paper>

            {/* Chat Messages */}
            <Paper 
              elevation={0} 
              sx={{ 
                flex: 1, 
                overflow: 'auto',
                p: 2,
                mb: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                minHeight: 0,
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.3)',
                  },
                },
              }}
            >
              {activeChat?.messages.map((message, index) => (
                <Box
                  key={`${message.timestamp}-${index}`}
                  sx={{
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                    mb: 2,
                    position: 'relative',
                    '&:hover .copy-button': {
                      opacity: 1,
                    },
                  }}
                >
                  <Paper
                    elevation={3}
                    sx={{
                      p: 1.5,
                      borderRadius: message.role === 'user' 
                        ? '20px 20px 5px 20px' 
                        : '20px 20px 20px 5px',
                      bgcolor: message.role === 'user' 
                        ? theme.palette.primary.light 
                        : theme.palette.secondary.light,
                      color: message.role === 'user' 
                        ? theme.palette.primary.contrastText 
                        : theme.palette.secondary.contrastText,
                      maxWidth: '75%',
                      wordWrap: 'break-word',
                      position: 'relative',
                    }}
                  >
                    <Box sx={{ 
                      '& p': { margin: 0, marginBottom: '8px' }, 
                      '& code': { 
                        background: 'rgba(0,0,0,0.1)', 
                        padding: '2px 4px', 
                        borderRadius: '4px',
                        fontSize: '0.9em'
                      },
                      '& pre': { 
                        background: 'rgba(0,0,0,0.1)', 
                        padding: '8px', 
                        borderRadius: '4px',
                        overflowX: 'auto'
                       },
                      '& blockquote': {
                        borderLeft: '3px solid rgba(255,255,255,0.3)',
                        paddingLeft: '8px',
                        margin: '8px 0',
                        color: 'rgba(255,255,255,0.8)'
                      },
                      '& table': {
                        borderCollapse: 'collapse',
                        width: '100%',
                        margin: '1em 0',
                        border: `1px solid ${theme.palette.divider}`,
                      },
                      '& th, & td': {
                        border: `1px solid ${theme.palette.divider}`,
                        padding: '8px 12px',
                        textAlign: 'left',
                      },
                      '& th': {
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        fontWeight: 'bold',
                      },
                      '& ul, & ol': { 
                        paddingLeft: '20px', 
                        margin: '8px 0 16px 0',
                        listStylePosition: 'outside', 
                      },
                      '& ul': {
                        listStyleType: 'disc', 
                      },
                      '& ol': {
                        listStyleType: 'decimal',
                      },
                      '& li': { 
                        paddingLeft: '5px',
                        marginBottom: '6px', 
                        lineHeight: 1.5, 
                      },
                      '& h1, & h2, & h3, & h4, & h5, & h6': {
                        marginTop: '1.5em',
                        marginBottom: '0.5em',
                      },
                      '& p > strong:first-child': {
                        display: 'inline-block',
                        marginTop: '1.2em',
                      },
                      '& hr': {
                        margin: '2em 0',
                        border: 'none',
                        borderTop: `1px dashed ${theme.palette.divider}`
                      }
                    }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </Box>
                    <Typography 
                      variant="caption" 
                      display="block" 
                      sx={{
                        mt: 0.5, 
                        textAlign: message.role === 'user' ? 'right' : 'left',
                        opacity: 0.7
                      }}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                    <Tooltip title={copiedMessageId === `${message.timestamp}-${index}` ? "Copied!" : "Copy text"}>
                      <IconButton
                        size="small"
                        className="copy-button"
                        onClick={() => handleCopy(message.content, `${message.timestamp}-${index}`)}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: message.role === 'user' ? 'unset' : 4,
                          left: message.role === 'user' ? 4 : 'unset',
                          opacity: 0,
                          transition: 'opacity 0.2s ease-in-out',
                          color: message.role === 'user' 
                            ? theme.palette.primary.contrastText 
                            : theme.palette.secondary.contrastText,
                          bgcolor: 'rgba(0, 0, 0, 0.1)',
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.2)',
                          }
                        }}
                      >
                        {copiedMessageId === `${message.timestamp}-${index}` ? (
                            <CheckIcon fontSize="inherit" />
                        ) : (
                            <ContentCopyIcon fontSize="inherit" />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Paper>
                </Box>
              ))}
              {isTyping && (
                <Box sx={{ display: 'flex', gap: 1, p: 2, animation: 'fadeIn 0.3s ease' }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255, 255, 255, 0.5)',
                      animation: 'typing 1s infinite',
                    }}
                  />
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255, 255, 255, 0.5)',
                      animation: 'typing 1s infinite',
                      animationDelay: '0.2s',
                    }}
                  />
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255, 255, 255, 0.5)',
                      animation: 'typing 1s infinite',
                      animationDelay: '0.4s',
                    }}
                  />
                </Box>
              )}
          <div ref={messagesEndRef} />
            </Paper>

            {/* Chat Input */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2,
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                position: 'sticky',
                bottom: 0,
                backgroundColor: 'rgba(17, 24, 39, 0.8)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                zIndex: 1,
                borderRadius: '16px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <TextField
                fullWidth
                multiline
                maxRows={4}
            value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
            placeholder="Type your message..."
                disabled={!activeChatId}
                inputRef={inputRef}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                    '& textarea': {
                      padding: '12px 16px',
                    },
                  },
                }}
              />
              <Fab
                color="primary"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || !activeChatId}
                sx={{
                  background: 'linear-gradient(135deg, #3b82f6, #9333ea)',
                  width: '48px',
                  height: '48px',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2563eb, #7e22ce)',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  },
                  '&.Mui-disabled': {
                    background: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <SendIcon />
              </Fab>
            </Paper>

            <PersonalitySelector
              value={activeChat?.personality || defaultPersonality}
              onChange={(newPersonality: PersonalityMode) => {
                if (activeChatId) {
                  handlePersonalityChange(activeChatId, newPersonality);
                }
              }}
            />
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
