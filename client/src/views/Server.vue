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
        <aside class="channel-panel" @contextmenu.prevent="openServerMenu">
          <div class="server-header">
            <div class="server-header-title">{{ server?.name }}</div>
            <button class="server-drop">v</button>
          </div>
          <div v-if="inviteStatus" class="invite-status">{{ inviteStatus }}</div>

          <div class="channel-section">
            <div class="section-header">
              <span>Metin Kanallari</span>
            </div>
            <div class="category-list">
              <div
                v-for="cat in server?.categories || []"
                :key="cat._id"
                class="category-block"
                :class="{ 'drop-target': isOwner && dragOverKey === `text-${cat._id}` }"
                @dragover.prevent="onCategoryDragOver(`text-${cat._id}`)"
                @dragleave="onCategoryDragLeave(`text-${cat._id}`)"
                @drop.prevent="onCategoryDrop(cat._id, 'text')"
              >
                <div class="category-title">{{ cat.name }}</div>
                <div class="channel-list">
                  <div
                    v-for="ch in channelsByCategoryAndType(cat._id, 'text')"
                    :key="ch._id"
                    class="channel-row"
                    :draggable="isOwner"
                    @dragstart="onChannelDragStart(ch)"
                    @dragend="onChannelDragEnd"
                  >
                    <button
                      class="channel-item"
                      :class="{ active: selectedChannel?._id === ch._id }"
                      @click="selectChannel(ch)"
                    >
                      <span class="channel-prefix">#</span>
                      <span class="channel-name">{{ ch.name }}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div
                class="category-block"
                :class="{ 'drop-target': isOwner && dragOverKey === 'text-uncat' }"
                @dragover.prevent="onCategoryDragOver('text-uncat')"
                @dragleave="onCategoryDragLeave('text-uncat')"
                @drop.prevent="onCategoryDrop(null, 'text')"
              >
                <div class="category-title">Kategorisiz</div>
                <div class="channel-list">
                  <div
                    v-for="ch in channelsByCategoryAndType(null, 'text')"
                    :key="ch._id"
                    class="channel-row"
                    :draggable="isOwner"
                    @dragstart="onChannelDragStart(ch)"
                    @dragend="onChannelDragEnd"
                  >
                    <button
                      class="channel-item"
                      :class="{ active: selectedChannel?._id === ch._id }"
                      @click="selectChannel(ch)"
                    >
                      <span class="channel-prefix">#</span>
                      <span class="channel-name">{{ ch.name }}</span>
                    </button>
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
            </div>
            <div class="category-list">
              <div
                v-for="cat in server?.categories || []"
                :key="cat._id"
                class="category-block"
                :class="{ 'drop-target': isOwner && dragOverKey === `voice-${cat._id}` }"
                @dragover.prevent="onCategoryDragOver(`voice-${cat._id}`)"
                @dragleave="onCategoryDragLeave(`voice-${cat._id}`)"
                @drop.prevent="onCategoryDrop(cat._id, 'voice')"
              >
                <div class="category-title">{{ cat.name }}</div>
                <div class="channel-list">
                  <div
                    v-for="ch in channelsByCategoryAndType(cat._id, 'voice')"
                    :key="ch._id"
                    class="channel-row"
                    :draggable="isOwner"
                    @dragstart="onChannelDragStart(ch)"
                    @dragend="onChannelDragEnd"
                  >
                    <button
                      class="channel-item"
                      :class="{ active: selectedChannel?._id === ch._id }"
                      @click="selectChannel(ch)"
                    >
                      <span class="channel-prefix">V</span>
                      <span class="channel-name">{{ ch.name }}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div
                class="category-block"
                :class="{ 'drop-target': isOwner && dragOverKey === 'voice-uncat' }"
                @dragover.prevent="onCategoryDragOver('voice-uncat')"
                @dragleave="onCategoryDragLeave('voice-uncat')"
                @drop.prevent="onCategoryDrop(null, 'voice')"
              >
                <div class="category-title">Kategorisiz</div>
                <div class="channel-list">
                  <div
                    v-for="ch in channelsByCategoryAndType(null, 'voice')"
                    :key="ch._id"
                    class="channel-row"
                    :draggable="isOwner"
                    @dragstart="onChannelDragStart(ch)"
                    @dragend="onChannelDragEnd"
                  >
                    <button
                      class="channel-item"
                      :class="{ active: selectedChannel?._id === ch._id }"
                      @click="selectChannel(ch)"
                    >
                      <span class="channel-prefix">V</span>
                      <span class="channel-name">{{ ch.name }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="server-userbar" @click="toggleProfileCard">
            <div class="userbar-avatar">
              <img v-if="userStore.user?.avatar" :src="fullAsset(userStore.user.avatar)" />
              <span v-else>{{ (userStore.user?.username || "?").slice(0, 1).toUpperCase() }}</span>
              <span class="userbar-dot" :class="{ offline: !isSelfOnline }"></span>
            </div>
            <div class="userbar-meta">
              <div class="userbar-name">{{ userStore.user?.username || "Kullanici" }}</div>
              <div class="userbar-status">{{ isSelfOnline ? "Cevrimici" : "Cevrimdisi" }}</div>
            </div>
            <div class="userbar-actions">
              <button class="userbar-icon" :class="{ off: selfMute }" @click.stop="selfMute = !selfMute" title="Mikrofon">
                <svg viewBox="0 0 24 24"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a1 1 0 1 1 2 0 7 7 0 0 1-6 6.93V21h2a1 1 0 1 1 0 2H9a1 1 0 0 1 0-2h2v-3.07A7 7 0 0 1 5 11a1 1 0 1 1 2 0 5 5 0 0 0 10 0Z" /></svg>
              </button>
              <button class="userbar-icon" :class="{ off: selfDeaf }" @click.stop="selfDeaf = !selfDeaf" title="Kulaklik">
                <svg viewBox="0 0 24 24"><path d="M12 3a7 7 0 0 0-7 7v3.5A2.5 2.5 0 0 0 7.5 16H9a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H7V10a5 5 0 0 1 10 0v.5h-2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1.5a2.5 2.5 0 0 0 2.5-2.5V10a7 7 0 0 0-7-7Z" /></svg>
              </button>
              <button class="userbar-icon" @click.stop="goProfile" title="Profil">
                <svg viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5a1 1 0 0 0 2 0c0-1.57 2.69-3 6-3s6 1.43 6 3a1 1 0 1 0 2 0c0-2.76-3.58-5-8-5Z" /></svg>
              </button>
            </div>
          </div>
        </aside>

        <main class="channel-main">
          <div v-if="selectedChannel" class="channel-header">
            <div class="channel-title">
              <span class="channel-prefix">{{ selectedChannel.type === "voice" ? "V" : "#" }}</span>
              {{ selectedChannel.name }}
            </div>
            <div class="channel-head-right">
              <div class="channel-type">
                {{ selectedChannel.type === "voice" ? "Sesli Kanal" : "Metin Kanal" }}
              </div>
              <input class="channel-search" :placeholder="`${server?.name || 'Sunucu'} sunucusunu ara`" />
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
            <div class="voice-top">
              <div class="voice-top-title">{{ selectedChannel.name }} ile sesli gorusme</div>
              <div class="voice-top-badge" :class="{ live: voiceConnected && voiceChannelId === selectedChannel._id }">
                {{ voiceConnected && voiceChannelId === selectedChannel._id ? "Bagli" : "Beklemede" }}
              </div>
            </div>

            <div class="voice-stage">
              <div class="voice-card me">
                <div class="voice-avatar">
                  <img v-if="userStore.user?.avatar" :src="fullAsset(userStore.user.avatar)" />
                  <span v-else>{{ (userStore.user?.username || "?").slice(0, 1).toUpperCase() }}</span>
                </div>
                <div class="voice-name">{{ userStore.user?.username || "Sen" }}</div>
              </div>
              <div class="voice-card activity">
                <div class="voice-activity-title">Aktivite alani</div>
                <div class="voice-activity-sub">Sesli sohbete davet et veya aktivite sec</div>
                <div class="voice-activity-actions">
                  <button class="voice-ghost-btn">Sesli Sohbete Davet Et</button>
                  <button class="voice-ghost-btn">Aktivite Sec</button>
                </div>
              </div>
            </div>

            <div class="voice-controls">
              <button class="voice-ctrl-btn" :class="{ off: selfMute }" @click="selfMute = !selfMute" title="Mikrofon">
                <svg viewBox="0 0 24 24"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a1 1 0 1 1 2 0 7 7 0 0 1-6 6.93V21h2a1 1 0 1 1 0 2H9a1 1 0 0 1 0-2h2v-3.07A7 7 0 0 1 5 11a1 1 0 1 1 2 0 5 5 0 0 0 10 0Z" /></svg>
              </button>
              <button class="voice-ctrl-btn" title="Video">
                <svg viewBox="0 0 24 24"><path d="M17 10.5V7a2 2 0 0 0-2-2H5A2 2 0 0 0 3 7v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3.5l4 3V7.5l-4 3Z" /></svg>
              </button>
              <button class="voice-ctrl-btn" title="Ekran">
                <svg viewBox="0 0 24 24"><path d="M3 5h18v12H3V5Zm7 14h4v2h-4v-2Z" /></svg>
              </button>
              <button
                class="voice-ctrl-btn danger"
                @click="voiceConnected && voiceChannelId === selectedChannel._id ? leaveVoiceChannel() : joinVoiceChannel(selectedChannel)"
                :title="voiceConnected && voiceChannelId === selectedChannel._id ? 'Bitir' : 'Baglan'"
              >
                <svg viewBox="0 0 24 24"><path d="M4 10.5c5.2-4.7 10.8-4.7 16 0l-1.8 2.2a14.7 14.7 0 0 0-12.4 0L4 10.5Z" /></svg>
              </button>
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

    <UserQuickCard
      :open="profileCardOpen"
      :username="userStore.user?.username || ''"
      :avatar="userStore.user?.avatar ? fullAsset(userStore.user.avatar) : ''"
      :banner="userStore.user?.banner ? fullAsset(userStore.user.banner) : ''"
      :is-online="isSelfOnline"
      :dnd-enabled="dndEnabled"
      @close="closeProfileCard"
      @edit-profile="goProfile"
      @toggle-dnd="toggleDnd"
      @switch-account="switchAccount"
      @copy-id="copyUserId"
    />

    <div
      v-if="serverMenuOpen"
      class="server-context-menu"
      :style="{ left: `${serverMenuPos.x}px`, top: `${serverMenuPos.y}px` }"
      @click.stop
    >
      <button class="menu-check" @click="toggleHideMutedChannels">
        <span>Sust. Kanallari Gizle</span>
        <span class="menu-check-box" :class="{ checked: hideMutedChannels }"></span>
      </button>
      <div class="menu-divider"></div>
      <button v-if="isOwner" class="menu-item" @click="createChannelFromMenu">Kanal Olustur</button>
      <button v-if="isOwner" class="menu-item" @click="createCategoryFromMenu">Kategori Olustur</button>
      <button v-if="isOwner" class="menu-item" @click="createInviteCode">Sunucuya Davet Et</button>
    </div>

    <transition name="fade">
      <div v-if="channelCreateOpen" class="create-modal" @click="closeChannelModal">
        <div class="create-card" @click.stop>
          <div class="create-head">
            <div class="create-title">Kanal Olustur</div>
            <button class="create-close" @click="closeChannelModal">X</button>
          </div>

          <div class="create-section">
            <label class="create-label">Kanal Turu</label>
            <div class="channel-type-list">
              <button class="channel-type-item" :class="{ active: channelDraftType === 'text' }" @click="channelDraftType = 'text'">
                <span class="channel-type-radio"></span>
                <span class="channel-type-main"># Metin</span>
                <span class="channel-type-sub">Mesajlar, resimler, GIF'ler</span>
              </button>
              <button class="channel-type-item" :class="{ active: channelDraftType === 'voice' }" @click="channelDraftType = 'voice'">
                <span class="channel-type-radio"></span>
                <span class="channel-type-main">V Ses</span>
                <span class="channel-type-sub">Birlikte sesli gorusme</span>
              </button>
            </div>
          </div>

          <div class="create-section">
            <label class="create-label">Kanal Adi</label>
            <input v-model="channelDraftName" class="create-input" placeholder="yeni-kanal" />
          </div>

          <div class="create-toggle-row">
            <div class="create-toggle-text">
              <div class="toggle-title">Ozel Kanal</div>
              <div class="toggle-sub">Sadece secili uyeler gorebilir</div>
            </div>
            <button class="toggle-btn" :class="{ on: channelDraftPrivate }" @click="channelDraftPrivate = !channelDraftPrivate"></button>
          </div>

          <div v-if="channelError" class="create-error">{{ channelError }}</div>

          <div class="create-actions">
            <button class="create-cancel" @click="closeChannelModal">Iptal</button>
            <button class="create-submit" :disabled="creatingChannel" @click="submitChannelModal">
              {{ creatingChannel ? "Olusturuluyor..." : "Kanal Olustur" }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="categoryCreateOpen" class="create-modal" @click="closeCategoryModal">
        <div class="create-card" @click.stop>
          <div class="create-head">
            <div class="create-title">Kategori Olustur</div>
            <button class="create-close" @click="closeCategoryModal">X</button>
          </div>

          <div class="create-section">
            <label class="create-label">Kategori Adi</label>
            <input v-model="categoryDraftName" class="create-input" placeholder="Yeni Kategori" />
          </div>

          <div class="create-toggle-row">
            <div class="create-toggle-text">
              <div class="toggle-title">Ozel Kategori</div>
              <div class="toggle-sub">Bagli kanallar icin ayni izinler uygulanir</div>
            </div>
            <button class="toggle-btn" :class="{ on: categoryDraftPrivate }" @click="categoryDraftPrivate = !categoryDraftPrivate"></button>
          </div>

          <div v-if="categoryError" class="create-error">{{ categoryError }}</div>

          <div class="create-actions">
            <button class="create-cancel" @click="closeCategoryModal">Iptal</button>
            <button class="create-submit" :disabled="creatingCategory" @click="submitCategoryModal">
              {{ creatingCategory ? "Olusturuluyor..." : "Kategori Olustur" }}
            </button>
          </div>
        </div>
      </div>
    </transition>

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
import { computed, ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { ASSET_BASE_URL } from "../config";
import { useUserStore } from "../store/user";
import UserQuickCard from "../components/UserQuickCard.vue";
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
const channelMessages = ref([]);
const messageText = ref("");
const messagesLoading = ref(false);
const currentChannelId = ref("");
const voiceConnected = ref(false);
const voiceChannelId = ref("");
const selfMute = ref(false);
const selfDeaf = ref(false);
const inviteStatus = ref("");
const hideMutedChannels = ref(false);
const serverMenuOpen = ref(false);
const serverMenuPos = ref({ x: 0, y: 0 });
const draggingChannelId = ref("");
const draggingChannelType = ref("");
const dragOverKey = ref("");
const profileCardOpen = ref(false);
const dndEnabled = ref(localStorage.getItem("visicos_dnd") === "1");
const channelCreateOpen = ref(false);
const categoryCreateOpen = ref(false);
const channelDraftName = ref("");
const channelDraftType = ref("text");
const channelDraftPrivate = ref(false);
const categoryDraftName = ref("");
const categoryDraftPrivate = ref(false);
const audioEls = new Map();

const fullAsset = (url = "") => {
  if (!url) return "";
  return url.startsWith("http") ? url : `${ASSET_BASE_URL}${url}`;
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
    const status = err?.response?.status;
    const message = err?.response?.data?.message || "";

    if (status === 403 || status === 404 || message.toLowerCase().includes("yetkisiz")) {
      await loadServers();
      const fallback = (servers.value || []).find((srv) => srv?._id);
      if (fallback?._id && fallback._id !== route.params.id) {
        router.replace(`/server/${fallback._id}`);
      } else {
        router.replace("/friends");
      }
      return;
    }

    error.value = message || "Server not found";
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

const openServerMenu = (event) => {
  if (!isOwner.value) return;
  serverMenuPos.value = { x: event.clientX, y: event.clientY };
  serverMenuOpen.value = true;
};

const closeServerMenu = () => {
  serverMenuOpen.value = false;
};

const toggleHideMutedChannels = () => {
  hideMutedChannels.value = !hideMutedChannels.value;
  closeServerMenu();
};

const closeChannelModal = () => {
  channelCreateOpen.value = false;
  channelError.value = "";
};

const closeCategoryModal = () => {
  categoryCreateOpen.value = false;
  categoryError.value = "";
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
    return false;
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
    return true;
  } catch (err) {
    channelError.value = err?.response?.data?.message || "Kanal olusturulamadi";
    return false;
  } finally {
    creatingChannel.value = false;
  }
};

const createChannelFromMenu = async () => {
  if (!isOwner.value) return;
  channelDraftName.value = "";
  channelDraftType.value = "text";
  channelDraftPrivate.value = false;
  channelCreateOpen.value = true;
  closeServerMenu();
};

const submitChannelModal = async () => {
  if (!isOwner.value) return;
  newChannelName.value = channelDraftName.value.trim();
  newChannelType.value = channelDraftType.value;
  newChannelCategoryId.value = "";
  const ok = await createChannel();
  if (ok) closeChannelModal();
};

const updateChannelCategory = async (channel, value) => {
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

const onChannelDragStart = (channel) => {
  if (!isOwner.value) return;
  draggingChannelId.value = channel?._id || "";
  draggingChannelType.value = channel?.type || "";
};

const onChannelDragEnd = () => {
  draggingChannelId.value = "";
  draggingChannelType.value = "";
  dragOverKey.value = "";
};

const onCategoryDragOver = (key) => {
  if (!isOwner.value || !draggingChannelId.value) return;
  dragOverKey.value = key;
};

const onCategoryDragLeave = (key) => {
  if (dragOverKey.value === key) dragOverKey.value = "";
};

const onCategoryDrop = async (categoryId, type) => {
  if (!isOwner.value || !draggingChannelId.value) return;
  const channel = (server.value?.channels || []).find((ch) => ch._id === draggingChannelId.value);
  if (!channel || channel.type !== type) {
    onChannelDragEnd();
    return;
  }
  await updateChannelCategory(channel, categoryId || null);
  onChannelDragEnd();
};

const createCategory = async () => {
  if (!newCategoryName.value.trim()) {
    categoryError.value = "Kategori adi gerekli";
    return false;
  }
  categoryError.value = "";
  creatingCategory.value = true;
  try {
    const res = await axios.post(`/api/servers/${route.params.id}/categories`, {
      name: newCategoryName.value.trim()
    });
    server.value.categories = [...(server.value.categories || []), res.data];
    newCategoryName.value = "";
    return true;
  } catch (err) {
    categoryError.value = err?.response?.data?.message || "Kategori olusturulamadi";
    return false;
  } finally {
    creatingCategory.value = false;
  }
};

const createCategoryFromMenu = async () => {
  if (!isOwner.value) return;
  categoryDraftName.value = "";
  categoryDraftPrivate.value = false;
  categoryCreateOpen.value = true;
  closeServerMenu();
};

const submitCategoryModal = async () => {
  if (!isOwner.value) return;
  newCategoryName.value = categoryDraftName.value.trim();
  const ok = await createCategory();
  if (ok) closeCategoryModal();
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
const goProfile = () => router.push("/profile");
const toggleProfileCard = () => {
  profileCardOpen.value = !profileCardOpen.value;
};
const closeProfileCard = () => {
  profileCardOpen.value = false;
};
const toggleDnd = () => {
  dndEnabled.value = !dndEnabled.value;
  localStorage.setItem("visicos_dnd", dndEnabled.value ? "1" : "0");
};
const switchAccount = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  router.push("/login");
};
const copyUserId = async () => {
  const id = userStore.user?._id || "";
  if (!id) return;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(id);
  }
};
const isSelfOnline = computed(() => !!userStore.user?.isOnline);
const isOwner = computed(() => {
  const ownerId = server.value?.owner?._id || server.value?.owner;
  return !!ownerId && ownerId.toString() === userStore.user?._id?.toString();
});

const createInviteCode = async () => {
  if (!isOwner.value) return;
  inviteStatus.value = "";
  try {
    const res = await axios.post(`/api/servers/${route.params.id}/invite`);
    const code = res.data?.code || "";
    if (!code) {
      inviteStatus.value = "Davet kodu olusturulamadi";
      return;
    }
    const text = `${window.location.origin}/invite/${code}`;
    await navigator.clipboard.writeText(text);
    inviteStatus.value = `Davet hazir: ${code} (kopyalandi)`;
  } catch (err) {
    inviteStatus.value = err?.response?.data?.message || "Davet olusturulamadi";
  }
  closeServerMenu();
};

onMounted(() => {
  if (!userStore.user) {
    router.push("/login");
    return;
  }
  ensureSocket();
  socket.on("channel-message", handleChannelMessage);
  document.addEventListener("click", closeServerMenu);
  loadServers();
  loadServer();
});

onBeforeUnmount(() => {
  socket.off("channel-message", handleChannelMessage);
  document.removeEventListener("click", closeServerMenu);
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

.category-block.drop-target {
  outline: 1px dashed rgba(122, 194, 255, 0.75);
  outline-offset: 3px;
  border-radius: 8px;
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

.channel-row[draggable="true"] {
  cursor: grab;
}

.channel-row[draggable="true"]:active {
  cursor: grabbing;
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
  grid-template-rows: auto 1fr auto;
  gap: 14px;
  min-height: 0;
  flex: 1;
}

.voice-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.voice-top-title {
  font-size: 16px;
  font-weight: 700;
  color: #d8ebff;
}

.voice-top-badge {
  font-size: 11px;
  font-weight: 700;
  color: #d8e6ff;
  background: #283447;
  border: 1px solid #3f516d;
  border-radius: 999px;
  padding: 4px 9px;
}

.voice-top-badge.live {
  background: #2a3e2d;
  border-color: #4f9a5c;
  color: #b8efc0;
}

.voice-stage {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  min-height: 0;
}

.voice-card {
  border: 1px solid rgba(99, 151, 216, 0.36);
  border-radius: 10px;
  background: #090f17;
  min-height: 360px;
  position: relative;
  overflow: hidden;
}

.voice-card.me {
  display: grid;
  place-items: center;
  background: #a4a1de;
}

.voice-avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  background: #1e2330;
  display: grid;
  place-items: center;
  color: #d4e7ff;
  font-size: 34px;
  font-weight: 800;
}

.voice-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.voice-name {
  position: absolute;
  left: 12px;
  bottom: 12px;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 8px;
}

.voice-card.activity {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 10px;
  background: radial-gradient(120% 120% at 50% 0%, #402457 0%, #090f17 62%);
}

.voice-activity-title {
  font-size: 18px;
  font-weight: 800;
  color: #e2e7ff;
}

.voice-activity-sub {
  font-size: 13px;
  color: #b8bfd8;
}

.voice-activity-actions {
  display: flex;
  gap: 10px;
}

.voice-ghost-btn {
  border: 1px solid #3f4f68;
  background: #1b2331;
  color: #e2e8ff;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
}

.voice-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding-bottom: 2px;
}

.voice-ctrl-btn {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  border: 1px solid #3d4f68;
  background: #1c2737;
  color: #d5e8ff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.voice-ctrl-btn.off {
  color: #8ea4bc;
  background: #182030;
}

.voice-ctrl-btn.danger {
  background: #c93d50;
  border-color: #c93d50;
  color: #fff;
}

.voice-ctrl-btn svg {
  width: 21px;
  height: 21px;
  fill: currentColor;
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

<style scoped>
.server-page,
.server-layout {
  --accent: #7ac2ff;
  --accent-strong: #3b8de8;
  --accent-dark: #102841;
  --border: #2d4764;
  --border-strong: #416289;
  --border-soft: #5078a6;
  background:
    radial-gradient(780px 360px at 58% -20%, rgba(82, 157, 255, 0.16), transparent 62%),
    #0c131c;
}

.channel-panel,
.members-panel,
.channel-main,
.server-header,
.channel-item,
.channel-move,
.channel-create input,
.channel-create select,
.channel-input input,
.server-card,
.server-field input {
  border-color: rgba(99, 151, 216, 0.36) !important;
}

.channel-panel,
.members-panel,
.channel-main,
.server-card {
  box-shadow: 0 20px 44px rgba(7, 14, 27, 0.34);
}

.channel-item.active,
.channel-item:hover,
.member-row:hover {
  background: rgba(76, 130, 197, 0.2);
}

.primary-btn {
  background: linear-gradient(135deg, #76beff, #3a8eea) !important;
  color: #08203b !important;
}

.server-shell {
  gap: 0;
  padding: 0;
  grid-template-columns: 300px 1fr 260px;
}

.channel-panel,
.channel-main,
.members-panel {
  border-radius: 0;
  border-top: none;
  border-bottom: none;
  box-shadow: none;
}

.channel-main {
  border-left: none;
  border-right: none;
}

.channel-panel {
  position: relative;
  padding: 0 0 82px;
  overflow: hidden;
}

.server-header {
  border-left: none;
  border-right: none;
  border-top: none;
  border-bottom: 1px solid rgba(99, 151, 216, 0.36) !important;
  border-radius: 0;
  background: #121b28;
  padding: 14px 16px;
}

.server-header-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.server-invite-btn {
  border: 1px solid rgba(99, 151, 216, 0.42);
  background: #162234;
  color: #d4ebff;
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
}

.invite-status {
  margin: 8px 12px 0;
  font-size: 12px;
  color: #9fc6ec;
}

.server-context-menu {
  position: fixed;
  min-width: 220px;
  background: #1f2023;
  border: 1px solid #3a3b40;
  border-radius: 10px;
  padding: 8px;
  z-index: 120;
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.5);
}

.menu-check,
.menu-item {
  width: 100%;
  border: none;
  background: transparent;
  color: #d9dce1;
  text-align: left;
  padding: 9px 10px;
  font-size: 14px;
  border-radius: 8px;
  cursor: pointer;
}

.menu-check {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.menu-check:hover,
.menu-item:hover {
  background: #2b2d32;
}

.menu-check-box {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 1px solid #8a8f9a;
  background: #202227;
}

.menu-check-box.checked {
  background: #5c7fb4;
  border-color: #5c7fb4;
}

.menu-divider {
  height: 1px;
  margin: 6px 2px;
  background: #3a3b40;
}

.create-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 130;
}

.create-card {
  width: min(520px, 92vw);
  background: #f1f2f5;
  color: #2f3136;
  border-radius: 14px;
  border: 1px solid #d5d8de;
  padding: 18px 20px;
  box-shadow: 0 24px 56px rgba(0, 0, 0, 0.45);
  display: grid;
  gap: 14px;
}

.create-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.create-title {
  font-size: 34px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -0.7px;
}

.create-close {
  border: none;
  background: transparent;
  color: #636771;
  font-size: 18px;
  cursor: pointer;
}

.create-section {
  display: grid;
  gap: 8px;
}

.create-label {
  font-size: 13px;
  font-weight: 700;
  color: #4f5563;
}

.create-input {
  width: 100%;
  background: #fff;
  color: #2f3136;
  border: 2px solid #5a66ff;
  border-radius: 9px;
  padding: 10px 12px;
  font-size: 16px;
}

.create-input:focus {
  outline: none;
}

.channel-type-list {
  display: grid;
  gap: 8px;
}

.channel-type-item {
  width: 100%;
  border: 1px solid #d8dbe2;
  border-radius: 10px;
  background: #fff;
  display: grid;
  grid-template-columns: 20px 1fr;
  column-gap: 10px;
  row-gap: 2px;
  padding: 10px 12px;
  cursor: pointer;
  text-align: left;
}

.channel-type-item.active {
  border-color: #5a66ff;
  box-shadow: 0 0 0 2px rgba(90, 102, 255, 0.2);
}

.channel-type-radio {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #a8adbb;
  margin-top: 3px;
}

.channel-type-item.active .channel-type-radio {
  border-color: #5a66ff;
  background: radial-gradient(circle at center, #5a66ff 45%, transparent 46%);
}

.channel-type-main {
  font-size: 20px;
  font-weight: 800;
  color: #2f3136;
}

.channel-type-sub {
  grid-column: 2;
  font-size: 13px;
  color: #6d7280;
}

.create-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.toggle-title {
  font-size: 14px;
  font-weight: 700;
}

.toggle-sub {
  font-size: 12px;
  color: #6d7280;
}

.toggle-btn {
  width: 48px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid #b7bdc9;
  background: #d7dbe4;
  position: relative;
  cursor: pointer;
}

.toggle-btn::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #616573;
  transition: transform 0.16s ease;
}

.toggle-btn.on {
  background: #5a66ff;
  border-color: #5a66ff;
}

.toggle-btn.on::after {
  transform: translateX(19px);
  background: #fff;
}

.create-error {
  color: #c23a3a;
  font-size: 12px;
}

.create-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.create-cancel,
.create-submit {
  border: none;
  border-radius: 10px;
  padding: 11px 12px;
  font-size: 16px;
  cursor: pointer;
}

.create-cancel {
  background: #e3e5ea;
  color: #33363d;
}

.create-submit {
  background: #9fa8ef;
  color: #fff;
  font-weight: 700;
}

.create-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.channel-section,
.channel-create {
  padding: 0 12px;
}

.channel-section:first-of-type {
  padding-top: 12px;
}

.channel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.channel-head-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.channel-search {
  width: min(340px, 34vw);
  background: #0b1420;
  border: 1px solid rgba(99, 151, 216, 0.36);
  border-radius: 10px;
  padding: 9px 12px;
  color: var(--text);
}

.channel-search:focus {
  outline: none;
  border-color: rgba(122, 194, 255, 0.72);
}

.server-userbar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  min-height: 66px;
  display: grid;
  grid-template-columns: 36px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #121a26;
  border-top: 1px solid rgba(99, 151, 216, 0.36);
}

.userbar-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  overflow: hidden;
  background: #162132;
  display: grid;
  place-items: center;
  color: #c8e4ff;
  font-weight: 700;
  position: relative;
}

.userbar-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.userbar-dot {
  position: absolute;
  right: 1px;
  bottom: 1px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 2px solid #121a26;
  background: #2ecc71;
}

.userbar-dot.offline {
  background: #7b8796;
}

.userbar-meta {
  min-width: 0;
}

.userbar-name {
  font-size: 14px;
  font-weight: 700;
  color: #d5ebff;
}

.userbar-status {
  font-size: 11px;
  color: #9bb8d5;
}

.userbar-actions {
  display: inline-flex;
  gap: 6px;
}

.userbar-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(99, 151, 216, 0.42);
  background: #162234;
  color: #cbe6ff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.userbar-icon.off {
  color: #8ea4bc;
  background: #111b29;
}

.userbar-icon svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

@media (max-width: 980px) {
  .server-shell {
    grid-template-columns: 280px 1fr;
  }

  .channel-search {
    width: min(280px, 40vw);
  }
}

@media (max-width: 720px) {
  .server-shell {
    display: flex;
  }

  .channel-search {
    width: 100%;
  }

  .channel-head-right {
    width: 100%;
  }

  .channel-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .voice-stage {
    grid-template-columns: 1fr;
  }

  .voice-card {
    min-height: 240px;
  }

  .voice-activity-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
