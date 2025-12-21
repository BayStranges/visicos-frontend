<template>
  <div class="settings">
    <aside class="settings-nav">
      <div class="settings-title">Kullanici Ayarlari</div>
      <div class="settings-group">
        <button
          v-for="item in userSettings"
          :key="item"
          class="nav-btn"
          :class="{ active: activeTab === item }"
          @click="activeTab = item"
        >
          {{ item }}
        </button>
      </div>

      <div class="settings-title">Uygulama Ayarlari</div>
      <div class="settings-group">
        <button
          v-for="item in appSettings"
          :key="item"
          class="nav-btn"
          :class="{ active: activeTab === item }"
          @click="activeTab = item"
        >
          {{ item }}
        </button>
      </div>

      <div class="settings-title">Etkinlik Ayarlari</div>
      <div class="settings-group">
        <button
          v-for="item in activitySettings"
          :key="item"
          class="nav-btn"
          :class="{ active: activeTab === item }"
          @click="activeTab = item"
        >
          {{ item }}
        </button>
      </div>

      <button class="logout-btn" @click="logout">Cikis Yap</button>
    </aside>

    <main class="settings-panel">
      <div class="panel-header">
        <div class="panel-title">{{ activeTab }}</div>
      </div>

      <div v-if="activeTab === 'Hesabim'" class="panel-card">
        <div class="banner-wrap" @click="pickBanner">
          <img v-if="bannerPreview" :src="bannerPreview" />
          <div v-else class="banner-fallback">Banner</div>
          <div class="banner-overlay">Change banner</div>
        </div>
        <div class="header">
          <div class="avatar-wrap" @click="pickAvatar">
            <img v-if="preview" :src="preview" />
            <div v-else class="avatar-fallback">{{ initials }}</div>
            <div class="avatar-overlay">Change avatar</div>
          </div>
          <div class="user-info">
            <div class="label">Kullanici adi</div>
            <input v-model="username" />
            <div class="sub">E-posta: {{ user?.email }}</div>
          </div>
        </div>

        <div class="actions">
          <button @click="save" :disabled="loading">
            {{ loading ? "Kaydediliyor..." : "Kaydet" }}
          </button>
          <input ref="fileInput" type="file" hidden accept="image/*" @change="onFile" />
          <input ref="bannerInput" type="file" hidden accept="image/*" @change="onBannerFile" />
        </div>
      </div>

      <div v-else class="panel-card">
        <div class="panel-note">
          {{ activeTab }} ayarlari yakinda buradan yonetilecek.
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import axios from "axios";
import { useUserStore } from "../store/user";
import { useRouter } from "vue-router";

const userStore = useUserStore();
const router = useRouter();

const user = userStore.user;
const username = ref(user?.username || "");
const preview = ref(user?.avatar || "");
const bannerPreview = ref(user?.banner || "");
const fileInput = ref(null);
const bannerInput = ref(null);
const loading = ref(false);
const activeTab = ref("Hesabim");

const userSettings = [
  "Hesabim",
  "Icerik ve Sosyal",
  "Veri Gizliligi",
  "Cihazlar",
  "Baglantilar"
];

const appSettings = [
  "Gorunum",
  "Erisilebilirlik",
  "Ses Ve Goruntu",
  "Sohbet",
  "Bildirimler",
  "Dil",
  "Windows Ayarlari"
];

const activitySettings = [
  "Etkinlik Gizliligi",
  "Kayitli Oyunlar",
  "Oyun Arayuzu"
];

const initials = computed(() =>
  (user?.username || "U").slice(0, 2).toUpperCase()
);

const onEsc = (event) => {
  if (event.key === "Escape") router.push("/friends");
};

onMounted(() => {
  if (!user) router.push("/login");
  window.addEventListener("keydown", onEsc);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onEsc);
});

const pickAvatar = () => fileInput.value?.click();
const pickBanner = () => bannerInput.value?.click();

const onFile = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const form = new FormData();
  form.append("file", file);
  loading.value = true;
  try {
    const res = await axios.post("/api/upload", form);
    preview.value = `https://visicos-backend.onrender.com${res.data.url}`;
  } finally {
    loading.value = false;
  }
};

const onBannerFile = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const form = new FormData();
  form.append("file", file);
  loading.value = true;
  try {
    const res = await axios.post("/api/upload", form);
    bannerPreview.value = `https://visicos-backend.onrender.com${res.data.url}`;
  } finally {
    loading.value = false;
  }
};

const save = async () => {
  if (!user?._id) return;
  loading.value = true;
  try {
    const res = await axios.put(`/api/auth/profile/${user._id}`, {
      username: username.value,
      avatar: preview.value,
      banner: bannerPreview.value
    });
    userStore.setUser(res.data);
    alert("Profil guncellendi");
  } catch (e) {
    console.error(e);
    alert("Profil guncellenemedi");
  } finally {
    loading.value = false;
  }
};

const logout = () => {
  userStore.logout();
  router.push("/login");
};
</script>

<style scoped>
.settings {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 260px 1fr;
  background: var(--bg);
  color: var(--text);
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
}

.settings-nav {
  background: var(--bg-elev);
  border-right: 1px solid var(--border);
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.settings-title {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  text-align: left;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
}

.nav-btn.active,
.nav-btn:hover {
  background: #1f1f1f;
  color: var(--text-strong);
}

.logout-btn {
  margin-top: auto;
  background: #2b1313;
  border: 1px solid var(--accent-strong);
  color: var(--text-strong);
  border-radius: 10px;
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 700;
}

.settings-panel {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  font-size: 18px;
  font-weight: 700;
}

.panel-card {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 18px 30px rgba(0,0,0,0.4);
}

.panel-note {
  color: var(--text-muted);
  font-size: 13px;
}

.banner-wrap {
  width: 100%;
  height: 120px;
  border-radius: 14px;
  border: 1px solid var(--border-strong);
  background: var(--bg-elev-2);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  margin-bottom: 16px;
}

.banner-wrap img,
.banner-fallback {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: grid;
  place-items: center;
  color: var(--accent);
  font-weight: 700;
}

.banner-fallback {
  background: linear-gradient(145deg, var(--border-strong), #3a0f0f);
}

.banner-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0,0,0,0.55);
  color: var(--text);
  opacity: 0;
  transition: opacity 0.15s ease;
  font-size: 12px;
  text-align: center;
}

.banner-wrap:hover .banner-overlay {
  opacity: 1;
}

.header {
  display: flex;
  gap: 16px;
}

.avatar-wrap {
  width: 96px;
  height: 96px;
  border-radius: 18px;
  border: 1px solid var(--border-strong);
  background: var(--bg-elev-2);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.avatar-wrap img,
.avatar-fallback {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: grid;
  place-items: center;
  color: var(--accent);
  font-weight: 800;
}

.avatar-fallback {
  background: linear-gradient(145deg, var(--border-strong), #3a0f0f);
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0,0,0,0.55);
  color: var(--text);
  opacity: 0;
  transition: opacity 0.15s ease;
  font-size: 12px;
  text-align: center;
}

.avatar-wrap:hover .avatar-overlay {
  opacity: 1;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  color: var(--text-muted);
  font-size: 12px;
}

input {
  background: var(--input-bg);
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--text);
}

.sub {
  font-size: 12px;
  color: var(--text-muted);
}

.actions {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
}

button {
  background: linear-gradient(145deg, var(--accent-strong), var(--accent));
  color: var(--accent-dark);
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 700;
}

button:disabled {
  opacity: 0.6;
  cursor: default;
}

@media (max-width: 800px) {
  .settings {
    grid-template-columns: 1fr;
  }
  .settings-nav {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}
</style>
