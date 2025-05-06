import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import './utils/debugUtils'; // Import debug utilities
import { handleSignalHireProfileRequest, handleFetchProfileDataRequest } from './api';

// Let's bypass the MSW setup for now since it's causing issues with Vite
// We'll rely on our API implementations directly

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
