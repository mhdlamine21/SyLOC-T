import axios from "axios";
import Cookies from "js-cookie";

const TOKEN_KEY = "access_token";

// Récupérer le token
const getToken = () => Cookies.get(TOKEN_KEY);

// Supprimer le token
const removeToken = () => {
  Cookies.remove(TOKEN_KEY);
  localStorage.removeItem("user");
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || "30000"),
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token
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

// Intercepteur pour gérer les erreurs 401
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
