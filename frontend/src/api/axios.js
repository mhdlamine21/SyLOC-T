import axios from "axios";
import Cookies from "js-cookie";

const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token";
const USER_KEY = "syloct_user";

export const getToken = () => Cookies.get(TOKEN_KEY);
export const getRefreshToken = () => Cookies.get(REFRESH_KEY);

export const setSession = ({ access, refresh, user }) => {
  if (access) Cookies.set(TOKEN_KEY, access, { expires: 1, sameSite: "Lax" });
  if (refresh) Cookies.set(REFRESH_KEY, refresh, { expires: 7, sameSite: "Lax" });
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("user");
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
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
    // Laisse axios poser la bonne frontière multipart lors d'un upload.
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// --- Rafraîchissement automatique du token (une seule requête à la fois) ----
let refreshEnCours = null;

const rafraichirToken = async () => {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("Pas de refresh token");
  const { data } = await axios.post(
    `${api.defaults.baseURL}/comptes/token/refresh/`,
    { refresh },
    { headers: { "Content-Type": "application/json" } },
  );
  setSession({ access: data.access, refresh: data.refresh });
  return data.access;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    const estRequeteAuth =
      typeof config.url === "string" &&
      (config.url.includes("/comptes/login/") || config.url.includes("/token/refresh/"));

    if (error.response?.status === 401 && !config.__retry && !estRequeteAuth) {
      config.__retry = true;
      try {
        refreshEnCours = refreshEnCours || rafraichirToken();
        const access = await refreshEnCours;
        refreshEnCours = null;
        config.headers = { ...config.headers, Authorization: `Bearer ${access}` };
        return api(config);
      } catch {
        refreshEnCours = null;
        clearSession();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
