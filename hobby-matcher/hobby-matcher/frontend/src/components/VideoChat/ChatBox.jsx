import './VideoChat.css';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
    Paper,
    Box,
    TextField,
    IconButton,
    Typography,
    List,
    ListItem,
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
        <Paper 
            sx={{ 
                height: { xs: '50vh', sm: '60vh', md: '70vh' },
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(135deg, #FF6B97 0%, #FF4785 100%)',
                borderRadius: { xs: '12px', sm: '16px' },
                overflow: 'hidden',
                position: 'relative',
                maxWidth: { xs: '100%', sm: '400px', md: 'none' },
                margin: { xs: '0 auto', md: '0' }
            }}
            className="chat-box-container"
        >
            <Box 
                sx={{ 
                    p: 2, 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)'
                }}
            >
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Chat
                </Typography>
            </Box>

            <List 
                sx={{ 
                    flex: 1, 
                    overflow: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    position: 'relative',
                    '&::-webkit-scrollbar': {
                        width: '6px'
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '3px'
                    }
                }}
            >
                {messages.map((message, index) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        key={index}
                    >
                        <ListItem
                            sx={{
                                flexDirection: 'column',
                                alignItems: message.sender === user.username ? 'flex-end' : 'flex-start',
                                padding: 0
                            }}
                        >
                            <Box
                                sx={{
                                    maxWidth: '80%',
                                    background: message.sender === user.username 
                                        ? 'rgba(255, 255, 255, 0.2)' 
                                        : 'rgba(255, 255, 255, 0.1)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: 2,
                                    padding: 1.5,
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                                    }
                                }}
                            >
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        color: 'white',
                                        wordBreak: 'break-word',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    {message.content}
                                </Typography>
                            </Box>
                            <Typography 
                                variant="caption" 
                                sx={{ 
                                    mt: 0.5,
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontSize: '0.7rem'
                                }}
                            >
                                {message.sender} • {new Date(message.timestamp).toLocaleTimeString()}
                            </Typography>
                        </ListItem>
                    </motion.div>
                ))}
                <div ref={messagesEndRef} />
            </List>

            <Box
                component="form"
                onSubmit={handleSendMessage}
                sx={{
                    p: 2,
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
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
                    sx={{
                        '& .MuiInputBase-root': {
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            color: 'white',
                            '&:hover': {
                                background: 'rgba(255, 255, 255, 0.15)'
                            },
                            '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.2)'
                            },
                            '&:hover fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.3)'
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.5)'
                            }
                        },
                        '& input::placeholder': {
                            color: 'rgba(255, 255, 255, 0.5)'
                        }
                    }}
                />
                <IconButton 
                    type="submit" 
                    sx={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            background: 'rgba(255, 255, 255, 0.3)',
                            transform: 'scale(1.1)'
                        }
                    }}
                >
                    <SendIcon />
                </IconButton>
            </Box>
        </Paper>
    );
};

export default ChatBox;