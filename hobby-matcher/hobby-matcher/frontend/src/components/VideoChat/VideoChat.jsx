// import './VideoChat.css';
// import { useState, useEffect, useRef } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';
// import { io } from 'socket.io-client';
// import {
//     Container,
//     Grid,
//     Paper,
//     Typography,
//     Box,
//     IconButton
// } from '@mui/material';
// import {
//     Mic,
//     MicOff,
//     Videocam,
//     VideocamOff,
//     CallEnd
// } from '@mui/icons-material';
// import ChatBox from './ChatBox';
// const API_URL = import.meta.env.VITE_API_URL;

// const VideoChat = () => {
//     const { roomId } = useParams();
//     const { user } = useAuth();
//     const navigate = useNavigate();
//     const [socket, setSocket] = useState(null);
//     const [stream, setStream] = useState(null);
//     const [isMuted, setIsMuted] = useState(false);
//     const [isVideoOff, setIsVideoOff] = useState(false);

//     const localVideoRef = useRef();
//     const remoteVideoRef = useRef();
//     const peerConnectionRef = useRef();
//     const socketRef = useRef();

//     const handleEndCall = () => {
//         console.log('Ending call...');
//         try {
//             // Notify other user
//             if (socketRef.current) {
//                 socketRef.current.emit('end-call', { roomId });
//             }

//             // Stop all tracks
//             if (stream) {
//                 stream.getTracks().forEach(track => {
//                     track.stop();
//                 });
//                 setStream(null);
//             }

//             // Clear video elements
//             if (localVideoRef.current) {
//                 localVideoRef.current.srcObject = null;
//             }
//             if (remoteVideoRef.current) {
//                 remoteVideoRef.current.srcObject = null;
//             }

//             // Close peer connection
//             if (peerConnectionRef.current) {
//                 peerConnectionRef.current.close();
//                 peerConnectionRef.current = null;
//             }

//             navigate('/dashboard');
//         } catch (error) {
//             console.error('Error ending call:', error);
//             navigate('/dashboard');
//         }
//     };

//     const setupWebRTC = async (mediaStream) => {
//         // const configuration = {
//         //     iceServers: [
//         //         { urls: 'stun:stun.l.google.com:19302' },
//         //         { urls: 'stun:stun1.l.google.com:19302' },
//         //         { urls: 'stun:stun2.l.google.com:19302' },
//         //         { urls: 'stun:stun3.l.google.com:19302' },
//         //         { urls: 'stun:stun4.l.google.com:19302' }
//         //     ]
//         // };
//         const configuration = {
//             iceServers: [
//                 { urls: 'stun:stun.l.google.com:19302' },
//                 { urls: 'stun:stun1.l.google.com:19302' },
//                 {
//                     urls: 'turn:relay1.expressturn.com:3478',
//                     username: 'efacee72b54e6342eb6a450bf8b458b8',
//                     credential: 'b0b4beef477d6c889a0702b335f3363a'
//                 }
//             ]
//         };

//         const peerConnection = new RTCPeerConnection(configuration);
//         peerConnectionRef.current = peerConnection;

//         // Add local tracks to peer connection
//         mediaStream.getTracks().forEach(track => {
//             console.log('Adding local track:', track.kind);
//             peerConnection.addTrack(track, mediaStream);
//         });

//         // Handle remote stream
//         peerConnection.ontrack = (event) => {
//             console.log('Received remote track:', event.track.kind);
//             if (remoteVideoRef.current && event.streams[0]) {
//                 console.log('Setting remote stream to video element');
//                 remoteVideoRef.current.srcObject = event.streams[0];
//                 // Ensure video plays
//                 remoteVideoRef.current.play().catch(e => console.log('Play error:', e));
//             }
//         };

//         // Log connection state changes
//         peerConnection.onconnectionstatechange = () => {
//             console.log('Connection state:', peerConnection.connectionState);
//         };

//         peerConnection.oniceconnectionstatechange = () => {
//             console.log('ICE connection state:', peerConnection.iceConnectionState);
//         };

//         peerConnection.onicegatheringstatechange = () => {
//             console.log('ICE gathering state:', peerConnection.iceGatheringState);
//         };

//         // Handle ICE candidates
//         peerConnection.onicecandidate = (event) => {
//             if (event.candidate && socketRef.current) {
//                 console.log('Sending ICE candidate');
//                 socketRef.current.emit('ice-candidate', {
//                     candidate: event.candidate,
//                     roomId
//                 });
//             }
//         };

//         return peerConnection;
//     };

//     useEffect(() => {
//         let mounted = true;
    
//         const init = async () => {
//             try {
//                 const newSocket = io(API_URL);
//                 socketRef.current = newSocket;
//                 if (mounted) setSocket(newSocket);
    
//                 const mediaStream = await navigator.mediaDevices.getUserMedia({
//                     video: true,
//                     audio: true
//                 });
    
//                 if (mounted) {
//                     setStream(mediaStream);
//                     if (localVideoRef.current) {
//                         localVideoRef.current.srcObject = mediaStream;
//                     }
//                 }
    
//                 const peerConnection = await setupWebRTC(mediaStream);
                
//                 // Join room first
//                 newSocket.emit('join-room', roomId);
    
//                 // Handle ICE candidates
//                 newSocket.on('ice-candidate', async ({ candidate, from }) => {
//                     try {
//                         if (from !== newSocket.id) {
//                             console.log('Received ICE candidate from:', from);
//                             if (peerConnection.remoteDescription) {
//                                 await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
//                             }
//                         }
//                     } catch (error) {
//                         console.error('Error adding ICE candidate:', error);
//                     }
//                 });
    
//                 // Handle offer
//                 newSocket.on('offer', async ({ offer, from }) => {
//                     if (from !== newSocket.id) {
//                         try {
//                             console.log('Received offer from:', from);
//                             await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                            
//                             const answer = await peerConnection.createAnswer();
//                             await peerConnection.setLocalDescription(answer);
                            
//                             console.log('Sending answer');
//                             newSocket.emit('answer', { answer, roomId });
//                         } catch (error) {
//                             console.error('Error handling offer:', error);
//                         }
//                     }
//                 });
    
//                 // Handle answer
//                 newSocket.on('answer', async ({ answer, from }) => {
//                     if (from !== newSocket.id) {
//                         try {
//                             console.log('Received answer from:', from);
//                             await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
//                         } catch (error) {
//                             console.error('Error handling answer:', error);
//                         }
//                     }
//                 });
    
//                 // Create and send offer after a short delay
//                 setTimeout(async () => {
//                     try {
//                         console.log('Creating offer');
//                         const offer = await peerConnection.createOffer({
//                             offerToReceiveAudio: true,
//                             offerToReceiveVideo: true
//                         });
//                         await peerConnection.setLocalDescription(offer);
//                         newSocket.emit('offer', { offer, roomId });
//                     } catch (error) {
//                         console.error('Error creating offer:', error);
//                     }
//                 }, 1000);
    
//             } catch (error) {
//                 console.error('Error:', error);
//                 if (mounted) navigate('/dashboard');
//             }
//         };
    
//         init();
    
//         return () => {
//             mounted = false;
//             if (stream) {
//                 stream.getTracks().forEach(track => track.stop());
//             }
//             if (peerConnectionRef.current) {
//                 peerConnectionRef.current.close();
//             }
//             if (socketRef.current) {
//                 socketRef.current.disconnect();
//             }
//         };
//     }, [roomId, navigate]);

//     const toggleAudio = () => {
//         if (stream) {
//             const audioTrack = stream.getAudioTracks()[0];
//             if (audioTrack) {
//                 audioTrack.enabled = !audioTrack.enabled;
//                 setIsMuted(!audioTrack.enabled);
//             }
//         }
//     };

//     const toggleVideo = () => {
//         if (stream) {
//             const videoTrack = stream.getVideoTracks()[0];
//             if (videoTrack) {
//                 videoTrack.enabled = !videoTrack.enabled;
//                 setIsVideoOff(!videoTrack.enabled);
//             }
//         }
//     };

//     return (
//         <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
//             <Grid container spacing={3}>
//                 <Grid item xs={12} md={9}>
//                     <Paper sx={{ p: 2, height: '70vh', display: 'flex', flexDirection: 'column' }}>
//                         <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
//                             <Box sx={{ flex: 1, position: 'relative' }}>
//                                 <video
//                                     ref={localVideoRef}
//                                     autoPlay
//                                     muted
//                                     playsInline
//                                     style={{
//                                         width: '100%',
//                                         height: '100%',
//                                         objectFit: 'cover',
//                                         borderRadius: '8px'
//                                     }}
//                                 />
//                                 <Typography
//                                     variant="caption"
//                                     sx={{
//                                         position: 'absolute',
//                                         bottom: 8,
//                                         left: 8,
//                                         color: 'white',
//                                         bgcolor: 'rgba(0,0,0,0.5)',
//                                         padding: '4px 8px',
//                                         borderRadius: '4px'
//                                     }}
//                                 >
//                                     You {isMuted && '(Muted)'} {isVideoOff && '(Video Off)'}
//                                 </Typography>
//                             </Box>
//                             <Box sx={{ flex: 1, position: 'relative' }}>
//                                 <video
//                                     ref={remoteVideoRef}
//                                     autoPlay
//                                     playsInline
//                                     style={{
//                                         width: '100%',
//                                         height: '100%',
//                                         objectFit: 'cover',
//                                         borderRadius: '8px',
//                                         backgroundColor: '#000'
//                                     }}
//                                 />
//                             </Box>
//                         </Box>
//                         <Box sx={{ 
//                             display: 'flex', 
//                             justifyContent: 'center', 
//                             gap: 2, 
//                             mt: 2,
//                             p: 2,
//                             backgroundColor: 'rgba(0,0,0,0.05)',
//                             borderRadius: '8px'
//                         }}>
//                             <IconButton 
//                                 onClick={toggleAudio}
//                                 sx={{ 
//                                     backgroundColor: isMuted ? 'error.main' : 'primary.main',
//                                     color: 'white',
//                                     '&:hover': {
//                                         backgroundColor: isMuted ? 'error.dark' : 'primary.dark',
//                                     }
//                                 }}
//                             >
//                                 {isMuted ? <MicOff /> : <Mic />}
//                             </IconButton>
//                             <IconButton 
//                                 onClick={toggleVideo}
//                                 sx={{ 
//                                     backgroundColor: isVideoOff ? 'error.main' : 'primary.main',
//                                     color: 'white',
//                                     '&:hover': {
//                                         backgroundColor: isVideoOff ? 'error.dark' : 'primary.dark',
//                                     }
//                                 }}
//                             >
//                                 {isVideoOff ? <VideocamOff /> : <Videocam />}
//                             </IconButton>
//                             <IconButton 
//                                 onClick={handleEndCall}
//                                 sx={{ 
//                                     backgroundColor: 'error.main',
//                                     color: 'white',
//                                     '&:hover': {
//                                         backgroundColor: 'error.dark',
//                                     }
//                                 }}
//                             >
//                                 <CallEnd />
//                             </IconButton>
//                         </Box>
//                     </Paper>
//                 </Grid>
//                 <Grid item xs={12} md={3}>
//                     <ChatBox socket={socket} roomId={roomId} />
//                 </Grid>
//             </Grid>
//         </Container>
//     );
// };

// export default VideoChat;

//-----------------------------------------------------------------------------


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
    const pendingCandidates = useRef([]); // Store ICE candidates until remote description is set

    const handleEndCall = () => {
        console.log('Ending call...');
        try {
            if (socketRef.current) {
                socketRef.current.emit('end-call', { roomId });
            }
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
            if (localVideoRef.current) localVideoRef.current.srcObject = null;
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
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
                {
                    urls: 'turn:relay1.expressturn.com:3478',
                    username: 'efacee72b54e6342eb6a450bf8b458b8',
                    credential: 'b0b4beef477d6c889a0702b335f3363a'
                }
            ]
        };

        const peerConnection = new RTCPeerConnection(configuration);
        peerConnectionRef.current = peerConnection;

        mediaStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, mediaStream);
        });

        peerConnection.ontrack = (event) => {
            if (remoteVideoRef.current && event.streams[0]) {
                remoteVideoRef.current.srcObject = event.streams[0];
                remoteVideoRef.current.play().catch(e => console.log('Play error:', e));
            }
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.emit('ice-candidate', { candidate: event.candidate, roomId });
            }
        };

        peerConnection.oniceconnectionstatechange = async () => {
            if (peerConnection.remoteDescription && pendingCandidates.current.length > 0) {
                console.log('Adding stored ICE candidates...');
                for (const candidate of pendingCandidates.current) {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                }
                pendingCandidates.current = [];
            }
        };

        return peerConnection;
    };

    useEffect(() => {
        let mounted = true;
    
        const init = async () => {
            console.log("API_URL:", API_URL);
            if (!API_URL) {
                console.error("API_URL is not defined. Check your .env file.");
                navigate('/dashboard');
                return;
            }

            try {
                const newSocket = io(API_URL);
                socketRef.current = newSocket;
                if (mounted) setSocket(newSocket);

                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

                if (mounted) {
                    setStream(mediaStream);
                    if (localVideoRef.current) localVideoRef.current.srcObject = mediaStream;
                }

                const peerConnection = await setupWebRTC(mediaStream);

                newSocket.emit('join-room', roomId);

                newSocket.on('ice-candidate', async ({ candidate, from }) => {
                    if (from !== newSocket.id) {
                        console.log('Received ICE candidate from:', from);
                        if (peerConnection.remoteDescription) {
                            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                        } else {
                            console.warn('Remote description not set yet. Storing ICE candidate...');
                            pendingCandidates.current.push(candidate);
                        }
                    }
                });

                newSocket.on('offer', async ({ offer, from }) => {
                    if (from !== newSocket.id) {
                        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                        const answer = await peerConnection.createAnswer();
                        await peerConnection.setLocalDescription(answer);
                        newSocket.emit('answer', { answer, roomId });
                    }
                });

                newSocket.on('answer', async ({ answer, from }) => {
                    if (from !== newSocket.id) {
                        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                    }
                });

                setTimeout(async () => {
                    try {
                        const offer = await peerConnection.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
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
            if (stream) stream.getTracks().forEach(track => track.stop());
            if (peerConnectionRef.current) peerConnectionRef.current.close();
            if (socketRef.current) socketRef.current.disconnect();
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
            <Grid container spacing={3}>
                <Grid item xs={12} md={9}>
                    <Paper sx={{ p: 2, height: '70vh', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
                            <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                            <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', backgroundColor: '#000' }} />
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
