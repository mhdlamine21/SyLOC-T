import axios from "axios";
import Cookies from "js-cookie";

const TOKEN_KEY = "access_token";

const getToken = () => Cookies.get(TOKEN_KEY);

const removeToken = () => {
  Cookies.remove(TOKEN_KEY);
  localStorage.removeItem("user");
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || "30000"),
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
