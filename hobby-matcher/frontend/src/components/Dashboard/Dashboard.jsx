import './Dashboard.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Chip,
    Box,
    Stack,
    CircularProgress
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import VideocamIcon from '@mui/icons-material/Videocam';

const Dashboard = () => {
    const { user, logout, onlineUsers } = useAuth();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);

    const fetchMatches = async () => {
        try {
            // const response = await axios.get('http://localhost:5000/api/users/matches', {
                const response = await axios.get('https://temp-4jiz.onrender.com/api/users/matches', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            // Ensure we're setting an array of matches
            setMatches(response.data.matches || []);
            setError(null);
        } catch (error) {
            console.error('Error fetching matches:', error);
            setError('Failed to fetch matches');
            setMatches([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatches();
    }, []);

    useEffect(() => {
        // Create socket connection
       // const newSocket = io('http://localhost:5000');https://hobby-matcher-7-s60w.onrender.com
       const newSocket = io('https://temp-4jiz.onrender.com')
        // Debug logs for socket connection
        newSocket.on('connect', () => {
            console.log('Socket Connected:', newSocket.id);
            // Register user ID with socket
            if (user?._id) {
                console.log('Registering user:', user._id);
                newSocket.emit('register-user', user._id);
            }
        });

        // Modified incoming call handler
        newSocket.on('incoming-call', ({ roomId, callerId }) => {
            console.log('Incoming call from:', callerId);
            
            // Force the confirm dialog to appear in the main thread
            setTimeout(() => {
                const accept = window.confirm('Incoming video call. Would you like to accept?');
                console.log('Call response:', accept ? 'accepted' : 'rejected');
                
                if (accept) {
                    newSocket.emit('accept-call', { roomId, callerId });
                    navigate(`/video-chat/${roomId}`);
                } else {
                    newSocket.emit('reject-call', { roomId, callerId });
                }
            }, 100);
        });

        setSocket(newSocket);

        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, [user?._id]);

    const handleStartChat = (matchId) => {
        console.log('Starting chat with:', matchId);
        const roomId = [user._id, matchId].sort().join('-');
        
        // Emit call initiation
        socket.emit('initiate-call', {
            targetUserId: matchId,
            roomId
        });

        navigate(`/video-chat/${roomId}`);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return (
            <Container sx={{ mt: 4 }}>
                <Typography color="error">{error}</Typography>
            </Container>
        );
    }

    return (
        <Container sx={{ mt: 4 }}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h5" gutterBottom>
                            Welcome, {user?.username}!
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Your Hobbies: {user?.hobbies?.join(', ')}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            People with Similar Interests
                        </Typography>
                        {matches && matches.length > 0 ? (
                            <List>
                                {matches.map((match) => (
                                    <ListItem
                                        key={match._id}
                                        secondaryAction={
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={() => handleStartChat(match._id)}
                                            >
                                                Chat
                                            </Button>
                                        }
                                    >
                                        <ListItemAvatar>
                                            <Avatar>{match.username[0]}</Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography component="span" variant="body1">
                                                        {match.username}
                                                    </Typography>
                                                    {match.isOnline && (
                                                        <Box
                                                            sx={{
                                                                width: 8,
                                                                height: 8,
                                                                bgcolor: 'success.main',
                                                                borderRadius: '50%'
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <Box component="span">
                                                    <Typography 
                                                        component="span" 
                                                        variant="body2" 
                                                        color="text.secondary"
                                                        display="block"
                                                    >
                                                        Hobbies: {match.hobbies.join(', ')}
                                                    </Typography>
                                                    {match.commonHobbies && match.commonHobbies.length > 0 && (
                                                        <Typography 
                                                            component="span" 
                                                            variant="body2" 
                                                            color="primary"
                                                            display="block"
                                                        >
                                                            Common Interests: {match.commonHobbies.join(', ')}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body1">No matches found</Typography>
                        )}
                    </Paper>
                </Grid>
                {/* <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h4">Online Users</Typography>
                        <List>
                            {Array.from(onlineUsers).map(userId => (
                                <ListItem key={userId}>
                                    <ListItemText primary={userId} />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid> */}
            </Grid>
        </Container>
    );
};

export default Dashboard;