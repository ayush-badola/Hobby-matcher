
import './Auth.css';
import { useState } from 'react';
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
    Stack
} from '@mui/material';

const HOBBY_OPTIONS = [
    'Reading', 'Gaming', 'Cooking', 'Photography', 'Traveling',
    'Music', 'Sports', 'Art', 'Dancing', 'Writing',
    'Hiking', 'Programming', 'Gardening', 'Movies', 'Fitness'
];

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
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Select at least 3 hobbies that interest you:
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