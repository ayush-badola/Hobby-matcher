import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <AppBar 
            position="static" 
            sx={{
                background: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            }}
        >
            <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography 
                    variant="h6" 
                    sx={{ 
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #FFFFFF 0%, #E0E0E0 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    Hobby Matcher
                </Typography>
                {user && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            startIcon={<DashboardIcon />}
                            onClick={() => navigate('/dashboard')}
                            sx={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(10px)',
                                color: 'white',
                                '&:hover': {
                                    background: 'rgba(255, 255, 255, 0.3)',
                                    transform: 'scale(1.05)'
                                },
                                transition: 'all 0.3s ease'
                            }}
                        >
                            Dashboard
                        </Button>
                        <Button
                            startIcon={<LogoutIcon />}
                            onClick={handleLogout}
                            sx={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(10px)',
                                color: 'white',
                                '&:hover': {
                                    background: 'rgba(255, 255, 255, 0.3)',
                                    transform: 'scale(1.05)'
                                },
                                transition: 'all 0.3s ease'
                            }}
                        >
                            Logout
                        </Button>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;