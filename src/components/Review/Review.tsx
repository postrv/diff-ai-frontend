// File: src/components/Review/Review.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Button,
    Box,
    Paper,
    Grid,
    Divider,
    TextField,
    CircularProgress,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import { styled } from '@mui/material/styles';
import { createAsyncMerge, getMergeResult, pollTaskUntilComplete, MergeRequest } from '../../services/api';
import LoadingOverlay from '../LoadingOverlay/LoadingOverlay';

interface Document {
    id: number;
    filename: string;
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

interface ReviewProps {
    selectedDocuments: Document[];
    diffResult: DiffResult;
    mergeGoal: MergeGoal;
    onFinalizeMerge: (mergedContent: string, filename: string) => void;
    mergedContent?: string;
}

const HighlightedText = styled(Box)<{ highlight: 'added' | 'removed' | 'conflict' | 'none' }>(({ theme, highlight }) => ({
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    backgroundColor:
        highlight === 'added'
            ? 'rgba(76, 175, 80, 0.1)'
            : highlight === 'removed'
                ? 'rgba(244, 67, 54, 0.1)'
                : highlight === 'conflict'
                    ? 'rgba(255, 152, 0, 0.1)'
                    : 'transparent',
    border:
        highlight === 'added'
            ? `1px solid ${theme.palette.success.light}`
            : highlight === 'removed'
                ? `1px solid ${theme.palette.error.light}`
                : highlight === 'conflict'
                    ? `1px solid ${theme.palette.warning.light}`
                    : 'none',
}));

const Review: React.FC<ReviewProps> = ({
                                           selectedDocuments,
                                           diffResult,
                                           mergeGoal,
                                           onFinalizeMerge,
                                           mergedContent: initialContent
                                       }) => {
    const [finalContent, setFinalContent] = useState(initialContent || '');
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(finalContent);
    const [filename, setFilename] = useState(`Merged_${selectedDocuments[0]?.filename || 'document'}`);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [loadingProgress, setLoadingProgress] = useState<number | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showPreviewDialog, setShowPreviewDialog] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState('txt');
    const [mergeTaskId, setMergeTaskId] = useState<string | null>(null);
    const [mergeResult, setMergeResult] = useState<any | null>(null);
    const [conflicts, setConflicts] = useState<number>(0);

    // Start the merge process when component mounts if no initial content is provided
    useEffect(() => {
        if (!initialContent && selectedDocuments.length >= 2 && !mergeTaskId) {
            startAsyncMerge();
        }
    }, [initialContent, selectedDocuments]);

    // Poll for task status when we have a mergeTaskId
    useEffect(() => {
        if (mergeTaskId) {
            pollMergeTask();
        }
    }, [mergeTaskId]);

    const startAsyncMerge = async () => {
        if (selectedDocuments.length < 2) {
            setError('Not enough documents selected for merge');
            return;
        }

        setLoading(true);
        setLoadingMessage('Initializing merge process...');
        setLoadingProgress(0);
        setError(null);

        try {
            // Prepare merge request
            const mergeRequest: MergeRequest = {
                doc_id_a: selectedDocuments[0].id,
                doc_id_b: selectedDocuments[1].id,
                conflict_resolution: mergeGoal.strategy,
                ai_guidance: {
                    priorities: mergeGoal.priorities,
                    preserve_sections: mergeGoal.preserveSections,
                    custom_rules: mergeGoal.customRules,
                    notes: mergeGoal.notes
                }
            };

            // Start async merge
            const response = await createAsyncMerge(mergeRequest);
            setMergeTaskId(response.data.task_id);
            setLoadingMessage('Analyzing documents and applying merge strategy...');
            setLoadingProgress(10);
        } catch (err: any) {
            console.error('Error starting merge:', err);
            setError(`Failed to start merge: ${err.message || 'Unknown error'}`);
            setLoading(false);
        }
    };

    const pollMergeTask = async () => {
        if (!mergeTaskId) return;

        try {
            const result = await pollTaskUntilComplete(
                mergeTaskId,
                (progress, message) => {
                    setLoadingProgress(progress);
                    setLoadingMessage(message || 'Processing merge...');
                }
            );

            // Process completed result
            if (result.status === 'completed' && result.result) {
                const mergeData = result.result;
                setMergeResult(mergeData);

                if (mergeData.merged_content) {
                    setFinalContent(mergeData.merged_content);
                    setEditedContent(mergeData.merged_content);
                }

                if (mergeData.report && mergeData.report.conflicts_resolved) {
                    setConflicts(mergeData.report.conflicts_resolved);
                }

                setLoading(false);
            } else {
                throw new Error('Merge task completed but no result was returned');
            }
        } catch (err: any) {
            console.error('Error polling merge task:', err);
            setError(`Merge process failed: ${err.message || 'Unknown error'}`);
            setLoading(false);
        }
    };

    const handleFormatChange = (event: SelectChangeEvent) => {
        setSelectedFormat(event.target.value);
    };

    const handleEditToggle = () => {
        if (isEditing) {
            // Save edits
            setFinalContent(editedContent);
        } else {
            // Start editing
            setEditedContent(finalContent);
        }
        setIsEditing(!isEditing);
    };

    const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditedContent(event.target.value);
    };

    const handleFinalizeMerge = () => {
        setShowConfirmDialog(true);
    };

    const confirmFinalizeMerge = async () => {
        setShowConfirmDialog(false);
        setLoading(true);
        setLoadingMessage('Finalizing merge...');
        setLoadingProgress(undefined);

        try {
            if (mergeTaskId) {
                // Apply the merge result to create a new document
                const result = await getMergeResult(mergeTaskId, true);
                if (result.data && result.data.id) {
                    onFinalizeMerge(finalContent, result.data.filename);
                } else {
                    // Fallback to direct call if API doesn't return document
                    onFinalizeMerge(finalContent, filename);
                }
            } else {
                // No task ID, use the provided callback directly
                onFinalizeMerge(finalContent, filename);
            }
        } catch (err: any) {
            console.error('Error finalizing merge:', err);
            setError(`Failed to finalize merge: ${err.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        const blob = new Blob([finalContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${selectedFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const renderMergeStrategyInfo = () => {
        let strategyDescription = '';
        let strategyColor = '';

        switch(mergeGoal.strategy) {
            case 'latest':
                strategyDescription = 'Using latest version for all conflicts';
                strategyColor = 'success';
                break;
            case 'original':
                strategyDescription = 'Preserving original content for all conflicts';
                strategyColor = 'info';
                break;
            case 'both':
                strategyDescription = 'Keeping both versions where conflicts exist';
                strategyColor = 'warning';
                break;
            case 'custom':
                strategyDescription = 'Using custom rules to resolve conflicts';
                strategyColor = 'secondary';
                break;
        }

        return (
            <Chip
                label={strategyDescription}
                color={strategyColor as any}
                size="medium"
            />
        );
    };

    // Render the main content
    return (
        <Card variant="outlined" sx={{ mb: 2, position: 'relative' }}>
            <LoadingOverlay
                visible={loading}
                message={loadingMessage}
                progress={loadingProgress}
            />

            <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                    Review and Finalize Merge
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                )}

                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle1">Merge Strategy:</Typography>
                            {renderMergeStrategyInfo()}
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle1">Changes Applied:</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Chip
                                    label={`+${diffResult.stats.added_lines} lines`}
                                    size="small"
                                    color="success"
                                />
                                <Chip
                                    label={`-${diffResult.stats.removed_lines} lines`}
                                    size="small"
                                    color="error"
                                />
                                {conflicts > 0 && (
                                    <Chip
                                        label={`${conflicts} conflicts resolved`}
                                        size="small"
                                        color="warning"
                                    />
                                )}
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle1">Output Filename:</Typography>
                            <TextField
                                size="small"
                                value={filename}
                                onChange={(e) => setFilename(e.target.value)}
                                disabled={loading}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                </Paper>

                <Accordion defaultExpanded sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">Document Summary</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography variant="body1" paragraph>
                            {diffResult.ai_summary}
                        </Typography>

                        {mergeResult && mergeResult.report && mergeResult.report.summary && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>Merge Summary:</Typography>
                                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                                    <Typography variant="body2">
                                        {mergeResult.report.summary}
                                    </Typography>
                                </Paper>
                            </Box>
                        )}

                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>Documents Merged:</Typography>
                            <Grid container spacing={1}>
                                {selectedDocuments.map((doc) => (
                                    <Grid item key={doc.id}>
                                        <Chip label={doc.filename} size="small" />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>

                        {mergeGoal.customRules && mergeGoal.customRules.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>Custom Rules Applied:</Typography>
                                <Box component="ul" sx={{ pl: 2 }}>
                                    {mergeGoal.customRules.map((rule, index) => (
                                        <Typography component="li" key={index} variant="body2">
                                            {rule}
                                        </Typography>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {mergeGoal.preserveSections && mergeGoal.preserveSections.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>Preserved Sections:</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {mergeGoal.preserveSections.map((section, index) => (
                                        <Chip key={index} label={section} size="small" />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </AccordionDetails>
                </Accordion>

                <Typography variant="h6" gutterBottom>
                    Merged Document Content
                    <Tooltip title="You can review and edit the final merged content before finalizing">
                        <IconButton size="small" sx={{ ml: 1 }}>
                            <InfoIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Typography>

                <Box sx={{ position: 'relative' }}>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            mb: 3,
                            maxHeight: '500px',
                            overflow: 'auto',
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            backgroundColor: isEditing ? '#FFFFD6' : undefined
                        }}
                    >
                        {isEditing ? (
                            <TextField
                                multiline
                                fullWidth
                                value={editedContent}
                                onChange={handleContentChange}
                                variant="outlined"
                                InputProps={{
                                    style: {
                                        fontFamily: 'monospace',
                                        fontSize: '14px'
                                    }
                                }}
                                sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                            />
                        ) : (
                            <Box
                                component="pre"
                                sx={{
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    margin: 0
                                }}
                            >
                                {finalContent}
                            </Box>
                        )}
                    </Paper>

                    <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                        <Button
                            variant={isEditing ? "contained" : "outlined"}
                            color={isEditing ? "success" : "primary"}
                            onClick={handleEditToggle}
                            startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
                            size="small"
                        >
                            {isEditing ? 'Save Changes' : 'Edit Content'}
                        </Button>
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Grid container spacing={2} justifyContent="space-between" alignItems="center">
                    <Grid item>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel id="format-select-label">Format</InputLabel>
                                <Select
                                    labelId="format-select-label"
                                    value={selectedFormat}
                                    label="Format"
                                    onChange={handleFormatChange}
                                    disabled={loading}
                                >
                                    <MenuItem value="txt">Plain Text (.txt)</MenuItem>
                                    <MenuItem value="md">Markdown (.md)</MenuItem>
                                    <MenuItem value="doc">Word Document (.doc)</MenuItem>
                                </Select>
                            </FormControl>

                            <Button
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={handleDownload}
                                disabled={loading || !finalContent}
                            >
                                Download
                            </Button>

                            <Button
                                variant="outlined"
                                onClick={() => setShowPreviewDialog(true)}
                                disabled={loading || !finalContent}
                            >
                                Preview
                            </Button>
                        </Box>
                    </Grid>

                    <Grid item>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleFinalizeMerge}
                            disabled={loading || !finalContent}
                            sx={{ minWidth: 150 }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Finalize Merge'}
                        </Button>
                    </Grid>
                </Grid>

                {/* Confirmation Dialog */}
                <Dialog
                    open={showConfirmDialog}
                    onClose={() => setShowConfirmDialog(false)}
                >
                    <DialogTitle>Confirm Merge</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to finalize this merge? This will save the merged document to your collection.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
                        <Button onClick={confirmFinalizeMerge} color="primary" variant="contained">
                            Confirm
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Preview Dialog */}
                <Dialog
                    open={showPreviewDialog}
                    onClose={() => setShowPreviewDialog(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        Document Preview
                        <IconButton
                            aria-label="close"
                            onClick={() => setShowPreviewDialog(false)}
                            sx={{ position: 'absolute', right: 8, top: 8 }}
                        >
                            &times;
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Box sx={{ fontFamily: 'serif', p: 2 }}>
                            <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                                {finalContent}
                            </Typography>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            startIcon={<DownloadIcon />}
                            onClick={handleDownload}
                        >
                            Download
                        </Button>
                        <Button
                            onClick={() => setShowPreviewDialog(false)}
                        >
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            </CardContent>
        </Card>
    );
};

export default Review;