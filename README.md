# AI-Powered Document Diffing & Merging - Frontend

A React-based frontend for comparing and intelligently merging documents using AI assistance.

![React](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-Latest-3178C6?logo=typescript)
![Material UI](https://img.shields.io/badge/Material%20UI-6.4.4-0081CB?logo=material-ui)

## Features

- **Document Management**: Upload, view, and organize text documents
- **Visual Diff Analysis**: Compare documents with side-by-side or unified views
- **AI-Powered Summaries**: Get intelligent summaries of document differences
- **Smart Merge**: Merge documents with AI-assisted conflict resolution
- **Custom Merge Strategies**: Choose from multiple merge strategies or create custom rules
- **Asynchronous Processing**: Handle large documents via background processing
- **Progress Tracking**: Real-time progress updates for long-running operations
- **Change Highlighting**: Color-coded visualization of document changes

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher
- Backend API running (see backend README)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd diffai-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root with the following contents:
   ```
   REACT_APP_API_BASE_URL=http://localhost:8000
   ```

### Development

Run the development server:
```bash
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

Create a production build:
```bash
npm run build
```

The build output will be in the `build` directory.

## Architecture

### Component Structure

```
src/
├── components/
│   ├── DiffViewer/          # Document comparison visualization
│   ├── DocumentUpload/      # File upload handling
│   ├── EnhancedDocumentPreview/  # Rich document preview with highlighting
│   ├── GoalSetting/         # Merge strategy configuration
│   ├── LoadingOverlay/      # Progress indicator for async operations
│   └── Review/              # Final review and editing of merged content
├── pages/
│   └── HomePage.tsx         # Main application page
├── services/
│   └── api.ts               # API communication layer
├── utils/
│   └── documentHighlighter.ts  # Utilities for highlighting changes
└── App.tsx                  # Application entry point
```

### Key Technologies

- **React**: UI library for building component-based interfaces
- **TypeScript**: Static typing for better developer experience and code quality
- **Material UI**: Component library for consistent, responsive design
- **Axios**: HTTP client for API communication
- **React Hooks**: For state management and side effects

## Workflow

1. **Set Merge Goals**: Define merge strategy and custom rules
2. **Upload Documents**: Select files to compare and merge
3. **View Differences**: Visualize changes between documents
4. **Review and Adjust**: Preview merged result with highlighted changes
5. **Finalize**: Save the final merged document

## API Integration

The frontend communicates with the backend API for:
- Document upload and management
- Diff computation and visualization
- AI-powered analysis and summaries
- Asynchronous merge processing

### Asynchronous Processing

For large documents, the application uses background processing:
1. Submit merge request to backend
2. Receive task ID for tracking
3. Poll task status with progress updates
4. Retrieve and display final result when complete

## Troubleshooting

### Common Issues

**API Connection Problems**:
- Verify the backend is running
- Check that `REACT_APP_API_BASE_URL` is correctly set
- Confirm network connectivity

**Long Processing Times**:
- Large documents may take longer to process
- The progress indicator shows real-time status
- Background processing prevents browser timeouts

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

[MIT License](LICENSE)