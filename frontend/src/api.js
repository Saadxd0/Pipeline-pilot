// api.js — Centralised Axios instance with base URL from env
import axios from 'axios';

// In production the API URL comes from the VITE_API_URL env variable.
// During local dev, Vite's proxy forwards /api → http://localhost:8000.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
});

export default api;
