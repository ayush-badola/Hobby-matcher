import './Auth.css';
import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    Stepper,
    Step,
    StepLabel,
    Chip,
    Stack,
    CircularProgress
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';

const HOBBY_OPTIONS = [
    'Reading', 'Gaming', 'Cooking', 'Photography', 'Traveling',
    'Music', 'Sports', 'Art', 'Dancing', 'Writing',
    'Hiking', 'Programming', 'Gardening', 'Movies', 'Fitness'
];

const HOBBY_KEYWORDS = {
    'Reading': ['read', 'book', 'novel', 'literature'],
    'Gaming': ['game', 'play', 'gaming', 'video games', 'playstation', 'xbox'],
    'Cooking': ['cook', 'baking', 'food', 'recipe', 'kitchen'],
    'Photography': ['photo', 'camera', 'picture', 'shoot'],
    'Traveling': ['travel', 'trip', 'journey', 'explore', 'touring'],
    'Music': ['music', 'sing', 'song', 'instrument', 'guitar', 'piano'],
    'Sports': ['sport', 'football', 'basketball', 'tennis', 'athletic', 'exercise'],
    'Art': ['art', 'draw', 'paint', 'sketch', 'creative'],
    'Dancing': ['dance', 'choreography', 'ballet', 'dancing'],
    'Writing': ['write', 'blog', 'story', 'poem', 'writing'],
    'Hiking': ['hike', 'trekking', 'mountain', 'trail'],
    'Programming': ['code', 'program', 'develop', 'software'],
    'Gardening': ['garden', 'plant', 'flower', 'grow'],
    'Movies': ['movie', 'film', 'cinema', 'watch'],
    'Fitness': ['gym', 'exercise', 'workout', 'fitness']
};

const RECORDING_DURATION = 10000; // 10 seconds
const ANIMATION_INTERVAL = 100; // For smooth progress animation

const Register = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        hobbies: []
    });
    
    const { register, error } = useAuth();
    const navigate = useNavigate();

    const [isRecording, setIsRecording] = useState(false);
    const [spokenText, setSpokenText] = useState('');
    const mediaRecorderRef = useRef(null);
    const speechRecognitionRef = useRef(null);
    const [recordingProgress, setRecordingProgress] = useState(0);
    const progressTimerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (speechRecognitionRef.current) {
                speechRecognitionRef.current.stop();
            }
            if (progressTimerRef.current) {
                clearInterval(progressTimerRef.current);
            }
        };
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleHobbyToggle = (hobby) => {
        setFormData(prev => ({
            ...prev,
            hobbies: prev.hobbies.includes(hobby)
                ? prev.hobbies.filter(h => h !== hobby)
                : [...prev.hobbies, hobby]
        }));
    };

    const handleNext = () => {
        if (activeStep === 0) {
            if (formData.password !== formData.confirmPassword) {
                alert("Passwords don't match!");
                return;
            }
        }
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.hobbies.length < 3) {
            alert('Please select at least 3 hobbies');
            return;
        }
        try {
            await register(formData);
            navigate('/login');
        } catch (err) {
            console.error('Registration error:', err);
        }
    };

    const extractHobbiesFromText = (text) => {
        const lowercaseText = text.toLowerCase();
        const extractedHobbies = new Set();

        Object.entries(HOBBY_KEYWORDS).forEach(([hobby, keywords]) => {
            keywords.forEach(keyword => {
                if (lowercaseText.includes(keyword.toLowerCase())) {
                    extractedHobbies.add(hobby);
                }
            });
        });

        return Array.from(extractedHobbies);
    };

    const startRecordingTimer = () => {
        const startTime = Date.now();
        const duration = 10000; // 10 seconds

        progressTimerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = (elapsed / duration) * 100;

            if (progress >= 100) {
                stopSpeechRecognition();
            } else {
                setRecordingProgress(progress);
            }
        }, 100);

        setTimeout(() => {
            stopSpeechRecognition();
        }, duration);
    };

    const startSpeechRecognition = () => {
        if (speechRecognitionRef.current) {
            speechRecognitionRef.current.stop();
        }
        if (progressTimerRef.current) {
            clearInterval(progressTimerRef.current);
        }

        setRecordingProgress(0);
        setSpokenText('');

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
            setIsRecording(true);
            startRecordingTimer();
        };

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            setSpokenText(transcript);

            // Extract hobbies from the spoken text and update formData
            const extractedHobbies = extractHobbiesFromText(transcript);
            setFormData(prev => ({
                ...prev,
                hobbies: Array.from(new Set([...prev.hobbies, ...extractedHobbies]))
            }));
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            stopSpeechRecognition();
        };

        recognition.onend = () => {
            stopSpeechRecognition();
        };

        speechRecognitionRef.current = recognition;
        recognition.start();
    };

    const stopSpeechRecognition = () => {
        if (speechRecognitionRef.current) {
            speechRecognitionRef.current.stop();
            speechRecognitionRef.current = null;
        }
        if (progressTimerRef.current) {
            clearInterval(progressTimerRef.current);
            progressTimerRef.current = null;
        }
        setIsRecording(false);
        setRecordingProgress(0);
    };

    const renderSpeechInput = () => (
        <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="body1" gutterBottom>
                Tell us about yourself and your interests:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, position: 'relative' }}>
                <Button
                    variant="contained"
                    color={isRecording ? "error" : "primary"}
                    startIcon={isRecording ? <StopIcon /> : <MicIcon />}
                    onClick={isRecording ? stopSpeechRecognition : startSpeechRecognition}
                    className="recording-button"
                    disabled={isRecording && recordingProgress >= 100}
                >
                    {isRecording ? "Stop Recording" : "Start Recording"}
                </Button>
                {isRecording && (
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                        <CircularProgress
                            variant="determinate"
                            value={recordingProgress}
                            size={24}
                            thickness={6}
                            className="recording-progress"
                        />
                        <Box className="recording-waves" />
                    </Box>
                )}
            </Box>
            {spokenText && (
                <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
                    <Typography variant="body2">{spokenText}</Typography>
                </Paper>
            )}
        </Box>
    );

    const steps = ['Account Details', 'Select Hobbies'];

    return (
        <Container component="main" maxWidth="sm">
            <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
                <Typography component="h1" variant="h5" align="center">
                    Register
                </Typography>

                <Stepper activeStep={activeStep} sx={{ mt: 3, mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}

                {activeStep === 0 ? (
                    <Box component="form" sx={{ mt: 2 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="username"
                            label="Username"
                            type="text"
                            id="username"
                            value={formData.username}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="email"
                            label="Email Address"
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label="Confirm Password"
                            type="password"
                            id="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                    </Box>
                ) : (
                    <Box sx={{ mt: 2 }}>
                        {renderSpeechInput()}
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Select or confirm your hobbies:
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                            {HOBBY_OPTIONS.map((hobby) => (
                                <Chip
                                    key={hobby}
                                    label={hobby}
                                    onClick={() => handleHobbyToggle(hobby)}
                                    color={formData.hobbies.includes(hobby) ? "primary" : "default"}
                                    sx={{ mb: 1 }}
                                />
                            ))}
                        </Stack>
                    </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button
                        onClick={handleBack}
                        disabled={activeStep === 0}
                    >
                        Back
                    </Button>
                    {activeStep === steps.length - 1 ? (
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={formData.hobbies.length < 3}
                        >
                            Register
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={handleNext}
                        >
                            Next
                        </Button>
                    )}
                </Box>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Link to="/login" style={{ textDecoration: 'none' }}>
                        <Typography variant="body2" color="primary">
                            Already have an account? Sign In
                        </Typography>
                    </Link>
                </Box>
            </Paper>
        </Container>
    );
};

export default Register;