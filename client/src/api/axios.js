// client/src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // sends cookies automatically
});

// If access token expires, try to refresh once
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        return api(original);
      } catch {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
