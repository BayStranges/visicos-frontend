import { createApp } from "vue";
import axios from "axios";
import App from "./App.vue";
import "./style.css";
import router from "./router";
import socket from "./socket";
import { createPinia } from "pinia";
import { useUserStore } from "./store/user";
import { useDmStore } from "./store/dm";

axios.defaults.baseURL = "https://visicos-backend.onrender.com";

const app = createApp(App);

app.use(createPinia());
app.use(router);

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const ensureServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/service-worker.js");
    return reg;
  } catch (err) {
    try {
      return await navigator.serviceWorker.ready;
    } catch (innerErr) {
      return null;
    }
  }
};

const initPushNotifications = async (userId) => {
  if (!userId) return;
  if (!("Notification" in window)) return;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  const ua = navigator.userAgent || "";
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true;
  if (isIos && !isStandalone) return;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const reg = await ensureServiceWorker();
  if (!reg) return;

  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    const res = await axios.get("/api/push/vapid-public-key");
    const publicKey = res.data?.publicKey;
    if (!publicKey) return;
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
  }

  await axios.post("/api/push/subscribe", {
    userId,
    subscription: subscription.toJSON ? subscription.toJSON() : subscription,
    userAgent: navigator.userAgent || ""
  }).catch(() => {});
};

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


