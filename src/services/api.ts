// File: src/services/api.ts
import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// Configure Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds
});

// Add request interceptor for authentication
api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
);

// Authentication
export const login = async (username: string, password: string): Promise<AxiosResponse> => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  return axios.post(`${API_BASE_URL}/auth/login`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getCurrentUser = async (): Promise<AxiosResponse> => {
  return api.get('/auth/me');
};

// Document Management
export const fetchDocuments = async (limit: number = 100, offset: number = 0): Promise<AxiosResponse> => {
  return api.get(`/documents?limit=${limit}&offset=${offset}`);
};

export const getDocument = async (id: number): Promise<AxiosResponse> => {
  return api.get(`/documents/${id}`);
};

export const uploadDocument = async (file: File): Promise<AxiosResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      // You can use this to track upload progress if needed
      const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
      console.log('Upload progress:', percentCompleted);
    }
  });
};

export const deleteDocument = async (id: number): Promise<AxiosResponse> => {
  return api.delete(`/documents/${id}`);
};

// Diff Operations
export const fetchDiff = async (
    docIdA: number,
    docIdB: number,
    enhanced: boolean = true
): Promise<AxiosResponse> => {
  return api.get(`/diffs?doc_id_a=${docIdA}&doc_id_b=${docIdB}&enhanced=${enhanced}`);
};

export const createAsyncDiff = async (
    docIdA: number,
    docIdB: number
): Promise<AxiosResponse> => {
  return api.post(`/diffs/async-diff?doc_id_a=${docIdA}&doc_id_b=${docIdB}`);
};

export const getTaskStatus = async (taskId: string): Promise<AxiosResponse> => {
  return api.get(`/diffs/task-status/${taskId}`);
};

// Merge Operations
export interface MergeRequest {
  doc_id_a: number;
  doc_id_b: number;
  conflict_resolution: string;
  ai_guidance?: {
    priorities?: string[];
    preserve_sections?: string[];
    custom_rules?: string[];
    notes?: string;
  };
}

export const mergeDocuments = async (mergeRequest: MergeRequest): Promise<AxiosResponse> => {
  return api.post('/diffs/merge', mergeRequest);
};

export const createAsyncMerge = async (mergeRequest: MergeRequest): Promise<AxiosResponse> => {
  return api.post('/diffs/async-merge', mergeRequest);
};

export const getMergeResult = async (
    taskId: string,
    applyResult: boolean = false
): Promise<AxiosResponse> => {
  return api.get(`/diffs/merge-result/${taskId}?apply_result=${applyResult}`);
};

// Poll task status until completed or failed
export const pollTaskUntilComplete = async (
    taskId: string,
    onProgress?: (progress: number, message: string) => void,
    interval: number = 1000,
    maxAttempts: number = 120
): Promise<any> => {
  let attempts = 0;

  const poll = async (): Promise<any> => {
    try {
      const response = await getTaskStatus(taskId);
      const result = response.data;

      // Report progress if callback provided
      if (onProgress && result.progress !== undefined) {
        onProgress(result.progress, result.message || '');
      }

      // Check if task is complete or failed
      if (result.status === 'completed') {
        return result;
      } else if (result.status === 'failed') {
        throw new Error(result.error || 'Task failed');
      } else if (attempts >= maxAttempts) {
        throw new Error('Maximum polling attempts reached');
      }

      // Continue polling
      attempts++;
      await new Promise(resolve => setTimeout(resolve, interval));
      return poll();
    } catch (error) {
      if (attempts >= maxAttempts) {
        throw new Error('Maximum polling attempts reached');
      }

      // Retry on network errors
      attempts++;
      await new Promise(resolve => setTimeout(resolve, interval));
      return poll();
    }
  };

  return poll();
};

// Error handler helper
export const handleApiError = (error: any): string => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    if (error.response.status === 401) {
      localStorage.removeItem('auth_token');
      return 'Authentication error. Please log in again.';
    }

    if (error.response.data && error.response.data.detail) {
      return error.response.data.detail;
    }

    return `Server error: ${error.response.status}`;
  } else if (error.request) {
    // The request was made but no response was received
    return 'No response from server. Please check your connection.';
  } else {
    // Something happened in setting up the request that triggered an Error
    return `Error: ${error.message}`;
  }
};

export default api;