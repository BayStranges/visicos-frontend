import axios from "axios";

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

const isIosStandalone = () => {
  const ua = navigator.userAgent || "";
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  if (!isIos) return true;
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true;
  return isStandalone;
};

export const isPushSupported = () => {
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    isIosStandalone()
  );
};

export const initPushNotifications = async (userId) => {
  if (!userId) return;
  if (!isPushSupported()) return;

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
