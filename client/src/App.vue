<template>
  <div v-if="showAppGate" class="app-gate">
    <div class="app-gate-card">
      <div class="app-gate-logo">
        <img src="/logo.png" alt="Nexora logo" />
      </div>
      <div class="app-gate-title">Nexora sadece mobil uygulama olarak acilir</div>
      <div class="app-gate-desc">
        Devam etmek icin bu sayfayi ana ekrana ekleyip uygulama olarak ac.
      </div>
      <div class="app-gate-steps">
        <div class="app-gate-step">
          iOS: Paylas &gt; Ana Ekrana Ekle
        </div>
        <div class="app-gate-step">
          Android: Menu &gt; Ana ekrana ekle / Uygulamayi yukle
        </div>
      </div>
      <button
        v-if="canInstall"
        class="app-gate-btn"
        @click="installApp"
      >
        Uygulamayi Yukle
      </button>
    </div>
  </div>
  <router-view v-else />
  <div v-if="showPushPrompt" class="push-banner">
    <div class="push-banner-text">Bildirimleri acmak ister misin?</div>
    <button class="push-banner-btn" @click="requestPush">Bildirimleri Ac</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useUserStore } from "./store/user";
import { initPushNotifications } from "./push";

const showAppGate = ref(false);
const canInstall = ref(false);
const deferredPrompt = ref(null);
const userStore = useUserStore();
const pushPromptDismissed = ref(false);

const checkStandalone = () => {
  const ua = navigator.userAgent || "";
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true;
  showAppGate.value = isMobile && !isStandalone;
};

const showPushPrompt = computed(() => {
  if (showAppGate.value) return false;
  if (pushPromptDismissed.value) return false;
  if (!userStore.user?._id) return false;
  return Notification.permission === "default";
});

const requestPush = async () => {
  if (!userStore.user?._id) return;
  await initPushNotifications(userStore.user._id);
  pushPromptDismissed.value = true;
};

const onBeforeInstallPrompt = (event) => {
  event.preventDefault();
  deferredPrompt.value = event;
  canInstall.value = true;
};

const onAppInstalled = () => {
  deferredPrompt.value = null;
  canInstall.value = false;
  checkStandalone();
};

const installApp = async () => {
  if (!deferredPrompt.value) return;
  deferredPrompt.value.prompt();
  try {
    const result = await deferredPrompt.value.userChoice;
    if (result?.outcome === "accepted") {
      canInstall.value = false;
    }
  } catch (err) {
    // Ignore prompt errors
  } finally {
    deferredPrompt.value = null;
  }
};

let mediaQuery;

onMounted(() => {
  checkStandalone();
  window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  window.addEventListener("appinstalled", onAppInstalled);
  mediaQuery = window.matchMedia?.("(display-mode: standalone)");
  if (mediaQuery?.addEventListener) {
    mediaQuery.addEventListener("change", checkStandalone);
  } else if (mediaQuery?.addListener) {
    mediaQuery.addListener(checkStandalone);
  }
  window.addEventListener("visibilitychange", checkStandalone);
});

onBeforeUnmount(() => {
  if (mediaQuery?.removeEventListener) {
    mediaQuery.removeEventListener("change", checkStandalone);
  } else if (mediaQuery?.removeListener) {
    mediaQuery.removeListener(checkStandalone);
  }
  window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  window.removeEventListener("appinstalled", onAppInstalled);
  window.removeEventListener("visibilitychange", checkStandalone);
});
</script>

<style scoped>
.app-gate {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at top, #1b1b1f, #0b0b0b);
  color: #f1f1f1;
  padding: 24px;
}

.app-gate-card {
  background: #16161a;
  border: 1px solid #2b2b32;
  border-radius: 18px;
  padding: 24px;
  display: grid;
  gap: 12px;
  text-align: center;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 20px 50px rgba(0,0,0,0.45);
}

.app-gate-logo {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: transparent;
  color: #0b0b0b;
  font-weight: 800;
  display: grid;
  place-items: center;
  margin: 0 auto;
}

.app-gate-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.app-gate-title {
  font-size: 16px;
  font-weight: 700;
}

.app-gate-desc {
  font-size: 12px;
  color: #b3b3b3;
}

.app-gate-steps {
  display: grid;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
  color: #d6d6d6;
}

.app-gate-step {
  background: #1f1f24;
  border: 1px solid #2b2b32;
  border-radius: 12px;
  padding: 10px 12px;
}

.app-gate-btn {
  margin-top: 12px;
  background: linear-gradient(145deg, #f7c948, #ff9f1c);
  color: #1a1408;
  border: none;
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 700;
  cursor: pointer;
}

.app-gate-btn:hover {
  filter: brightness(1.05);
}

.push-banner {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 16px;
  background: #16161a;
  border: 1px solid #2b2b32;
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  z-index: 40;
  box-shadow: 0 16px 32px rgba(0,0,0,0.35);
}

.push-banner-text {
  font-size: 13px;
  color: #f1f1f1;
}

.push-banner-btn {
  border: none;
  background: linear-gradient(145deg, #f7c948, #ff9f1c);
  color: #1a1408;
  border-radius: 10px;
  padding: 8px 12px;
  font-weight: 700;
  cursor: pointer;
}
</style>


<style scoped>
.app-gate {
  background:
    radial-gradient(820px 420px at 50% -20%, rgba(115, 174, 255, 0.35), transparent 62%),
    linear-gradient(180deg, #0b111a, #090d13);
}

.app-gate-card {
  background: rgba(18, 28, 40, 0.92);
  border: 1px solid rgba(120, 168, 233, 0.32);
  box-shadow: 0 30px 64px rgba(7, 13, 24, 0.5);
}

.app-gate-step {
  background: rgba(14, 23, 34, 0.9);
  border: 1px solid rgba(95, 134, 184, 0.35);
}

.app-gate-btn,
.push-banner-btn {
  background: linear-gradient(135deg, #65b8ff, #2f82ff);
  color: #f7fbff;
}

.push-banner {
  background: rgba(16, 26, 38, 0.95);
  border: 1px solid rgba(119, 168, 232, 0.3);
}
</style>
