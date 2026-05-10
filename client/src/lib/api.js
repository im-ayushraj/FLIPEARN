import axios from 'axios';

const api = axios.create({
  baseURL:         import.meta.env.VITE_BACKEND_URL + '/api',
  withCredentials: true,
});

let authTokenProvider = null;

export const setAuthTokenProvider = (provider) => {
  authTokenProvider = provider;
};

// Attach Bearer token — called from TokenInjector in main.jsx
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

api.interceptors.request.use(async (config) => {
  if (authTokenProvider) {
    const token = await authTokenProvider();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers?.Authorization) {
      delete config.headers.Authorization;
    }
  }
  return config;
});

// Response interceptor — surface server error messages nicely
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default api;
