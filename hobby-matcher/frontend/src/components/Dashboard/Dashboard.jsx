import './Dashboard.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
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
    Stack
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import VideocamIcon from '@mui/icons-material/Videocam';

const Dashboard = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        fetchMatches();
    }, []);

    const fetchMatches = async () => {
        try {
            const response = await api.get('/users/matches');
            setMatches(response.data);
        } catch (error) {
            console.error('Error fetching matches:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartChat = (matchId) => {
        const roomId = [user._id, matchId].sort().join('-');
        socket.emit('initiate-call', {
            roomId,
            targetUserId: matchId
        });
        navigate(`/video-chat/${roomId}`);
    };

    // Add socket listeners for incoming calls
    useEffect(() => {
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        newSocket.on('incoming-call', ({ roomId, callerId }) => {
            const accept = window.confirm('Incoming video call. Accept?');
            if (accept) {
                newSocket.emit('accept-call', { roomId, callerId });
                navigate(`/video-chat/${roomId}`);
            } else {
                newSocket.emit('reject-call', { roomId, callerId });
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                {/* User Profile */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Your Profile</Typography>
                            <Button variant="outlined" color="error" onClick={handleLogout}>
                                Logout
                            </Button>
                        </Box>
                        <Typography variant="body1">
                            <strong>Username:</strong> {user.username}
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 2, mb: 1 }}>
                            <strong>Your Hobbies:</strong>
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                            {user.hobbies.map((hobby) => (
                                <Chip key={hobby} label={hobby} size="small" />
                            ))}
                        </Stack>
                    </Paper>
                </Grid>

                {/* Matches List */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            People with Similar Interests
                        </Typography>
                        <List>
                            {matches.map((match) => (
                                <ListItem
                                    key={match.user._id}
                                    sx={{
                                        mb: 2,
                                        border: '1px solid #eee',
                                        borderRadius: 1,
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar>
                                            <PersonIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle1">
                                            {match.user.username}
                                        </Typography>
                                        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                                            {match.user.hobbies.map((hobby) => (
                                                <Chip
                                                    key={hobby}
                                                    label={hobby}
                                                    size="small"
                                                    sx={{ mr: 0.5, mb: 0.5 }}
                                                />
                                            ))}
                                        </Stack>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        startIcon={<VideocamIcon />}
                                        onClick={() => handleStartChat(match.user._id)}
                                        sx={{ ml: 2 }}
                                    >
                                        Chat
                                    </Button>
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Dashboard;
