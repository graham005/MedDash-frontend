// frontend/src/MedicalChat.tsx
import { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Box, List, ListItem, ListItemText } from '@mui/material';

export default function MedicalChat() {
  const [messages, setMessages] = useState<Array<{text: string, isUser: boolean}>>([]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;

    setMessages([...messages, { text: input, isUser: true }]);

    // Get auth token from localStorage
    const token = localStorage.getItem('accessToken');

    // Get bot reply with Authorization header
    const response = await axios.post(
      'http://localhost:7000/api/health-bot',
      { question: input },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      }
    );
    console.log(response);

    setMessages(prev => [...prev, { text: response.data.answer, isUser: false }]);
    setInput('');
  };

  return (
    <Box sx={{ maxWidth: 500, margin: 'auto' }}>
      <List>
        {messages.map((msg, i) => (
          <ListItem key={i} sx={{
            textAlign: msg.isUser ? 'right' : 'left',
            bgcolor: msg.isUser ? '#8491D9' : '#F0F0F0'
          }}>
            <ListItemText primary={msg.text} />
          </ListItem>
        ))}
      </List>

      <TextField
        fullWidth
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask a medical question..."
      />
      <Button
        variant="contained"
        onClick={handleSend}
        sx={{ mt: 2, bgcolor: '#021373' }}
      >
        Send
      </Button>
    </Box>
  );
}