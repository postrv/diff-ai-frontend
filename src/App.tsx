// File: src/App.tsx
import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Container,
    LinearProgress,
    IconButton,
    Tooltip,
    useMediaQuery,
    Menu,
    MenuItem,
    Divider,
    Avatar
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import PersonIcon from '@mui/icons-material/Person';
import HelpIcon from '@mui/icons-material/Help';
import HomePage from './pages/HomePage';
import { getCurrentUser } from './services/api';

function App() {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [darkMode, setDarkMode] = useState(prefersDarkMode);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<null | { username: string }>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const isMenuOpen = Boolean(anchorEl);

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('auth_token');
        if (token) {
            getCurrentUser()
                .then(response => {
                    setUser(response.data);
                })
                .catch(() => {
                    // Clear invalid token
                    localStorage.removeItem('auth_token');
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const theme = responsiveFontSizes(createTheme({
        palette: {
            mode: darkMode ? 'dark' : 'light',
            primary: {
                main: darkMode ? '#90caf9' : '#1976d2',
            },
            secondary: {
                main: darkMode ? '#f48fb1' : '#dc004e',
            },
            background: {
                default: darkMode ? '#121212' : '#f5f5f5',
                paper: darkMode ? '#1e1e1e' : '#ffffff',
            },
        },
        typography: {
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            h4: {
                fontWeight: 600,
            },
            h5: {
                fontWeight: 500,
            },
            h6: {
                fontWeight: 500,
            },
        },
        shape: {
            borderRadius: 8,
        },
        components: {
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        boxShadow: darkMode
                            ? '0 2px 10px rgba(0, 0, 0, 0.5)'
                            : '0 2px 10px rgba(0, 0, 0, 0.1)',
                    }
                }
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        boxShadow: darkMode
                            ? '0 4px 20px rgba(0, 0, 0, 0.5)'
                            : '0 4px 20px rgba(0, 0, 0, 0.08)',
                    }
                }
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        borderRadius: 6,
                    }
                }
            }
        }
    }));

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        setUser(null);
        handleMenuClose();
        window.location.reload();
    };

    const renderMenu = (
        <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            open={isMenuOpen}
            onClose={handleMenuClose}
        >
            {user && <MenuItem disabled>{user.username}</MenuItem>}
            {user && <Divider />}
            <MenuItem onClick={handleMenuClose}>My Account</MenuItem>
            <MenuItem onClick={handleMenuClose}>Document History</MenuItem>
            <Divider />
            {user ? (
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
            ) : (
                <MenuItem onClick={handleMenuClose}>Login</MenuItem>
            )}
        </Menu>
    );

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <AppBar position="sticky" color="default" elevation={0}>
                    <Toolbar>
                        <Typography
                            variant="h6"
                            component="div"
                            sx={{
                                flexGrow: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                fontWeight: 'bold'
                            }}
                        >
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M14 3L15.5 5H20V9.5L22 11L20 12.5V17H15.5L14 19H10L8.5 17H4V12.5L2 11L4 9.5V5H8.5L10 3H14Z"
                                    fill={theme.palette.primary.main}
                                    stroke={theme.palette.primary.main}
                                    strokeWidth="1.5"
                                />
                                <circle cx="12" cy="11" r="3" fill="white" />
                            </svg>
                            DiffMerge AI
                        </Typography>

                        <Tooltip title="Help">
                            <IconButton color="inherit">
                                <HelpIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'}>
                            <IconButton color="inherit" onClick={toggleDarkMode}>
                                {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Account">
                            <IconButton
                                onClick={handleProfileMenuOpen}
                                color="inherit"
                                size="small"
                                sx={{ ml: 1 }}
                            >
                                {user ? (
                                    <Avatar
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            bgcolor: theme.palette.primary.main
                                        }}
                                    >
                                        {user.username.charAt(0).toUpperCase()}
                                    </Avatar>
                                ) : (
                                    <PersonIcon />
                                )}
                            </IconButton>
                        </Tooltip>
                    </Toolbar>
                    {loading && <LinearProgress />}
                </AppBar>

                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        py: 3,
                        backgroundColor: theme.palette.background.default
                    }}
                >
                    <HomePage />
                </Box>

                <Box
                    component="footer"
                    sx={{
                        py: 3,
                        px: 2,
                        mt: 'auto',
                        backgroundColor: theme.palette.mode === 'light'
                            ? theme.palette.grey[100]
                            : theme.palette.grey[900],
                    }}
                >
                    <Container maxWidth="lg">
                        <Typography variant="body2" color="text.secondary" align="center">
                            &copy; {new Date().getFullYear()} DiffMerge AI - Advanced Document Comparison and Merging
                        </Typography>
                    </Container>
                </Box>
            </Box>

            {renderMenu}
        </ThemeProvider>
    );
}

export default App;