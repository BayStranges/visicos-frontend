import { defineStore } from "pinia";
import axios from "axios";
import { setSocketAuthToken } from "../socket";

export const useUserStore = defineStore("user", {
  state: () => ({
    user: JSON.parse(localStorage.getItem("user")) || null,
    token: localStorage.getItem("token") || null
  }),

  actions: {
    setUser(user, token) {
      this.user = user;
      localStorage.setItem("user", JSON.stringify(user));
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
