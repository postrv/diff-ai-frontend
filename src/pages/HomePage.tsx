// File: src/pages/HomePage.tsx
import React, { useState } from 'react';
import {
    Box,
    Button,
    Container,
    Step,
    StepLabel,
    Stepper,
    Typography,
    Paper,
    Alert,
    Divider,
    Snackbar,
    useMediaQuery,
    useTheme,
    IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GoalSetting from '../components/GoalSetting/GoalSetting';
import DocumentUpload from '../components/DocumentUpload/DocumentUpload';
import DiffViewer from '../components/DiffViewer/DiffViewer';
import Review from '../components/Review/Review';
import LoadingOverlay from '../components/LoadingOverlay/LoadingOverlay';
import { createAsyncMerge, getMergeResult, pollTaskUntilComplete, handleApiError } from '../services/api';

interface Document {
    id?: number;
    filename: string;
    file?: File;
    uploaded?: boolean;
}

interface MergeGoal {
    strategy: 'latest' | 'original' | 'both' | 'custom';
    customRules?: string[];
    priorities?: ('accuracy' | 'completeness' | 'conciseness')[];
    preserveSections?: string[];
    notes?: string;
}

interface DiffStats {
    total_lines: number;
    added_lines: number;
    removed_lines: number;
    unchanged_lines: number;
    words_added: number;
    words_removed: number;
    change_ratio: number;
}

interface DiffLine {
    type: 'added' | 'removed' | 'unchanged';
    line: string;
}

interface DiffResult {
    diff_lines: DiffLine[];
    stats: DiffStats;
    ai_summary: string;
}

const steps = ['Goal Setting', 'Document Upload', 'Diff Viewer', 'Review'];

const HomePage: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [activeStep, setActiveStep] = useState(0);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [mergeGoal, setMergeGoal] = useState<MergeGoal | null>(null);
    const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
    const [mergedContent, setMergedContent] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [loadingProgress, setLoadingProgress] = useState<number | undefined>(undefined);
    const [isComplete, setIsComplete] = useState(false);
    const [mergeTaskId, setMergeTaskId] = useState<string | null>(null);

    const handleNext = () => {
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const handleGoalSet = (goal: MergeGoal) => {
        setMergeGoal(goal);
        handleNext();
    };

    const handleDocumentsSelected = (selectedDocs: Document[]) => {
        setDocuments(selectedDocs);
        if (selectedDocs.length >= 2) {
            handleNext();
        } else {
            setError('Please select at least two documents to continue');
        }
    };

    const handleProceedToMerge = async (diff: DiffResult) => {
        if (!mergeGoal || documents.length < 2) {
            setError('Missing required data for merge operation');
            return;
        }

        setDiffResult(diff);

        // Don't start the merge here - Review component will handle it
        handleNext();
    };

    const handleFinalizeMerge = (finalContent: string, filename: string) => {
        if (mergeTaskId) {
            // Complete the merge and save the document
            applyMergeResult(mergeTaskId);
        } else {
            // In a real app, you might save this to the server directly
            setSuccess(`Document "${filename}" successfully merged and saved!`);
            setIsComplete(true);
        }
    };

    const applyMergeResult = async (taskId: string) => {
        setLoading(true);
        setLoadingMessage('Finalizing document...');
        setLoadingProgress(undefined);

        try {
            const result = await getMergeResult(taskId, true);

            if (result.data && result.data.id) {
                setSuccess(`Document "${result.data.filename}" successfully merged and saved!`);
                setIsComplete(true);
            } else {
                throw new Error('Failed to save merged document');
            }
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setActiveStep(0);
        setDocuments([]);
        setMergeGoal(null);
        setDiffResult(null);
        setMergedContent('');
        setMergeTaskId(null);
        setIsComplete(false);
    };

    const getStepContent = (step: number) => {
        switch (step) {
            case 0:
                return <GoalSetting onGoalSet={handleGoalSet} initialGoal={mergeGoal || undefined} />;
            case 1:
                return <DocumentUpload onDocumentsSelected={handleDocumentsSelected} />;
            case 2:
                return <DiffViewer
                    selectedDocuments={documents.filter(doc => doc.id !== undefined) as {id: number, filename: string}[]}
                    onProceedToMerge={handleProceedToMerge}
                />;
            case 3:
                return diffResult ? (
                    <Review
                        selectedDocuments={documents.filter(doc => doc.id !== undefined) as {id: number, filename: string}[]}
                        diffResult={diffResult}
                        mergeGoal={mergeGoal!}
                        onFinalizeMerge={handleFinalizeMerge}
                        mergedContent={mergedContent}
                    />
                ) : (
                    <Alert severity="error">Diff results not available. Please go back and try again.</Alert>
                );
            default:
                return <Typography>Unknown step</Typography>;
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <LoadingOverlay
                visible={loading}
                message={loadingMessage}
                progress={loadingProgress}
                fullScreen
            />

            <Paper
                elevation={2}
                sx={{
                    p: { xs: 2, md: 4 },
                    borderRadius: 2,
                    backgroundImage: 'linear-gradient(to right, rgba(240,240,255,0.5), rgba(255,255,255,0.8))',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(to right, #4a90e2, #50e3c2)',
                        zIndex: 1
                    }
                }}
            >
                <Typography
                    variant="h4"
                    align="center"
                    gutterBottom
                    sx={{
                        fontWeight: 600,
                        mb: 4,
                        color: 'primary.main',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.05)'
                    }}
                >
                    AI-Powered Document Diffing and Merging
                </Typography>

                {isComplete ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant="h5" color="primary" gutterBottom>
                            Merge Complete!
                        </Typography>
                        <Typography variant="body1" paragraph>
                            Your documents have been successfully merged according to your specified goals.
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleReset}
                            sx={{ mt: 2 }}
                        >
                            Start New Merge
                        </Button>
                    </Box>
                ) : (
                    <>
                        <Stepper
                            activeStep={activeStep}
                            alternativeLabel={!isMobile}
                            orientation={isMobile ? 'vertical' : 'horizontal'}
                            sx={{ mb: 4 }}
                        >
                            {steps.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>

                        {error && (
                            <Alert
                                severity="error"
                                sx={{ mb: 2 }}
                                onClose={() => setError(null)}
                            >
                                {error}
                            </Alert>
                        )}

                        <Box>
                            {getStepContent(activeStep)}
                        </Box>

                        <Divider sx={{ my: 4 }} />

                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-between'
                            }}
                        >
                            <Button
                                color="inherit"
                                disabled={activeStep === 0 || loading}
                                onClick={handleBack}
                                startIcon={<ArrowBackIcon />}
                            >
                                Back
                            </Button>

                            {activeStep < steps.length - 1 && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleNext}
                                    endIcon={<ArrowForwardIcon />}
                                    disabled={
                                        (activeStep === 0 && !mergeGoal) ||
                                        (activeStep === 1 && documents.length < 2) ||
                                        (activeStep === 2 && !diffResult) ||
                                        loading
                                    }
                                >
                                    Continue
                                </Button>
                            )}
                        </Box>
                    </>
                )}
            </Paper>

            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={() => setSuccess(null)}
                message={success}
            />
        </Container>
    );
};

export default HomePage;