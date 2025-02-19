#!/bin/bash
set -e

echo "Setting up frontend structure..."

# Create additional directories within src
mkdir -p src/components/GoalSetting
mkdir -p src/components/DocumentUpload
mkdir -p src/components/DiffViewer
mkdir -p src/components/Review
mkdir -p src/pages
mkdir -p src/services
mkdir -p src/store

# Create a GoalSetting component with a placeholder
cat << 'EOF' > src/components/GoalSetting/GoalSetting.tsx
import React from 'react';

const GoalSetting: React.FC = () => {
  return (
    <div>
      {/* TODO: Implement the goal setting UI */}
      <h2>Goal Setting</h2>
      <p>Define your merge goals here.</p>
    </div>
  );
};

export default GoalSetting;
EOF

# Create a DocumentUpload component with a placeholder
cat << 'EOF' > src/components/DocumentUpload/DocumentUpload.tsx
import React from 'react';

const DocumentUpload: React.FC = () => {
  return (
    <div>
      {/* TODO: Implement document upload and preview functionality */}
      <h2>Document Upload</h2>
      <p>Upload your documents here.</p>
    </div>
  );
};

export default DocumentUpload;
EOF

# Create a DiffViewer component with a placeholder
cat << 'EOF' > src/components/DiffViewer/DiffViewer.tsx
import React from 'react';

const DiffViewer: React.FC = () => {
  return (
    <div>
      {/* TODO: Implement diff viewer with color-coded changes */}
      <h2>Diff Viewer</h2>
      <p>View AI-powered diffs here.</p>
    </div>
  );
};

export default DiffViewer;
EOF

# Create a Review component with a placeholder
cat << 'EOF' > src/components/Review/Review.tsx
import React from 'react';

const Review: React.FC = () => {
  return (
    <div>
      {/* TODO: Implement final review and merge approval UI */}
      <h2>Review</h2>
      <p>Review and finalize your document changes here.</p>
    </div>
  );
};

export default Review;
EOF

# Create a HomePage that brings together the components
cat << 'EOF' > src/pages/HomePage.tsx
import React from 'react';
import GoalSetting from '../components/GoalSetting/GoalSetting';
import DocumentUpload from '../components/DocumentUpload/DocumentUpload';
import DiffViewer from '../components/DiffViewer/DiffViewer';
import Review from '../components/Review/Review';

const HomePage: React.FC = () => {
  return (
    <div>
      <h1>AI-Powered Document Diffing and Merging App</h1>
      {/* TODO: Replace with proper routing or conditional rendering for each step */}
      <GoalSetting />
      <DocumentUpload />
      <DiffViewer />
      <Review />
    </div>
  );
};

export default HomePage;
EOF

# Create an API service file for backend interactions
cat << 'EOF' > src/services/api.ts
// TODO: Implement API service functions to interact with the FastAPI backend
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

export const login = async (credentials: any) => {
  // TODO: Implement login API call
  return axios.post(\`\${API_BASE_URL}/auth/login\`, credentials);
};

export const uploadDocument = async (file: File) => {
  // TODO: Implement document upload API call
  const formData = new FormData();
  formData.append('file', file);
  return axios.post(\`\${API_BASE_URL}/documents/upload\`, formData);
};

export const fetchDiff = async () => {
  // TODO: Implement fetch diff API call
  return axios.get(\`\${API_BASE_URL}/diffs\`);
};
EOF

# Create a Redux store placeholder (if you decide to use Redux)
cat << 'EOF' > src/store/index.ts
// TODO: Set up Redux store configuration if needed
import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
  reducer: {
    // TODO: Add your reducers here
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
EOF

echo "Frontend structure created successfully!"
