import { defineStore } from "pinia";
import axios from "axios";
import { setSocketAuthToken } from "../socket";

const normalizeUser = (user) => {
  if (!user) return null;
  if (user.user && typeof user.user === "object") return user.user;
  return user;
};

const bootUser = normalizeUser(JSON.parse(localStorage.getItem("user")) || null);

export const useUserStore = defineStore("user", {
  state: () => ({
    user: bootUser,
    token: localStorage.getItem("token") || null
  }),

  actions: {
    setUser(user, token) {
      const normalized = normalizeUser(user);
      this.user = normalized;
      localStorage.setItem("user", JSON.stringify(normalized));
      if (token) {
        this.token = token;
        localStorage.setItem("token", token);
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        setSocketAuthToken(token);
      }
    },

    setToken(token) {
      this.token = token;
      if (token) {
        localStorage.setItem("token", token);
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        setSocketAuthToken(token);
      } else {
        localStorage.removeItem("token");
        delete axios.defaults.headers.common.Authorization;
        setSocketAuthToken("");
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      delete axios.defaults.headers.common.Authorization;
      setSocketAuthToken("");
    }
  }
});
