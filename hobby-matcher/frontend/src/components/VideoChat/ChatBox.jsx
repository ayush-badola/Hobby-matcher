import './VideoChat.css';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    Paper,
    Box,
    TextField,
    IconButton,
    Typography,
    List,
    ListItem,
    ListItemText,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const ChatBox = ({ socket, roomId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const { user } = useAuth();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (socket) {
            socket.on('receive-message', (message) => {
                setMessages(prev => [...prev, message]);
            });
        }
    }, [socket]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && socket) {
            const messageData = {
                roomId,
                sender: user.username,
                content: newMessage,
                timestamp: new Date().toISOString()
            };

            socket.emit('send-message', messageData);
            setMessages(prev => [...prev, messageData]);
            setNewMessage('');
        }
    };

    return (
        <Paper sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Chat</Typography>
            </Box>

            <List sx={{ 
                flex: 1, 
                overflow: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1
            }}>
                {messages.map((message, index) => (
                    <ListItem
                        key={index}
                        sx={{
                            flexDirection: 'column',
                            alignItems: message.sender === user.username ? 'flex-end' : 'flex-start',
                            padding: 0
                        }}
                    >
                        <Box
                            sx={{
                                maxWidth: '80%',
                                backgroundColor: message.sender === user.username ? 'primary.main' : 'grey.200',
                                color: message.sender === user.username ? 'white' : 'text.primary',
                                borderRadius: 2,
                                padding: 1,
                            }}
                        >
                            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                {message.content}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            {message.sender} • {new Date(message.timestamp).toLocaleTimeString()}
                        </Typography>
                    </ListItem>
                ))}
                <div ref={messagesEndRef} />
            </List>

            <Box
                component="form"
                onSubmit={handleSendMessage}
                sx={{
                    p: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    gap: 1
                }}
            >
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <IconButton type="submit" color="primary">
                    <SendIcon />
                </IconButton>
            </Box>
        </Paper>
    );
};

export default ChatBox;
