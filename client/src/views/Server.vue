<template>
  <div class="server-page">
    <div v-if="loading" class="server-state">Loading...</div>
    <div v-else-if="error" class="server-state error">{{ error }}</div>
    <div v-else class="server-layout">
      <aside class="servers">
        <div class="logo" @click="goFriends">
          <img src="/logo.png" alt="Nexora logo" />
        </div>
        <div
          v-for="srv in servers"
          :key="srv._id"
          class="server-pill"
          :class="{ active: srv._id === server?._id }"
          @click="goServer(srv._id)"
        >
          <img v-if="srv.cover" :src="fullAsset(srv.cover)" />
          <span v-else>{{ (srv.name || "?").slice(0, 1).toUpperCase() }}</span>
        </div>
        <div class="server-pill add" @click="openCreateServer">+</div>
      </aside>

      <div class="server-shell">
        <aside class="channel-panel">
          <div class="server-header">
            <div class="server-header-title">{{ server?.name }}</div>
            <button class="server-drop">v</button>
          </div>

          <div class="channel-section">
            <div class="section-header">
              <span>Metin Kanallari</span>
              <button class="section-btn" @click="openChannelCreate('text')">+</button>
            </div>
            <div class="category-list">
              <div
                v-for="cat in server?.categories || []"
                :key="cat._id"
                class="category-block"
              >
                <div class="category-title">{{ cat.name }}</div>
                <div class="channel-list">
                  <div
                    v-for="ch in channelsByCategoryAndType(cat._id, 'text')"
                    :key="ch._id"
                    class="channel-row"
                  >
                    <button
                      class="channel-item"
                      :class="{ active: selectedChannel?._id === ch._id }"
                      @click="selectChannel(ch)"
                    >
                      <span class="channel-prefix">#</span>
                      <span class="channel-name">{{ ch.name }}</span>
                    </button>
                    <select class="channel-move" :value="ch.categoryId || ''" @change="moveChannel(ch, $event)">
                      <option value="">Kategorisiz</option>
                      <option v-for="c in server?.categories || []" :key="c._id" :value="c._id">
                        {{ c.name }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="category-block">
                <div class="category-title">Kategorisiz</div>
                <div class="channel-list">
                  <div
                    v-for="ch in channelsByCategoryAndType(null, 'text')"
                    :key="ch._id"
                    class="channel-row"
                  >
                    <button
                      class="channel-item"
                      :class="{ active: selectedChannel?._id === ch._id }"
                      @click="selectChannel(ch)"
                    >
                      <span class="channel-prefix">#</span>
                      <span class="channel-name">{{ ch.name }}</span>
                    </button>
                    <select class="channel-move" :value="ch.categoryId || ''" @change="moveChannel(ch, $event)">
                      <option value="">Kategorisiz</option>
                      <option v-for="c in server?.categories || []" :key="c._id" :value="c._id">
                        {{ c.name }}
                      </option>
                    </select>
                  </div>
                  <div
                    v-if="!channelsByCategoryAndType(null, 'text').length && !channelsByCategoryAndType(null, 'voice').length && !(server?.channels || []).length"
                    class="channel-empty"
                  >
                    Henuz kanal yok
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="channel-section">
            <div class="section-header">
              <span>Ses Kanallari</span>
              <button class="section-btn" @click="openChannelCreate('voice')">+</button>
            </div>
            <div class="category-list">
              <div
                v-for="cat in server?.categories || []"
                :key="cat._id"
                class="category-block"
              >
                <div class="category-title">{{ cat.name }}</div>
                <div class="channel-list">
                  <div
                    v-for="ch in channelsByCategoryAndType(cat._id, 'voice')"
                    :key="ch._id"
                    class="channel-row"
                  >
                    <button
                      class="channel-item"
                      :class="{ active: selectedChannel?._id === ch._id }"
                      @click="selectChannel(ch)"
                    >
                      <span class="channel-prefix">V</span>
                      <span class="channel-name">{{ ch.name }}</span>
                    </button>
                    <select class="channel-move" :value="ch.categoryId || ''" @change="moveChannel(ch, $event)">
                      <option value="">Kategorisiz</option>
                      <option v-for="c in server?.categories || []" :key="c._id" :value="c._id">
                        {{ c.name }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="category-block">
                <div class="category-title">Kategorisiz</div>
                <div class="channel-list">
                  <div
                    v-for="ch in channelsByCategoryAndType(null, 'voice')"
                    :key="ch._id"
                    class="channel-row"
                  >
                    <button
                      class="channel-item"
                      :class="{ active: selectedChannel?._id === ch._id }"
                      @click="selectChannel(ch)"
                    >
                      <span class="channel-prefix">V</span>
                      <span class="channel-name">{{ ch.name }}</span>
                    </button>
                    <select class="channel-move" :value="ch.categoryId || ''" @change="moveChannel(ch, $event)">
                      <option value="">Kategorisiz</option>
                      <option v-for="c in server?.categories || []" :key="c._id" :value="c._id">
                        {{ c.name }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="channel-create">
            <div class="panel-title">Kategori Olustur</div>
            <input v-model="newCategoryName" placeholder="Kategori adi" />
            <div v-if="categoryError" class="channel-error">{{ categoryError }}</div>
            <button class="primary-btn" :disabled="creatingCategory" @click="createCategory">
              {{ creatingCategory ? "Olusturuluyor..." : "Olustur" }}
            </button>
          </div>

          <div class="channel-create">
            <div class="panel-title">Kanal Olustur</div>
            <input ref="newChannelInput" v-model="newChannelName" placeholder="Kanal adi" />
            <select v-model="newChannelType">
              <option value="text">Metin</option>
              <option value="voice">Sesli</option>
            </select>
            <select v-model="newChannelCategoryId">
              <option value="">Kategorisiz</option>
              <option v-for="c in server?.categories || []" :key="c._id" :value="c._id">
                {{ c.name }}
              </option>
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
          <div v-if="selectedChannel && selectedChannel.type === 'text'" class="channel-chat">
            <div v-if="messagesLoading" class="channel-empty">Yukleniyor...</div>
            <div v-else-if="!channelMessages.length" class="channel-empty">Henuz mesaj yok</div>
            <div v-else class="channel-messages">
              <div v-for="msg in channelMessages" :key="msg._id" class="channel-message">
                <div class="message-avatar">
                  <img v-if="msg.sender?.avatar" :src="fullAsset(msg.sender.avatar)" />
                  <span v-else>{{ (msg.sender?.username || "?").slice(0, 1).toUpperCase() }}</span>
                </div>
                <div class="message-body">
                  <div class="message-meta">{{ msg.sender?.username || "User" }}</div>
                  <div class="message-text">{{ msg.content }}</div>
                </div>
              </div>
            </div>
            <div class="channel-input">
              <input
                v-model="messageText"
                placeholder="Mesaj yaz..."
                @keydown.enter.prevent="sendChannelMessage"
              />
              <button class="primary-btn" @click="sendChannelMessage">Gonder</button>
            </div>
          </div>
          <div v-else-if="selectedChannel && selectedChannel.type === 'voice'" class="voice-panel">
            <div class="voice-info">
              {{ voiceConnected && voiceChannelId === selectedChannel._id
                ? "Baglisin"
                : "Sesli kanala baglan" }}
            </div>
            <button
              class="primary-btn"
              @click="voiceConnected && voiceChannelId === selectedChannel._id ? leaveVoiceChannel() : joinVoiceChannel(selectedChannel)"
            >
              {{ voiceConnected && voiceChannelId === selectedChannel._id ? "Ayril" : "Baglan" }}
            </button>
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

    <transition name="fade">
      <div v-if="serverModalOpen" class="server-modal" @click="closeCreateServer">
        <div class="server-card modal-card" @click.stop>
          <div class="server-card-head">
            <div class="server-title">Sunucu Olustur</div>
            <button class="modal-close" @click="closeCreateServer">X</button>
          </div>
          <div class="server-field">
            <label>Sunucu adi</label>
            <input v-model="serverName" placeholder="Sunucu adi" />
          </div>
          <div class="server-field">
            <label>Kapak</label>
            <input type="file" accept="image/*" @change="onServerCoverChange" />
            <input
              v-model="serverCover"
              placeholder="Kapak URL (opsiyonel)"
              @input="onServerCoverUrlInput"
            />
          </div>
          <div v-if="serverCoverPreview" class="server-cover-preview">
            <img :src="serverCoverPreview" alt="Sunucu kapak" />
          </div>
          <div v-if="serverError" class="server-error">{{ serverError }}</div>
          <div class="server-actions">
            <button class="ghost-btn" @click="closeCreateServer">Iptal</button>
            <button class="primary-btn" :disabled="creatingServer" @click="createServer">
              {{ creatingServer ? "Olusturuluyor..." : "Olustur" }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { useUserStore } from "../store/user";
import socket from "../socket";
import { startSfuCall, stopSfuCall, startMic } from "../webrtc/sfu";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const server = ref(null);
const servers = ref([]);
const loading = ref(true);
const error = ref("");
const selectedChannel = ref(null);
const newChannelName = ref("");
const newChannelType = ref("text");
const newChannelCategoryId = ref("");
const channelError = ref("");
const creatingChannel = ref(false);
const newCategoryName = ref("");
const categoryError = ref("");
const creatingCategory = ref(false);
const serverModalOpen = ref(false);
const serverName = ref("");
const serverCover = ref("");
const serverCoverFile = ref(null);
const serverCoverPreview = ref("");
const serverError = ref("");
const creatingServer = ref(false);
let coverObjectUrl = "";
const newChannelInput = ref(null);
const channelMessages = ref([]);
const messageText = ref("");
const messagesLoading = ref(false);
const currentChannelId = ref("");
const voiceConnected = ref(false);
const voiceChannelId = ref("");
const audioEls = new Map();

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
      if (selectedChannel.value?.type === "text") {
        joinTextChannel(selectedChannel.value._id);
      }
    }
  } catch (err) {
    error.value = err?.response?.data?.message || "Server not found";
  } finally {
    loading.value = false;
  }
};

const loadServers = async () => {
  const userId = userStore.user?._id;
  if (!userId) return;
  try {
    const res = await axios.get(`/api/servers/list/${userId}`);
    servers.value = res.data || [];
  } catch (err) {
    servers.value = [];
  }
};

const selectChannel = (ch) => {
  selectedChannel.value = ch;
  if (ch?.type === "text") {
    joinTextChannel(ch._id);
  } else {
    leaveTextChannel();
  }
};

const channelsByCategoryAndType = (categoryId, type) => {
  const list = server.value?.channels || [];
  return list.filter((ch) => {
    const sameType = ch.type === type;
    const sameCategory = categoryId
      ? ch.categoryId?.toString() === categoryId?.toString()
      : !ch.categoryId;
    return sameType && sameCategory;
  });
};

const openChannelCreate = (type) => {
  newChannelType.value = type;
  nextTick(() => {
    newChannelInput.value?.focus();
  });
};

const cleanupAudio = () => {
  for (const el of audioEls.values()) {
    try {
      el.pause();
      el.srcObject = null;
    } catch {}
  }
  audioEls.clear();
};

const ensureSocket = () => {
  if (!socket.connected) socket.connect();
};

const loadChannelMessages = async (channelId) => {
  messagesLoading.value = true;
  try {
    const res = await axios.get(
      `/api/servers/${route.params.id}/channels/${channelId}/messages?limit=200`
    );
    channelMessages.value = res.data || [];
  } catch (err) {
    channelMessages.value = [];
  } finally {
    messagesLoading.value = false;
  }
};

const joinTextChannel = async (channelId) => {
  if (!channelId) return;
  ensureSocket();
  if (currentChannelId.value && currentChannelId.value !== channelId) {
    socket.emit("leave-channel", { channelId: currentChannelId.value });
  }
  currentChannelId.value = channelId;
  socket.emit("join-channel", { channelId, userId: userStore.user?._id });
  await loadChannelMessages(channelId);
};

const leaveTextChannel = () => {
  if (currentChannelId.value) {
    socket.emit("leave-channel", { channelId: currentChannelId.value });
  }
  currentChannelId.value = "";
  channelMessages.value = [];
};

const sendChannelMessage = () => {
  const content = messageText.value.trim();
  if (!content || !selectedChannel.value) return;
  ensureSocket();
  socket.emit("send-channel-message", {
    serverId: route.params.id,
    channelId: selectedChannel.value._id,
    senderId: userStore.user?._id,
    content
  });
  messageText.value = "";
};

const handleChannelMessage = (message) => {
  if (!message?.channel) return;
  if (message.channel.toString() !== currentChannelId.value) return;
  channelMessages.value.push(message);
};

const joinVoiceChannel = async (channel) => {
  if (!channel) return;
  if (voiceConnected.value && voiceChannelId.value === channel._id) return;
  if (voiceConnected.value) {
    await leaveVoiceChannel();
  }
  voiceConnected.value = true;
  voiceChannelId.value = channel._id;
  await startSfuCall({
    room: channel._id,
    user: userStore.user?._id,
    onTrack: ({ userId, stream }) => {
      const key = `${userId}-${channel._id}-${stream.id}`;
      if (audioEls.has(key)) return;
      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.srcObject = stream;
      audioEls.set(key, audio);
    },
    onProducerClosed: () => {}
  });
  await startMic();
};

const leaveVoiceChannel = async () => {
  if (!voiceConnected.value) return;
  voiceConnected.value = false;
  voiceChannelId.value = "";
  cleanupAudio();
  await stopSfuCall();
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
      type: newChannelType.value,
      categoryId: newChannelCategoryId.value || null
    });
    server.value.channels = [...(server.value.channels || []), res.data];
    selectedChannel.value = res.data;
    newChannelName.value = "";
    newChannelCategoryId.value = "";
  } catch (err) {
    channelError.value = err?.response?.data?.message || "Kanal olusturulamadi";
  } finally {
    creatingChannel.value = false;
  }
};

const moveChannel = async (channel, event) => {
  const value = event.target.value || null;
  try {
    const res = await axios.patch(
      `/api/servers/${route.params.id}/channels/${channel._id}`,
      { categoryId: value || null }
    );
    const idx = server.value.channels.findIndex((ch) => ch._id === channel._id);
    if (idx >= 0) server.value.channels[idx] = res.data;
    if (selectedChannel.value?._id === channel._id) {
      selectedChannel.value = res.data;
    }
  } catch (err) {
    channelError.value = err?.response?.data?.message || "Kanal tasinamadi";
  }
};

const createCategory = async () => {
  if (!newCategoryName.value.trim()) {
    categoryError.value = "Kategori adi gerekli";
    return;
  }
  categoryError.value = "";
  creatingCategory.value = true;
  try {
    const res = await axios.post(`/api/servers/${route.params.id}/categories`, {
      name: newCategoryName.value.trim()
    });
    server.value.categories = [...(server.value.categories || []), res.data];
    newCategoryName.value = "";
  } catch (err) {
    categoryError.value = err?.response?.data?.message || "Kategori olusturulamadi";
  } finally {
    creatingCategory.value = false;
  }
};

const openCreateServer = () => {
  serverError.value = "";
  serverName.value = "";
  serverCover.value = "";
  serverCoverFile.value = null;
  if (coverObjectUrl) {
    URL.revokeObjectURL(coverObjectUrl);
    coverObjectUrl = "";
  }
  serverCoverPreview.value = "";
  serverModalOpen.value = true;
};

const closeCreateServer = () => {
  serverModalOpen.value = false;
  serverError.value = "";
  if (coverObjectUrl) {
    URL.revokeObjectURL(coverObjectUrl);
    coverObjectUrl = "";
  }
};

const onServerCoverChange = (event) => {
  const file = event.target.files?.[0];
  if (coverObjectUrl) {
    URL.revokeObjectURL(coverObjectUrl);
    coverObjectUrl = "";
  }
  if (!file) {
    serverCoverFile.value = null;
    serverCoverPreview.value = fullAsset(serverCover.value.trim());
    return;
  }
  serverCoverFile.value = file;
  coverObjectUrl = URL.createObjectURL(file);
  serverCoverPreview.value = coverObjectUrl;
};

const onServerCoverUrlInput = () => {
  if (!serverCoverFile.value) {
    serverCoverPreview.value = fullAsset(serverCover.value.trim());
  }
};

const createServer = async () => {
  const ownerId = userStore.user?._id;
  if (!serverName.value.trim()) {
    serverError.value = "Sunucu adi gerekli";
    return;
  }
  if (!ownerId) {
    serverError.value = "Kullanici bulunamadi";
    return;
  }
  serverError.value = "";
  creatingServer.value = true;
  try {
    let coverUrl = serverCover.value.trim();
    if (serverCoverFile.value) {
      const form = new FormData();
      form.append("file", serverCoverFile.value);
      const uploadRes = await axios.post("/api/upload", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      coverUrl = uploadRes.data?.url || "";
    }
    const res = await axios.post("/api/servers", {
      name: serverName.value.trim(),
      cover: coverUrl,
      ownerId
    });
    await loadServers();
    closeCreateServer();
    router.push(`/server/${res.data._id}`);
  } catch (err) {
    serverError.value = err?.response?.data?.message || "Sunucu olusturulamadi";
  } finally {
    creatingServer.value = false;
  }
};

const goServer = (id) => router.push(`/server/${id}`);
const goFriends = () => router.push("/friends");

onMounted(() => {
  if (!userStore.user) {
    router.push("/login");
    return;
  }
  ensureSocket();
  socket.on("channel-message", handleChannelMessage);
  loadServers();
  loadServer();
});

onBeforeUnmount(() => {
  socket.off("channel-message", handleChannelMessage);
  leaveTextChannel();
  leaveVoiceChannel();
});

watch(
  () => route.params.id,
  () => {
    leaveTextChannel();
    leaveVoiceChannel();
    selectedChannel.value = null;
    loadServer();
    loadServers();
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

.server-state {
  padding: 20px;
  color: var(--text-muted);
}

.server-state.error {
  color: #ff9a9a;
}

.server-layout {
  display: grid;
  grid-template-columns: 80px 1fr;
  min-height: 100vh;
}

.servers {
  background: var(--bg-elev);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  gap: 12px;
}

.logo {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(145deg, var(--accent-strong), var(--accent));
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 20px;
  color: #fff;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
  cursor: pointer;
}

.logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.server-pill {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--accent-dark);
  display: grid;
  place-items: center;
  color: var(--accent);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
  overflow: hidden;
}

.server-pill img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.server-pill:hover {
  background: var(--border-strong);
  transform: translateY(-2px);
}

.server-pill.active {
  border-color: var(--accent-strong);
  box-shadow: 0 0 0 2px rgba(247, 201, 72, 0.35);
}

.server-pill.add {
  background: #1f1f1f;
  color: var(--accent);
  border: 1px dashed var(--border-soft);
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

.server-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 12px;
  background: #1f1f22;
  border: 1px solid #2a2a2e;
}

.server-header-title {
  font-size: 14px;
  font-weight: 700;
}

.server-drop {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 12px;
}

.server-card {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  background: var(--bg-elev-2);
  border: 1px solid var(--border);
}

.server-card.modal-card {
  background: #2a2b30;
  border: 1px solid #35363b;
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

.panel-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--text-muted);
}

.channel-section {
  display: grid;
  gap: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--text-muted);
}

.section-btn {
  background: transparent;
  border: 1px solid #2a2a2e;
  color: var(--text-muted);
  border-radius: 6px;
  width: 20px;
  height: 20px;
  line-height: 18px;
  text-align: center;
  cursor: pointer;
}

.section-btn:hover {
  color: var(--text-strong);
  border-color: #3a3a3f;
}

.category-list {
  display: grid;
  gap: 10px;
  min-height: 0;
  overflow-y: auto;
}

.category-block {
  display: grid;
  gap: 6px;
}

.category-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-strong);
}

.channel-list {
  display: grid;
  gap: 6px;
}

.channel-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 6px;
  align-items: center;
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

.channel-move {
  background: #1f1f22;
  border: 1px solid #33343a;
  border-radius: 8px;
  padding: 4px 6px;
  color: var(--text);
  font-size: 11px;
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

.ghost-btn {
  background: transparent;
  border: 1px solid #3a3b41;
  color: var(--text-muted);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
}

.ghost-btn:hover {
  color: var(--text-strong);
  border-color: #4a4b52;
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

.channel-chat {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  flex: 1;
}

.channel-messages {
  display: grid;
  gap: 10px;
  overflow-y: auto;
  min-height: 0;
  flex: 1;
  padding-bottom: 8px;
}

.channel-message {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 10px;
  align-items: start;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #1f1f22;
  display: grid;
  place-items: center;
  color: var(--accent);
  font-weight: 700;
  overflow: hidden;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-body {
  display: grid;
  gap: 4px;
}

.message-meta {
  font-size: 12px;
  color: var(--text-muted);
}

.message-text {
  font-size: 14px;
}

.channel-input {
  display: flex;
  gap: 8px;
  align-items: center;
  position: sticky;
  bottom: 0;
  padding-top: 8px;
  background: var(--bg-elev-2);
}

.channel-input input {
  flex: 1;
  background: #1f1f22;
  border: 1px solid #33343a;
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--text);
}

.voice-panel {
  display: grid;
  gap: 10px;
}

.voice-info {
  font-size: 13px;
  color: var(--text-muted);
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
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 10px;
}

.member-row:last-child {
  border-bottom: none;
}

.member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #1f1f22;
  display: grid;
  place-items: center;
  color: var(--accent);
  font-weight: 700;
  overflow: hidden;
  position: relative;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.member-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.member-row:hover {
  background: #1f1f22;
}

.member-avatar::after {
  content: "";
  position: absolute;
  right: 1px;
  bottom: 1px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2ecc71;
  border: 2px solid var(--bg-elev);
}

.server-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 90;
}

.server-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.server-title {
  font-size: 16px;
  font-weight: 700;
}

.server-field {
  display: grid;
  gap: 8px;
}

.server-field label {
  font-size: 12px;
  color: var(--text-muted);
}

.server-field input {
  background: #1f1f22;
  border: 1px solid #33343a;
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--text);
}

.server-cover-preview {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #33343a;
}

.server-cover-preview img {
  width: 100%;
  display: block;
  height: 160px;
  object-fit: cover;
}

.server-error {
  color: #ff9a9a;
  font-size: 12px;
}

.server-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.modal-close {
  background: transparent;
  border: 1px solid #33343a;
  color: var(--text-muted);
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
}

.modal-close:hover {
  color: var(--text-strong);
  border-color: #4a4b52;
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
  .server-layout {
    grid-template-columns: 64px 1fr;
  }

  .server-shell {
    display: flex;
    gap: 0;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
  }

  .channel-panel,
  .channel-main,
  .members-panel {
    min-width: 100%;
    scroll-snap-align: start;
  }

  .server-shell::-webkit-scrollbar {
    display: none;
  }

  .logo,
  .server-pill {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }
}
</style>
