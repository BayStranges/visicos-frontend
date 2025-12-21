<template>
  <div class="profile">
    <div class="card">
      <div class="header">
        <div class="avatar-wrap" @click="pickAvatar">
          <img v-if="preview" :src="preview" />
          <div v-else class="avatar-fallback">{{ initials }}</div>
          <div class="avatar-overlay">Avatarı değiştir</div>
        </div>
        <div class="user-info">
          <div class="label">Kullanıcı adı</div>
          <input v-model="username" />
          <div class="sub">E-posta: {{ user?.email }}</div>
        </div>
      </div>

      <div class="actions">
        <button @click="save" :disabled="loading">
          {{ loading ? "Kaydediliyor..." : "Kaydet" }}
        </button>
        <input ref="fileInput" type="file" hidden accept="image/*" @change="onFile" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { useUserStore } from "../store/user";
import { useRouter } from "vue-router";

const userStore = useUserStore();
const router = useRouter();

const user = userStore.user;
const username = ref(user?.username || "");
const preview = ref(user?.avatar || "");
const fileInput = ref(null);
const loading = ref(false);

const initials = computed(() =>
  (user?.username || "U").slice(0, 2).toUpperCase()
);

onMounted(() => {
  if (!user) router.push("/login");
});

const pickAvatar = () => fileInput.value?.click();

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

const save = async () => {
  if (!user?._id) return;
  loading.value = true;
  try {
    const res = await axios.put(`/api/auth/profile/${user._id}`, {
      username: username.value,
      avatar: preview.value
    });
    userStore.setUser(res.data);
    alert("Profil güncellendi");
  } catch (e) {
    console.error(e);
    alert("Profil güncellenemedi");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.profile {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0b0b0b;
  color: #f6f0d5;
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
}

.card {
  width: 420px;
  background: #0f0f0f;
  border: 1px solid #1b0b0b;
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 18px 30px rgba(0,0,0,0.4);
}

.header {
  display: flex;
  gap: 16px;
}

.avatar-wrap {
  width: 96px;
  height: 96px;
  border-radius: 18px;
  border: 1px solid #2b1313;
  background: #141414;
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
  color: #f7c948;
  font-weight: 800;
}

.avatar-fallback {
  background: linear-gradient(145deg, #2b1313, #3a0f0f);
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0,0,0,0.55);
  color: #f6f0d5;
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
  color: #c7bfa4;
  font-size: 12px;
}

input {
  background: #0d0d0d;
  border: 1px solid #2b1313;
  border-radius: 10px;
  padding: 10px 12px;
  color: #f6f0d5;
}

.sub {
  font-size: 12px;
  color: #c7bfa4;
}

.actions {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
}

button {
  background: linear-gradient(145deg, #c31432, #f7c948);
  color: #1a0d0d;
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
</style>
