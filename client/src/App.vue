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
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

const showAppGate = ref(false);
const canInstall = ref(false);
const deferredPrompt = ref(null);

const checkStandalone = () => {
  const ua = navigator.userAgent || "";
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true;
  showAppGate.value = isMobile && !isStandalone;
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
</style>

