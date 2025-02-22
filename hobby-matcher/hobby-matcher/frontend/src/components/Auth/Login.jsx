import './Auth.css';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert
} from '@mui/material';

const Login = () => {
    console.log('Login component rendering');
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const { login, error } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(formData.email, formData.password);
            navigate('/dashboard');
        } catch (err) {
            console.error('Login error:', err);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Paper elevation={3} className="auth-paper" sx={{ p: 4, mt: 8 }}>
                    <Box className="auth-background-animation" />
                    <Typography variant="h4" className="auth-title">
                        Welcome Back
                    </Typography>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                                {error}
                            </Alert>
                        </motion.div>
                    )}
                    <Box component="form" onSubmit={handleSubmit}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <TextField
                                className="auth-input"
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label="Email Address"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <TextField
                                className="auth-input"
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                id="password"
                                autoComplete="current-password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Button
                                className="auth-button"
                                type="submit"
                                fullWidth
                                variant="contained"
                            >
                                Sign In
                            </Button>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                <Link 
                                    to="/register" 
                                    style={{ 
                                        textDecoration: 'none',
                                        cursor: 'pointer',
                                        display: 'inline-block'
                                    }}
                                >
                                    <Typography 
                                        variant="body1" 
                                        className="auth-link"
                                        sx={{
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                            },
                                            transition: 'transform 0.3s ease'
                                        }}
                                    >
                                        Don't have an account? Sign Up
                                    </Typography>
                                </Link>
                            </Box>
                        </motion.div>
                    </Box>
                </Paper>
            </motion.div>
        </Container>
    );
};

export default Login;