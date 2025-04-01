import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { Message } from '@/types';

interface ChatMessageProps {
  message: Message;
  isTyping?: boolean;
}

const formatMessage = (text: string | undefined): string => {
  if (!text) return '';
  
  return text
    .replace(/\n/g, '<br />')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
};

export default function ChatMessage({ message, isTyping = false }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const formattedContent = formatMessage(message.content);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Paper
        elevation={1}
        sx={{
          p: 2,
          maxWidth: '80%',
          backgroundColor: isUser ? 'primary.main' : 'background.paper',
          color: isUser ? 'primary.contrastText' : 'text.primary',
        }}
      >
        <Typography
          variant="body1"
          component="div"
          dangerouslySetInnerHTML={{ __html: formattedContent }}
        />
        {!isTyping && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'right',
              mt: 1,
              opacity: 0.6
            }}
          >
            {new Date(message.timestamp).toLocaleTimeString()}
          </Typography>
        )}
        {isTyping && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography variant="caption" sx={{ opacity: 0.6 }}>
              Typing...
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
} 