<template>
  <div class="server-page">
    <header class="server-head">
      <button class="back-btn" @click="goBack">Back</button>
      <div class="server-head-title">{{ server?.name || "Server" }}</div>
    </header>

    <div v-if="loading" class="server-state">Loading...</div>
    <div v-else-if="error" class="server-state error">{{ error }}</div>
    <div v-else class="server-shell">
      <aside class="channel-panel">
        <div class="server-card">
          <div class="server-card-cover" :class="{ empty: !server?.cover }">
            <img v-if="server?.cover" :src="fullAsset(server.cover)" />
            <div v-else class="server-card-fallback">
              {{ (server?.name || "S").slice(0, 1).toUpperCase() }}
            </div>
          </div>
          <div class="server-card-meta">
            <div class="server-name">{{ server?.name }}</div>
            <div class="server-owner">Owner: {{ server?.owner?.username || "Unknown" }}</div>
          </div>
        </div>

        <div class="panel-title">Kanallar</div>
        <div class="channel-list">
          <button
            v-for="ch in server?.channels || []"
            :key="ch._id"
            class="channel-item"
            :class="{ active: selectedChannel?._id === ch._id }"
            @click="selectChannel(ch)"
          >
            <span class="channel-prefix">{{ ch.type === "voice" ? "V" : "#" }}</span>
            <span class="channel-name">{{ ch.name }}</span>
          </button>
          <div v-if="!server?.channels?.length" class="channel-empty">
            Henuz kanal yok
          </div>
        </div>

        <div class="channel-create">
          <div class="panel-title">Kanal Olustur</div>
          <input v-model="newChannelName" placeholder="Kanal adi" />
          <select v-model="newChannelType">
            <option value="text">Metin</option>
            <option value="voice">Sesli</option>
          </select>
          <div v-if="channelError" class="channel-error">{{ channelError }}</div>
          <button class="primary-btn" :disabled="creatingChannel" @click="createChannel">
            {{ creatingChannel ? "Olusturuluyor..." : "Olustur" }}
          </button>
        </div>
      </aside>

      <main class="channel-main">
        <div v-if="selectedChannel" class="channel-header">
          <div class="channel-title">
            <span class="channel-prefix">{{ selectedChannel.type === "voice" ? "V" : "#" }}</span>
            {{ selectedChannel.name }}
          </div>
          <div class="channel-type">
            {{ selectedChannel.type === "voice" ? "Sesli Kanal" : "Metin Kanal" }}
          </div>
        </div>
        <div v-else class="channel-placeholder">
          Bir kanal sec
        </div>
      </main>

      <aside class="members-panel">
        <div class="panel-title">Aktif Kullanicilar</div>
        <div v-if="!server?.members?.length" class="channel-empty">Kimse yok</div>
        <div v-for="u in server?.members || []" :key="u._id" class="member-row">
          <div class="member-avatar">
            <img v-if="u.avatar" :src="fullAsset(u.avatar)" />
            <span v-else>{{ (u.username || "?").slice(0, 1).toUpperCase() }}</span>
          </div>
          <div class="member-name">{{ u.username }}</div>
        </div>
      </aside>
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
const selectedChannel = ref(null);
const newChannelName = ref("");
const newChannelType = ref("text");
const channelError = ref("");
const creatingChannel = ref(false);

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
    if (server.value?.channels?.length && !selectedChannel.value) {
      selectedChannel.value = server.value.channels[0];
    }
  } catch (err) {
    error.value = err?.response?.data?.message || "Server not found";
  } finally {
    loading.value = false;
  }
};

const selectChannel = (ch) => {
  selectedChannel.value = ch;
};

const createChannel = async () => {
  if (!newChannelName.value.trim()) {
    channelError.value = "Kanal adi gerekli";
    return;
  }
  channelError.value = "";
  creatingChannel.value = true;
  try {
    const res = await axios.post(`/api/servers/${route.params.id}/channels`, {
      name: newChannelName.value.trim(),
      type: newChannelType.value
    });
    server.value.channels = [...(server.value.channels || []), res.data];
    selectedChannel.value = res.data;
    newChannelName.value = "";
  } catch (err) {
    channelError.value = err?.response?.data?.message || "Kanal olusturulamadi";
  } finally {
    creatingChannel.value = false;
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
    selectedChannel.value = null;
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

.server-shell {
  display: grid;
  grid-template-columns: 260px 1fr 260px;
  gap: 16px;
  padding: 16px;
  min-height: 0;
  flex: 1;
}

.channel-panel,
.members-panel {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.server-card {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  background: var(--bg-elev-2);
  border: 1px solid var(--border);
}

.server-card-cover {
  height: 120px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--bg);
}

.server-card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.server-card-cover.empty {
  display: grid;
  place-items: center;
}

.server-card-fallback {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent);
}

.server-card-meta {
  display: grid;
  gap: 4px;
}

.server-name {
  font-size: 16px;
  font-weight: 700;
}

.server-owner {
  font-size: 12px;
  color: var(--text-muted);
}

.panel-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--text-muted);
}

.channel-list {
  display: grid;
  gap: 6px;
  overflow-y: auto;
  min-height: 0;
}

.channel-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  border-radius: 10px;
  padding: 6px 8px;
  cursor: pointer;
  text-align: left;
}

.channel-item.active,
.channel-item:hover {
  background: #1f1f22;
  color: var(--text);
  border-color: #2a2a2e;
}

.channel-prefix {
  font-size: 12px;
}

.channel-empty {
  font-size: 12px;
  color: var(--text-muted);
  padding: 6px 0;
}

.channel-create {
  display: grid;
  gap: 8px;
}

.channel-create input,
.channel-create select {
  background: #1f1f22;
  border: 1px solid #33343a;
  border-radius: 10px;
  padding: 8px 10px;
  color: var(--text);
}

.channel-error {
  color: #ff9a9a;
  font-size: 12px;
}

.primary-btn {
  background: linear-gradient(145deg, var(--accent-strong), var(--accent));
  color: var(--accent-dark);
  border: none;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 700;
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.channel-main {
  background: var(--bg-elev-2);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.channel-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.channel-title {
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.channel-type {
  font-size: 12px;
  color: var(--text-muted);
}

.channel-placeholder {
  color: var(--text-muted);
  font-size: 13px;
}

.member-row {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 8px;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #1b1b1f;
}

.member-row:last-child {
  border-bottom: none;
}

.member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1f1f22;
  display: grid;
  place-items: center;
  color: var(--accent);
  font-weight: 700;
  overflow: hidden;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.member-name {
  font-size: 13px;
}

@media (max-width: 980px) {
  .server-shell {
    grid-template-columns: 220px 1fr;
  }

  .members-panel {
    display: none;
  }
}

@media (max-width: 720px) {
  .server-shell {
    grid-template-columns: 1fr;
  }

  .channel-panel {
    order: 2;
  }
}
</style>
