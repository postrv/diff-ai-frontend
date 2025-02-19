// File: src/components/EnhancedDocumentPreview/EnhancedDocumentPreview.tsx
import React, { useEffect, useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Divider,
    Tabs,
    Tab,
    IconButton,
    Tooltip,
    useTheme
} from '@mui/material';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { highlightMergedContent, getHighlightStyles } from '../../utils/documentHighlighter';

interface DiffLine {
    type: 'added' | 'removed' | 'unchanged';
    line: string;
}

interface DiffResult {
    diff_lines: DiffLine[];
    stats: any;
    ai_summary: string;
}

interface EnhancedDocumentPreviewProps {
    content: string;
    diffResult?: DiffResult;
    title?: string;
    onClose?: () => void;
    fullWidth?: boolean;
    showLineNumbers?: boolean;
    allowCopy?: boolean;
}

const EnhancedDocumentPreview: React.FC<EnhancedDocumentPreviewProps> = ({
                                                                             content,
                                                                             diffResult,
                                                                             title = 'Document Preview',
                                                                             onClose,
                                                                             fullWidth = true,
                                                                             showLineNumbers = true,
                                                                             allowCopy = true
                                                                         }) => {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState(0);
    const [highlightedContent, setHighlightedContent] = useState<string>('');
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        if (diffResult) {
            setHighlightedContent(highlightMergedContent(content, diffResult));
        }
    }, [content, diffResult]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleCopyContent = () => {
        navigator.clipboard.writeText(content)
            .then(() => {
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    };

    const renderRawContent = () => {
        const lines = content.split('\n');

        return (
            <Box
                component="pre"
                sx={{
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: 0,
                    p: 2,
                    overflowX: 'auto',
                    position: 'relative'
                }}
            >
                {showLineNumbers ? (
                    <Box sx={{ display: 'flex' }}>
                        <Box
                            sx={{
                                width: '50px',
                                borderRight: `1px solid ${theme.palette.divider}`,
                                color: theme.palette.text.secondary,
                                textAlign: 'right',
                                pr: 1,
                                userSelect: 'none',
                                flexShrink: 0
                            }}
                        >
                            {lines.map((_, i) => (
                                <div key={i}>{i + 1}</div>
                            ))}
                        </Box>
                        <Box sx={{ pl: 2, flexGrow: 1 }}>
                            {lines.map((line, i) => (
                                <div key={i}>{line}</div>
                            ))}
                        </Box>
                    </Box>
                ) : (
                    content
                )}
            </Box>
        );
    };

    const renderHighlightedContent = () => {
        return (
            <Box
                sx={{
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    p: 2,
                    overflowX: 'auto',
                    position: 'relative'
                }}
            >
                <style>{getHighlightStyles()}</style>
                <div dangerouslySetInnerHTML={{ __html: highlightedContent }} />
            </Box>
        );
    };

    return (
        <Paper
            elevation={3}
            sx={{
                width: fullWidth ? '100%' : 'auto',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: theme.palette.background.default
                }}
            >
                <Typography variant="h6">{title}</Typography>
                <Box>
                    {allowCopy && (
                        <Tooltip title={copySuccess ? "Copied!" : "Copy content"}>
                            <IconButton onClick={handleCopyContent} size="small" sx={{ mr: 1 }}>
                                <FileCopyIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    {onClose && (
                        <IconButton onClick={onClose} size="small">
                            <HighlightOffIcon fontSize="small" />
                        </IconButton>
                    )}
                </Box>
            </Box>

            <Divider />

            {diffResult && (
                <>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        sx={{ px: 2, backgroundColor: theme.palette.background.default }}
                    >
                        <Tab label="Highlighted" />
                        <Tab label="Raw Content" />
                    </Tabs>
                    <Divider />
                </>
            )}

            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                {diffResult && activeTab === 0 ? renderHighlightedContent() : renderRawContent()}
            </Box>
        </Paper>
    );
};

export default EnhancedDocumentPreview;