import Cookies from "js-cookie";

const TOKEN_KEY = "access_token";
const USER_KEY = "user";

export const setToken = (token) => {
  Cookies.set(TOKEN_KEY, token, { expires: 7, secure: true, sameSite: "Lax" });
};

export const getToken = () => Cookies.get(TOKEN_KEY);

export const removeToken = () => {
  Cookies.remove(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const setUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const getRole = () => {
  const user = getUser();
  return user?.role || null;
};

export const isAuthenticated = () => !!getToken();
