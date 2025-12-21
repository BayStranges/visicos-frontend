import axios from "./axios";

const api = axios.create({
  baseURL: "http://localhost:3001/api/auth",
});

export const login = (email, password) => {
  return api.post("/login", { email, password });
};

export const register = (email, password) => {
  return api.post("/register", { email, password });
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }
  return config;
});
