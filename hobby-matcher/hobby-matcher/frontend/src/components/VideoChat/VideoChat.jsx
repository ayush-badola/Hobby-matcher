import './VideoChat.css';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL;

const VideoChat = () => {
    const { roomId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const [stream, setStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const peerConnectionRef = useRef();
    const socketRef = useRef();

    const handleEndCall = () => {
        console.log('Ending call...');
        try {
            // Notify other user
            if (socketRef.current) {
                socketRef.current.emit('end-call', { roomId });
            }

            // Stop all tracks
            if (stream) {
                stream.getTracks().forEach(track => {
                    track.stop();
                });
                setStream(null);
            }

            // Clear video elements
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = null;
            }
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
            }

            // Close peer connection
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }

            navigate('/dashboard');
        } catch (error) {
            console.error('Error ending call:', error);
            navigate('/dashboard');
        }
    };

    const setupWebRTC = async (mediaStream) => {
        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' }
            ]
        };

        const peerConnection = new RTCPeerConnection(configuration);
        peerConnectionRef.current = peerConnection;

        // Add local tracks to peer connection
        mediaStream.getTracks().forEach(track => {
            console.log('Adding local track:', track.kind);
            peerConnection.addTrack(track, mediaStream);
        });

        // Handle remote stream
        peerConnection.ontrack = (event) => {
            console.log('Received remote track:', event.track.kind);
            if (remoteVideoRef.current && event.streams[0]) {
                console.log('Setting remote stream to video element');
                remoteVideoRef.current.srcObject = event.streams[0];
                // Ensure video plays
                remoteVideoRef.current.play().catch(e => console.log('Play error:', e));
            }
        };

        // Log connection state changes
        peerConnection.onconnectionstatechange = () => {
            console.log('Connection state:', peerConnection.connectionState);
        };

        peerConnection.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', peerConnection.iceConnectionState);
        };

        peerConnection.onicegatheringstatechange = () => {
            console.log('ICE gathering state:', peerConnection.iceGatheringState);
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                console.log('Sending ICE candidate');
                socketRef.current.emit('ice-candidate', {
                    candidate: event.candidate,
                    roomId
                });
            }
        };

        return peerConnection;
    };

    useEffect(() => {
        let mounted = true;
    
        const init = async () => {
            try {
                const newSocket = io(API_URL);
                socketRef.current = newSocket;
                if (mounted) setSocket(newSocket);
    
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
    
                if (mounted) {
                    setStream(mediaStream);
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = mediaStream;
                    }
                }
    
                const peerConnection = await setupWebRTC(mediaStream);
                
                // Join room first
                newSocket.emit('join-room', roomId);
    
                // Handle ICE candidates
                newSocket.on('ice-candidate', async ({ candidate, from }) => {
                    try {
                        if (from !== newSocket.id) {
                            console.log('Received ICE candidate from:', from);
                            if (peerConnection.remoteDescription) {
                                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                            }
                        }
                    } catch (error) {
                        console.error('Error adding ICE candidate:', error);
                    }
                });
    
                // Handle offer
                newSocket.on('offer', async ({ offer, from }) => {
                    if (from !== newSocket.id) {
                        try {
                            console.log('Received offer from:', from);
                            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                            
                            const answer = await peerConnection.createAnswer();
                            await peerConnection.setLocalDescription(answer);
                            
                            console.log('Sending answer');
                            newSocket.emit('answer', { answer, roomId });
                        } catch (error) {
                            console.error('Error handling offer:', error);
                        }
                    }
                });
    
                // Handle answer
                newSocket.on('answer', async ({ answer, from }) => {
                    if (from !== newSocket.id) {
                        try {
                            console.log('Received answer from:', from);
                            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                        } catch (error) {
                            console.error('Error handling answer:', error);
                        }
                    }
                });
    
                // Create and send offer after a short delay
                setTimeout(async () => {
                    try {
                        console.log('Creating offer');
                        const offer = await peerConnection.createOffer({
                            offerToReceiveAudio: true,
                            offerToReceiveVideo: true
                        });
                        await peerConnection.setLocalDescription(offer);
                        newSocket.emit('offer', { offer, roomId });
                    } catch (error) {
                        console.error('Error creating offer:', error);
                    }
                }, 1000);
    
            } catch (error) {
                console.error('Error:', error);
                if (mounted) navigate('/dashboard');
            }
        };
    
        init();
    
        return () => {
            mounted = false;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [roomId, navigate]);

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
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Grid container spacing={3}>
                    <Grid item xs={12} md={9}>
                        <Paper 
                            sx={{ 
                                p: 2, 
                                height: '70vh', 
                                display: 'flex', 
                                flexDirection: 'column',
                                background: 'linear-gradient(135deg, #a18cd1 0%, #8675df 100%)', // New color
                                borderRadius: '16px',
                                overflow: 'hidden',
                                boxShadow: '0 8px 32px rgba(161, 140, 209, 0.2)' // Updated shadow color
                            }}
                            className="video-container"
                        >
                            <Box sx={{ display: 'flex', gap: 2, height: '100%', position: 'relative' }}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5 }}
                                    style={{ flex: 1 }}
                                >
                                    <Box sx={{ position: 'relative', height: '100%' }}>
                                        <video
                                            ref={localVideoRef}
                                            autoPlay
                                            muted
                                            playsInline
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                borderRadius: '12px',
                                                transform: 'scaleX(-1)'
                                            }}
                                            className="video-stream"
                                        />
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                bottom: 16,
                                                left: 16,
                                                padding: '8px 16px',
                                                borderRadius: '20px',
                                                background: 'rgba(0,0,0,0.6)',
                                                backdropFilter: 'blur(10px)',
                                                color: 'white',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            <Typography variant="body2">
                                                You {isMuted && '(Muted)'} {isVideoOff && '(Video Off)'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    style={{ flex: 1 }}
                                >
                                    <Box sx={{ position: 'relative', height: '100%' }}>
                                        <video
                                            ref={remoteVideoRef}
                                            autoPlay
                                            playsInline
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                borderRadius: '12px',
                                                backgroundColor: '#000'
                                            }}
                                            className="video-stream"
                                        />
                                    </Box>
                                </motion.div>
                            </Box>

                            <Box 
                                className="controls-wrapper"
                                sx={{
                                    position: 'absolute',
                                    bottom: 20,
                                    left: 0,
                                    right: 0,
                                    zIndex: 100,
                                    pointerEvents: 'none'
                                }}
                            >
                                <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    gap: 2, 
                                    p: 2,
                                    borderRadius: '16px',
                                    background: 'rgba(0,0,0,0.6)',
                                    backdropFilter: 'blur(10px)',
                                    pointerEvents: 'auto'
                                }}>
                                    <IconButton 
                                        onClick={toggleAudio}
                                        className="control-button"
                                        sx={{ 
                                            width: '56px',
                                            height: '56px',
                                            background: isMuted ? 'rgba(244,67,54,0.8)' : 'rgba(0,0,0,0.6)',
                                            color: 'white',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                background: isMuted ? 'rgba(244,67,54,1)' : 'rgba(0,0,0,0.8)',
                                                transform: 'scale(1.1)'
                                            }
                                        }}
                                    >
                                        {isMuted ? <MicOff /> : <Mic />}
                                    </IconButton>

                                    <IconButton 
                                        onClick={toggleVideo}
                                        className="control-button"
                                        sx={{ 
                                            width: '56px',
                                            height: '56px',
                                            background: isVideoOff ? 'rgba(244,67,54,0.8)' : 'rgba(255,255,255,0.2)',
                                            color: 'white',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                background: isVideoOff ? 'rgba(244,67,54,1)' : 'rgba(255,255,255,0.3)',
                                                transform: 'scale(1.1)'
                                            }
                                        }}
                                    >
                                        {isVideoOff ? <VideocamOff /> : <Videocam />}
                                    </IconButton>

                                    <IconButton 
                                        onClick={handleEndCall}
                                        className="control-button end-call"
                                        sx={{ 
                                            width: '56px',
                                            height: '56px',
                                            background: 'rgba(244,67,54,0.8)',
                                            color: 'white',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                background: 'rgba(244,67,54,1)',
                                                transform: 'scale(1.1)'
                                            }
                                        }}
                                    >
                                        <CallEnd />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                        >
                            <ChatBox socket={socket} roomId={roomId} />
                        </motion.div>
                    </Grid>
                </Grid>
            </motion.div>
        </Container>
    );
};

export default VideoChat;