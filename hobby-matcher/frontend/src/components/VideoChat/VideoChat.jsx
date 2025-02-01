import './VideoChat.css';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    IconButton
} from '@mui/material';
import {
    Mic,
    MicOff,
    Videocam,
    VideocamOff,
    CallEnd
} from '@mui/icons-material';
import ChatBox from './ChatBox';

const VideoChat = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const [stream, setStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callStatus, setCallStatus] = useState('connecting');
    
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const peerConnectionRef = useRef();

    const handleEndCall = () => {
        try {
            // Stop all tracks
            if (stream) {
                stream.getTracks().forEach(track => {
                    track.stop();
                });
                setStream(null);
            }

            // Close peer connection
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }

            // Disconnect socket
            if (socket) {
                socket.emit('leave-room', roomId);
                socket.disconnect();
            }

            // Navigate back to dashboard
            navigate('/dashboard');
        } catch (error) {
            console.error('Error ending call:', error);
            // Force navigate even if there's an error
            navigate('/dashboard');
        }
    };

    useEffect(() => {
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(currentStream => {
                setStream(currentStream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = currentStream;
                }
                setupWebRTC(currentStream, newSocket);
            })
            .catch(err => {
                console.error('Error accessing media devices:', err);
            });

        newSocket.on('call-accepted', ({ accepterId }) => {
            setCallStatus('connected');
            // Start WebRTC connection
            setupWebRTC(stream, newSocket);
        });

        newSocket.on('call-rejected', () => {
            alert('Call was rejected');
            navigate('/dashboard');
        });

        newSocket.on('user-disconnected', () => {
            alert('Other user disconnected');
            handleEndCall();
        });

        return () => {
            // Cleanup when component unmounts
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, [roomId]);

    const setupWebRTC = async (stream, socket) => {
        const configuration = {
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        };

        const peerConnection = new RTCPeerConnection(configuration);
        peerConnectionRef.current = peerConnection;

        stream.getTracks().forEach(track => {
            peerConnection.addTrack(track, stream);
        });

        peerConnection.ontrack = (event) => {
            remoteVideoRef.current.srcObject = event.streams[0];
        };

        socket.emit('join-room', roomId);

        // Handle WebRTC signaling
        socket.on('offer', async (offer) => {
            await peerConnection.setRemoteDescription(offer);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit('answer', answer, roomId);
        });

        socket.on('answer', async (answer) => {
            await peerConnection.setRemoteDescription(answer);
        });

        socket.on('ice-candidate', async (candidate) => {
            await peerConnection.addIceCandidate(candidate);
        });

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', event.candidate, roomId);
            }
        };
    };

    const toggleAudio = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                <Grid item xs={12} md={9}>
                    <Paper sx={{ p: 2, height: '70vh', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
                            <Box sx={{ flex: 1, position: 'relative' }}>
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        position: 'absolute',
                                        bottom: 8,
                                        left: 8,
                                        color: 'white',
                                        bgcolor: 'rgba(0,0,0,0.5)',
                                        padding: '4px 8px',
                                        borderRadius: '4px'
                                    }}
                                >
                                    You {isMuted && '(Muted)'} {isVideoOff && '(Video Off)'}
                                </Typography>
                            </Box>
                            <Box sx={{ flex: 1, position: 'relative' }}>
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: '8px'
                                    }}
                                />
                            </Box>
                        </Box>
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            gap: 2, 
                            mt: 2,
                            p: 2,
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            borderRadius: '8px'
                        }}>
                            <IconButton 
                                onClick={toggleAudio}
                                sx={{ 
                                    backgroundColor: isMuted ? 'error.main' : 'primary.main',
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: isMuted ? 'error.dark' : 'primary.dark',
                                    }
                                }}
                            >
                                {isMuted ? <MicOff /> : <Mic />}
                            </IconButton>
                            <IconButton 
                                onClick={toggleVideo}
                                sx={{ 
                                    backgroundColor: isVideoOff ? 'error.main' : 'primary.main',
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: isVideoOff ? 'error.dark' : 'primary.dark',
                                    }
                                }}
                            >
                                {isVideoOff ? <VideocamOff /> : <Videocam />}
                            </IconButton>
                            <IconButton 
                                onClick={handleEndCall}
                                sx={{ 
                                    backgroundColor: 'error.main',
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: 'error.dark',
                                    }
                                }}
                            >
                                <CallEnd />
                            </IconButton>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                    <ChatBox socket={socket} roomId={roomId} />
                </Grid>
            </Grid>
        </Container>
    );
};

export default VideoChat;
