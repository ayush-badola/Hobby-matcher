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
                const newSocket = io('https://hobby-matcher-7-s60w.onrender.com');
                socketRef.current = newSocket;
                if (mounted) setSocket(newSocket);

                // Handle call end from other user
                newSocket.on('call-ended', () => {
                    console.log('Call ended by remote user');
                    handleEndCall();
                });

                // Handle user disconnection
                newSocket.on('user-disconnected', () => {
                    console.log('Remote user disconnected');
                    handleEndCall();
                });

                // Get media stream first
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                
                if (mounted) {
                    setStream(mediaStream);
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = mediaStream;
                        remoteVideoRef.current.srcObject=mediaStream;
                    }
                }

                const peerConnection = await setupWebRTC(mediaStream);

                // Handle ICE candidates
                newSocket.on('ice-candidate', async ({ candidate }) => {
                    try {
                        console.log('Received ICE candidate');
                        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (error) {
                        console.error('Error adding ICE candidate:', error);
                    }
                });

                // Handle offer
                newSocket.on('offer', async ({ offer }) => {
                    try {
                        console.log('Received offer');
                        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                        console.log('Created remote description');
                        
                        const answer = await peerConnection.createAnswer();
                        await peerConnection.setLocalDescription(answer);
                        console.log('Sending answer');
                        newSocket.emit('answer', { answer, roomId });
                    } catch (error) {
                        console.error('Error handling offer:', error);
                    }
                });

                // Handle answer
                newSocket.on('answer', async ({ answer }) => {
                    try {
                        console.log('Received answer');
                        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                        console.log('Set remote description');
                    } catch (error) {
                        console.error('Error handling answer:', error);
                    }
                });

                // Join room
                newSocket.emit('join-room', roomId, async (isInitiator) => {
                    if (isInitiator && mounted) {
                        try {
                            console.log('Creating offer as initiator');
                            const offer = await peerConnection.createOffer({
                                offerToReceiveAudio: true,
                                offerToReceiveVideo: true
                            });
                            await peerConnection.setLocalDescription(offer);
                            newSocket.emit('offer', { offer, roomId });
                        } catch (error) {
                            console.error('Error creating offer:', error);
                        }
                    }
                });

            } catch (error) {
                console.error('Error:', error);
                if (mounted) navigate('/dashboard');
            }
        };

        init();

        // Cleanup function
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
    }, [roomId]);

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
                                        borderRadius: '8px',
                                        backgroundColor: '#000'
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