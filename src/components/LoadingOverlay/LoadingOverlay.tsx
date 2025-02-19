// File: src/components/LoadingOverlay/LoadingOverlay.tsx
import React from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    LinearProgress,
    Paper,
    useTheme
} from '@mui/material';
import { keyframes } from '@mui/system';

interface LoadingOverlayProps {
    visible: boolean;
    message?: string;
    progress?: number;
    fullScreen?: boolean;
}

const pulse = keyframes`
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    opacity: 0.6;
  }
`;

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
                                                           visible,
                                                           message = 'Processing...',
                                                           progress,
                                                           fullScreen = false
                                                       }) => {
    const theme = useTheme();

    if (!visible) return null;

    const determinate = typeof progress === 'number' && progress >= 0 && progress <= 100;

    const overlayContent = (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                width: '100%',
                zIndex: 1200,
                p: 3
            }}
        >
            <Paper
                elevation={4}
                sx={{
                    p: 4,
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    maxWidth: 400,
                    width: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: theme.palette.background.paper
                }}
            >
                {determinate ? (
                    <>
                        <Box sx={{ width: '100%', mb: 3 }}>
                            <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{ height: 8, borderRadius: 4 }}
                            />
                        </Box>
                        <Typography variant="h6" gutterBottom align="center">
                            {progress.toFixed(0)}% Complete
                        </Typography>
                    </>
                ) : (
                    <CircularProgress
                        size={60}
                        thickness={4}
                        sx={{ mb: 3 }}
                        color="primary"
                    />
                )}

                <Typography
                    variant="body1"
                    align="center"
                    sx={{
                        animation: `${pulse} 2s infinite ease-in-out`,
                        fontWeight: 500
                    }}
                >
                    {message}
                </Typography>
            </Paper>
        </Box>
    );

    if (fullScreen) {
        return (
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 1100
                }}
            >
                {overlayContent}
            </Box>
        );
    }

    return (
        <Box
            sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(2px)',
                zIndex: 10
            }}
        >
            {overlayContent}
        </Box>
    );
};

export default LoadingOverlay;