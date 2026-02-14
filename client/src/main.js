import { createApp } from "vue";
import axios from "axios";
import App from "./App.vue";
import "./style.css";
import router from "./router";
import socket from "./socket";
import { createPinia } from "pinia";
import { useUserStore } from "./store/user";
import { useDmStore } from "./store/dm";
import { initPushNotifications } from "./push";
import { API_BASE_URL } from "./config";

axios.defaults.baseURL = API_BASE_URL;
const bootToken = localStorage.getItem("token");
if (bootToken) {
  axios.defaults.headers.common.Authorization = `Bearer ${bootToken}`;
}

const app = createApp(App);

app.use(createPinia());
app.use(router);

router.isReady().then(() => {
  const userStore = useUserStore();
  const dmStore = useDmStore();

  if (userStore.user?._id) {
    socket.connect();
    socket.emit("user-online", userStore.user._id);

    dmStore.initSocket(userStore.user._id);
    dmStore.loadDms(userStore.user._id);

    const getDeviceId = () => {
      let id = localStorage.getItem("visicos_device_id");
      if (!id) {
        id = (crypto?.randomUUID && crypto.randomUUID()) ||
          `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        localStorage.setItem("visicos_device_id", id);
      }
      return id;
    };

    const getDeviceName = () => {
      const ua = navigator.userAgent || "";
      let os = "Unknown";
      if (/Windows/i.test(ua)) os = "Windows";
      else if (/Mac/i.test(ua)) os = "Mac";
      else if (/Android/i.test(ua)) os = "Android";
      else if (/iPhone|iPad/i.test(ua)) os = "iOS";
      const app = /Electron|Discord/i.test(ua) ? "Nexora Client" : "Web";
      return `${os} - ${app}`;
    };

    axios.post("/api/auth/devices/register", {
      userId: userStore.user._id,
      deviceId: getDeviceId(),
      name: getDeviceName(),
      location: Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown",
      userAgent: navigator.userAgent || ""
    }).catch(() => {});

    initPushNotifications(userStore.user._id);
  }

  app.mount("#app");
});


