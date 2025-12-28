<template>
  <div class="server-page">
    <header class="server-head">
      <button class="back-btn" @click="goBack">Back</button>
      <div class="server-head-title">{{ server?.name || "Server" }}</div>
    </header>

    <div v-if="loading" class="server-state">Loading...</div>
    <div v-else-if="error" class="server-state error">{{ error }}</div>
    <div v-else class="server-body">
      <div class="server-cover" :class="{ empty: !server?.cover }">
        <img v-if="server?.cover" :src="fullAsset(server.cover)" />
        <div v-else class="server-cover-fallback">
          {{ (server?.name || "S").slice(0, 1).toUpperCase() }}
        </div>
      </div>
      <div class="server-info">
        <div class="server-name">{{ server?.name }}</div>
        <div class="server-owner">Owner: {{ server?.owner?.username || "Unknown" }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { useUserStore } from "../store/user";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const server = ref(null);
const loading = ref(true);
const error = ref("");

const fullAsset = (url = "") => {
  if (!url) return "";
  return url.startsWith("http") ? url : `https://visicos-backend.onrender.com${url}`;
};

const loadServer = async () => {
  loading.value = true;
  error.value = "";
  try {
    const res = await axios.get(`/api/servers/${route.params.id}`);
    server.value = res.data;
  } catch (err) {
    error.value = err?.response?.data?.message || "Server not found";
  } finally {
    loading.value = false;
  }
};

const goBack = () => router.push("/friends");

onMounted(() => {
  if (!userStore.user) {
    router.push("/login");
    return;
  }
  loadServer();
});

watch(
  () => route.params.id,
  () => {
    loadServer();
  }
);
</script>

<style scoped>
.server-page {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  display: flex;
  flex-direction: column;
}

.server-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-elev);
}

.back-btn {
  background: #1f1f1f;
  border: 1px solid var(--border-strong);
  color: var(--text);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
}

.server-head-title {
  font-size: 16px;
  font-weight: 700;
}

.server-state {
  padding: 20px;
  color: var(--text-muted);
}

.server-state.error {
  color: #ff9a9a;
}

.server-body {
  padding: 20px;
  display: grid;
  gap: 16px;
}

.server-cover {
  width: min(720px, 100%);
  height: 220px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--bg-elev-2);
}

.server-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.server-cover.empty {
  display: grid;
  place-items: center;
}

.server-cover-fallback {
  font-size: 48px;
  font-weight: 700;
  color: var(--accent);
}

.server-info {
  display: grid;
  gap: 6px;
}

.server-name {
  font-size: 20px;
  font-weight: 700;
}

.server-owner {
  font-size: 13px;
  color: var(--text-muted);
}
</style>
