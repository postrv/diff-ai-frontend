// File: src/components/DocumentUpload/DocumentUpload.tsx
import React, { useState, useRef } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Button,
    Box,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Alert,
    Snackbar,
    Grid,
    IconButton
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import { uploadDocument } from '../../services/api';

interface Document {
    id?: number;
    filename: string;
    file?: File;
    uploaded?: boolean;
}

interface DocumentUploadProps {
    onDocumentsSelected: (documents: Document[]) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onDocumentsSelected }) => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const newDocuments: Document[] = Array.from(files).map(file => ({
            filename: file.name,
            file: file,
            uploaded: false,
        }));

        setDocuments([...documents, ...newDocuments]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveDocument = (index: number) => {
        const updatedDocuments = [...documents];
        updatedDocuments.splice(index, 1);
        setDocuments(updatedDocuments);
    };

    const handleUploadAll = async () => {
        if (documents.length === 0 || uploading) return;

        setUploading(true);
        setError(null);
        setUploadProgress(0);

        const uploadedDocs: Document[] = [];
        let failedUploads = 0;

        for (let i = 0; i < documents.length; i++) {
            const doc = documents[i];
            if (doc.uploaded || !doc.file) continue;

            try {
                const response = await uploadDocument(doc.file);
                uploadedDocs.push({
                    id: response.data.id,
                    filename: doc.filename,
                    uploaded: true
                });

                // Update documents array to mark as uploaded
                const updatedDocuments = [...documents];
                updatedDocuments[i] = {
                    ...updatedDocuments[i],
                    id: response.data.id,
                    uploaded: true
                };
                setDocuments(updatedDocuments);
            } catch (err) {
                console.error(`Failed to upload ${doc.filename}:`, err);
                failedUploads++;
                setError(`Failed to upload ${failedUploads} document(s). Please try again.`);
            }

            // Update progress
            setUploadProgress(Math.round(((i + 1) / documents.length) * 100));
        }

        setUploading(false);
        if (uploadedDocs.length > 0) {
            onDocumentsSelected(uploadedDocs);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newDocuments: Document[] = Array.from(e.dataTransfer.files).map(file => ({
                filename: file.name,
                file: file,
                uploaded: false,
            }));

            setDocuments([...documents, ...newDocuments]);
        }
    };

    const handleCloseError = () => {
        setError(null);
    };

    return (
        <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                    Document Upload
                </Typography>

                <Box
                    sx={{
                        border: '2px dashed #cccccc',
                        borderRadius: 2,
                        p: 3,
                        mb: 3,
                        backgroundColor: '#f8f8f8',
                        textAlign: 'center',
                        cursor: 'pointer'
                    }}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        accept=".txt,.md,.doc,.docx,.pdf"
                    />
                    <FileUploadIcon fontSize="large" color="primary" />
                    <Typography variant="body1" gutterBottom>
                        Drag and drop files here or click to browse
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Supported formats: .txt, .md, .doc, .docx, .pdf
                    </Typography>
                </Box>

                {documents.length > 0 && (
                    <>
                        <Typography variant="h6" gutterBottom>
                            Selected Documents ({documents.length})
                        </Typography>
                        <List>
                            {documents.map((doc, index) => (
                                <React.Fragment key={index}>
                                    <ListItem
                                        secondaryAction={
                                            <IconButton
                                                onClick={() => handleRemoveDocument(index)}
                                                disabled={uploading}
                                                color="error"
                                                aria-label="remove"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemIcon>
                                            <InsertDriveFileIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={doc.filename}
                                            secondary={doc.uploaded ? 'Uploaded' : 'Pending'}
                                        />
                                    </ListItem>
                                    {index < documents.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>

                        {uploading && (
                            <Box sx={{ my: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                    Uploading: {uploadProgress}%
                                </Typography>
                                <LinearProgress variant="determinate" value={uploadProgress} />
                            </Box>
                        )}

                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid item>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleUploadAll}
                                    disabled={uploading || documents.every(doc => doc.uploaded)}
                                >
                                    Upload All
                                </Button>
                            </Grid>
                            <Grid item>
                                <Button
                                    variant="outlined"
                                    onClick={() => setDocuments([])}
                                    disabled={uploading}
                                >
                                    Clear All
                                </Button>
                            </Grid>
                        </Grid>
                    </>
                )}
            </CardContent>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
                <Alert onClose={handleCloseError} severity="error">
                    {error}
                </Alert>
            </Snackbar>
        </Card>
    );
};

export default DocumentUpload;