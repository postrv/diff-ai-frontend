// File: src/components/DiffViewer/DiffViewer.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Grid,
    Paper,
    Divider,
    FormControlLabel,
    Switch,
    Chip,
    CircularProgress,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    SelectChangeEvent,
    Stack,
    Alert
} from '@mui/material';
import { fetchDiff } from '../../services/api';
import { styled } from '@mui/material/styles';

interface DiffLine {
    type: 'added' | 'removed' | 'unchanged';
    line: string;
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

interface DiffResult {
    diff_lines: DiffLine[];
    stats: DiffStats;
    ai_summary: string;
}

interface Document {
    id: number;
    filename: string;
}

interface DiffViewerProps {
    selectedDocuments: Document[];
    onProceedToMerge: (diffResult: DiffResult) => void;
}

const LineNumberWrapper = styled(Box)(({ theme }) => ({
    width: '40px',
    textAlign: 'right',
    paddingRight: theme.spacing(1),
    color: theme.palette.text.secondary,
    userSelect: 'none',
    borderRight: `1px solid ${theme.palette.divider}`,
}));

const LineContent = styled(Box)(({ theme }) => ({
    padding: theme.spacing(0, 1),
    width: '100%',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
}));

const DiffLine = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'lineType',
})<{ lineType: 'added' | 'removed' | 'unchanged' }>(({ theme, lineType }) => ({
    display: 'flex',
    backgroundColor:
        lineType === 'added'
            ? 'rgba(0, 255, 0, 0.1)'
            : lineType === 'removed'
                ? 'rgba(255, 0, 0, 0.1)'
                : 'transparent',
    '&:hover': {
        backgroundColor:
            lineType === 'added'
                ? 'rgba(0, 255, 0, 0.2)'
                : lineType === 'removed'
                    ? 'rgba(255, 0, 0, 0.2)'
                    : 'rgba(0, 0, 0, 0.05)',
    }
}));

const DiffViewer: React.FC<DiffViewerProps> = ({ selectedDocuments, onProceedToMerge }) => {
    const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [enhancedDiff, setEnhancedDiff] = useState(true);
    const [showLineNumbers, setShowLineNumbers] = useState(true);
    const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('unified');
    const [primaryDoc, setPrimaryDoc] = useState<number | ''>('');
    const [secondaryDoc, setSecondaryDoc] = useState<number | ''>('');

    useEffect(() => {
        // Auto-select documents if exactly two are provided
        if (selectedDocuments.length === 2 && primaryDoc === '' && secondaryDoc === '') {
            setPrimaryDoc(selectedDocuments[0].id);
            setSecondaryDoc(selectedDocuments[1].id);
        }
    }, [selectedDocuments, primaryDoc, secondaryDoc]);

    const handlePrimaryDocChange = (event: SelectChangeEvent<number>) => {
        const value = event.target.value as number;
        setPrimaryDoc(value);

        // If selected as secondary doc, swap them
        if (value === secondaryDoc) {
            setSecondaryDoc(primaryDoc);
        }
    };

    const handleSecondaryDocChange = (event: SelectChangeEvent<number>) => {
        const value = event.target.value as number;
        setSecondaryDoc(value);

        // If selected as primary doc, swap them
        if (value === primaryDoc) {
            setPrimaryDoc(secondaryDoc);
        }
    };

    const handleCompareDocs = async () => {
        if (!primaryDoc || !secondaryDoc) {
            setError('Please select two documents to compare');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetchDiff(primaryDoc, secondaryDoc, enhancedDiff);
            if (enhancedDiff) {
                setDiffResult(response.data);
            } else {
                // Transform basic diff format to enhanced format for consistent handling
                const diffLines: DiffLine[] = response.data.diff;
                setDiffResult({
                    diff_lines: diffLines,
                    stats: {
                        total_lines: diffLines.length,
                        added_lines: diffLines.filter((line: DiffLine) => line.type === 'added').length,
                        removed_lines: diffLines.filter((line: DiffLine) => line.type === 'removed').length,
                        unchanged_lines: diffLines.filter((line: DiffLine) => line.type === 'unchanged').length,
                        words_added: 0,
                        words_removed: 0,
                        change_ratio: 0
                    },
                    ai_summary: 'Basic diff comparison completed. Enable enhanced diff for AI summary.'
                });
            }
        } catch (err) {
            console.error('Error fetching diff:', err);
            setError('Failed to compare documents. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderUnifiedDiff = () => {
        if (!diffResult) return null;

        return (
            <Paper
                variant="outlined"
                sx={{
                    maxHeight: '600px',
                    overflow: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '14px'
                }}
            >
                {diffResult.diff_lines.map((line, index) => (
                    <DiffLine key={index} lineType={line.type}>
                        {showLineNumbers && (
                            <LineNumberWrapper>
                                {index + 1}
                            </LineNumberWrapper>
                        )}
                        <LineContent>
                            {line.type === 'added' && '+ '}
                            {line.type === 'removed' && '- '}
                            {line.type === 'unchanged' && '  '}
                            {line.line}
                        </LineContent>
                    </DiffLine>
                ))}
            </Paper>
        );
    };

    const renderSideBySideDiff = () => {
        if (!diffResult) return null;

        // Separate into left and right content for side-by-side view
        const leftLines: (DiffLine | null)[] = [];
        const rightLines: (DiffLine | null)[] = [];

        diffResult.diff_lines.forEach(line => {
            if (line.type === 'unchanged') {
                leftLines.push(line);
                rightLines.push(line);
            } else if (line.type === 'removed') {
                leftLines.push(line);
                rightLines.push(null);
            } else if (line.type === 'added') {
                leftLines.push(null);
                rightLines.push(line);
            }
        });

        // Ensure both columns have the same number of lines
        const maxLines = Math.max(leftLines.length, rightLines.length);
        while (leftLines.length < maxLines) leftLines.push(null);
        while (rightLines.length < maxLines) rightLines.push(null);

        return (
            <Grid container spacing={1}>
                <Grid item xs={6}>
                    <Paper
                        variant="outlined"
                        sx={{
                            maxHeight: '600px',
                            overflow: 'auto',
                            fontFamily: 'monospace',
                            fontSize: '14px'
                        }}
                    >
                        {leftLines.map((line, index) => (
                            <DiffLine
                                key={`left-${index}`}
                                lineType={line?.type || 'unchanged'}
                                sx={{
                                    backgroundColor: !line ? 'rgba(0, 0, 0, 0.03)' : undefined,
                                    opacity: !line ? 0.5 : 1
                                }}
                            >
                                {showLineNumbers && (
                                    <LineNumberWrapper>
                                        {index + 1}
                                    </LineNumberWrapper>
                                )}
                                <LineContent>
                                    {line ? (
                                        <>
                                            {line.type === 'removed' && '- '}
                                            {line.type === 'unchanged' && '  '}
                                            {line.line}
                                        </>
                                    ) : ' '}
                                </LineContent>
                            </DiffLine>
                        ))}
                    </Paper>
                </Grid>
                <Grid item xs={6}>
                    <Paper
                        variant="outlined"
                        sx={{
                            maxHeight: '600px',
                            overflow: 'auto',
                            fontFamily: 'monospace',
                            fontSize: '14px'
                        }}
                    >
                        {rightLines.map((line, index) => (
                            <DiffLine
                                key={`right-${index}`}
                                lineType={line?.type || 'unchanged'}
                                sx={{
                                    backgroundColor: !line ? 'rgba(0, 0, 0, 0.03)' : undefined,
                                    opacity: !line ? 0.5 : 1
                                }}
                            >
                                {showLineNumbers && (
                                    <LineNumberWrapper>
                                        {index + 1}
                                    </LineNumberWrapper>
                                )}
                                <LineContent>
                                    {line ? (
                                        <>
                                            {line.type === 'added' && '+ '}
                                            {line.type === 'unchanged' && '  '}
                                            {line.line}
                                        </>
                                    ) : ' '}
                                </LineContent>
                            </DiffLine>
                        ))}
                    </Paper>
                </Grid>
            </Grid>
        );
    };

    const renderStats = () => {
        if (!diffResult || !diffResult.stats) return null;

        const { stats } = diffResult;
        return (
            <Box sx={{ my: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                    Diff Statistics
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="body2" color="textSecondary">
                                Total Lines
                            </Typography>
                            <Typography variant="h4">
                                {stats.total_lines}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(0, 255, 0, 0.05)' }}>
                            <Typography variant="body2" color="textSecondary">
                                Added
                            </Typography>
                            <Typography variant="h4" color="success.main">
                                +{stats.added_lines}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {stats.words_added > 0 && `(${stats.words_added} words)`}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255, 0, 0, 0.05)' }}>
                            <Typography variant="body2" color="textSecondary">
                                Removed
                            </Typography>
                            <Typography variant="h4" color="error.main">
                                -{stats.removed_lines}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {stats.words_removed > 0 && `(${stats.words_removed} words)`}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
                            <Typography variant="body2" color="textSecondary">
                                Change Ratio
                            </Typography>
                            <Typography variant="h4">
                                {stats.change_ratio}%
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        );
    };

    return (
        <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                    Document Comparison
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={5}>
                        <FormControl fullWidth>
                            <InputLabel id="primary-doc-label">Original Document</InputLabel>
                            <Select
                                labelId="primary-doc-label"
                                value={primaryDoc}
                                label="Original Document"
                                onChange={handlePrimaryDocChange}
                                disabled={loading}
                            >
                                {selectedDocuments.map(doc => (
                                    <MenuItem key={`primary-${doc.id}`} value={doc.id}>
                                        {doc.filename}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <FormControl fullWidth>
                            <InputLabel id="secondary-doc-label">Modified Document</InputLabel>
                            <Select
                                labelId="secondary-doc-label"
                                value={secondaryDoc}
                                label="Modified Document"
                                onChange={handleSecondaryDocChange}
                                disabled={loading}
                            >
                                {selectedDocuments.map(doc => (
                                    <MenuItem key={`secondary-${doc.id}`} value={doc.id}>
                                        {doc.filename}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={2}>
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            onClick={handleCompareDocs}
                            disabled={loading || !primaryDoc || !secondaryDoc}
                            sx={{ height: '56px' }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Compare'}
                        </Button>
                    </Grid>
                </Grid>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                )}

                {diffResult && (
                    <>
                        <Box sx={{ mb: 2 }}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    AI Summary
                                </Typography>
                                <Typography variant="body1">
                                    {diffResult.ai_summary}
                                </Typography>
                            </Paper>
                        </Box>

                        {renderStats()}

                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            alignItems={{ xs: 'stretch', sm: 'center' }}
                            justifyContent="space-between"
                            sx={{ mb: 2 }}
                        >
                            <Box>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={enhancedDiff}
                                            onChange={(e) => setEnhancedDiff(e.target.checked)}
                                            disabled={loading}
                                        />
                                    }
                                    label="Enhanced Diff"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={showLineNumbers}
                                            onChange={(e) => setShowLineNumbers(e.target.checked)}
                                        />
                                    }
                                    label="Show Line Numbers"
                                />
                            </Box>

                            <Box>
                                <FormControl variant="outlined" size="small">
                                    <InputLabel id="view-mode-label">View Mode</InputLabel>
                                    <Select
                                        labelId="view-mode-label"
                                        value={viewMode}
                                        label="View Mode"
                                        onChange={(e) => setViewMode(e.target.value as 'unified' | 'side-by-side')}
                                    >
                                        <MenuItem value="unified">Unified View</MenuItem>
                                        <MenuItem value="side-by-side">Side by Side</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Stack>

                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Document Differences
                            </Typography>
                            <Box sx={{ mb: 1 }}>
                                <Chip
                                    label={`Added: ${diffResult.stats.added_lines}`}
                                    sx={{ mr: 1, bgcolor: 'rgba(0, 255, 0, 0.1)' }}
                                    size="small"
                                />
                                <Chip
                                    label={`Removed: ${diffResult.stats.removed_lines}`}
                                    sx={{ mr: 1, bgcolor: 'rgba(255, 0, 0, 0.1)' }}
                                    size="small"
                                />
                                <Chip
                                    label={`Unchanged: ${diffResult.stats.unchanged_lines}`}
                                    sx={{ bgcolor: 'rgba(0, 0, 0, 0.05)' }}
                                    size="small"
                                />
                            </Box>

                            {viewMode === 'unified' ? renderUnifiedDiff() : renderSideBySideDiff()}
                        </Box>

                        <Box sx={{ mt: 3, textAlign: 'right' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => onProceedToMerge(diffResult)}
                                disabled={!diffResult}
                            >
                                Proceed to Merge
                            </Button>
                        </Box>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default DiffViewer;