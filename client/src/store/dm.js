import { defineStore } from "pinia";
import axios from "axios";
import socket from "../socket";

export const useDmStore = defineStore("dm", {
  state: () => ({
    dms: [],
    initialized: false
  }),

  actions: {
    async loadDms(userId) {
      const res = await axios.get(`/api/dm/list/${userId}`);
      this.dms = res.data;
    },

    initSocket(userId) {
      if (this.initialized) return; // 🔒 TEK SEFER

      socket.on("new-message", () => {
        this.loadDms(userId);
      });

      socket.on("messages-read", () => {
        this.loadDms(userId);
      });

      this.initialized = true;
    },

    reset() {
      this.dms = [];
      this.initialized = false;
      socket.off("new-message");
      socket.off("messages-read");
    }
  }
});
