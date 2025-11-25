import axios from 'axios';

// Determine base URL based on environment
// In Docker: use relative paths (Nginx proxies /api/auth/ and /api/)
// In development: use direct ports
const isDevelopment = import.meta.env.DEV;

// Auth Service API - handles login and registration
const authApi = axios.create({
    baseURL: isDevelopment ? 'http://localhost:8001' : '/api/auth',
});

// Backend API - handles routines and sessions
const backendApi = axios.create({
    baseURL: isDevelopment ? 'http://localhost:8000' : '/api',
});

// Add auth token to backend API requests
backendApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth Service Functions
export const login = async (username, password) => {
    const response = await authApi.post('/login', { username, password });
    return response.data;
};

export const register = async (username, password) => {
    const response = await authApi.post('/register', { username, password });
    return response.data;
};

// Backend Service Functions
export const createRoutine = async (name) => {
    const response = await backendApi.post('/routines/', { name });
    return response.data;
};

export const getRoutine = async (id) => {
    const response = await backendApi.get(`/routines/${id}`);
    return response.data;
};

export const getUserRoutines = async () => {
    const response = await backendApi.get('/routines/mine');
    return response.data;
};

export const addSession = async (routineId, session, token) => {
    const url = token ? `/routines/${routineId}/sessions/?token=${token}` : `/routines/${routineId}/sessions/`;
    const response = await backendApi.post(url, session);
    return response.data;
};

export const cancelSession = async (sessionId, isCancelled, token) => {
    const url = token ? `/sessions/${sessionId}/cancel?token=${token}&is_cancelled=${isCancelled}` : `/sessions/${sessionId}/cancel?is_cancelled=${isCancelled}`;
    const response = await backendApi.put(url);
    return response.data;
};

export const deleteSession = async (sessionId, token) => {
    const url = token ? `/sessions/${sessionId}?token=${token}` : `/sessions/${sessionId}`;
    const response = await backendApi.delete(url);
    return response.data;
};

export const exportRoutinePdf = (routineId) => {
    window.open(`http://localhost:8000/routines/${routineId}/export`, '_blank');
};

export const updateRoutine = async (id, data, token) => {
    const url = token ? `/routines/${id}?token=${token}` : `/routines/${id}`;
    const response = await backendApi.put(url, data);
    return response.data;
};

export const deleteRoutine = async (routineId, token) => {
    const url = token ? `/routines/${routineId}?token=${token}` : `/routines/${routineId}`;
    const response = await backendApi.delete(url);
    return response.data;
};
