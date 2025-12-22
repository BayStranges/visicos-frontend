<template>
  <div class="layout">
    <!-- LEFT: Servers (Discord-like) -->
    <aside class="servers">
      <div class="logo">
        <img src="/logo.png" alt="Nexora logo" />
      </div>
      <div class="server-pill add">+</div>
    </aside>

    <!-- MIDDLE: DMs list -->
    <section class="dm-list">
      <div class="dm-header">Mesajlar</div>
      <div class="dm-tools">
        <input
          v-model="dmQuery"
          class="dm-search"
          placeholder="Search DMs"
          @click.stop
        />
        <div class="dm-filters">
          <button
            class="filter-btn"
            :class="{ active: dmFilter === 'all' }"
            @click.stop="setFilter('all')"
          >
            All
          </button>
          <button
            class="filter-btn"
            :class="{ active: dmFilter === 'online' }"
            @click.stop="setFilter('online')"
          >
            Online
          </button>
          <button
            class="filter-btn"
            :class="{ active: dmFilter === 'offline' }"
            @click.stop="setFilter('offline')"
          >
            Offline
          </button>
        </div>
      </div>
      <div
        v-for="dm in filteredDms"
        :key="dm._id"
        class="dm-row"
        @click="goDm(dm._id)"
        @contextmenu.prevent="openUserMenu($event, dm)"
        @touchstart="(e) => onRowTouchStart(e, dm)"
        @touchend="onRowTouchEnd"
      >
        <div class="dm-avatar">
          <img v-if="getOtherUser(dm)?.avatar" :src="fullAvatar(getOtherUser(dm)?.avatar)" />
          <span v-else>{{ (getOtherUser(dm)?.username || "?").slice(0,1).toUpperCase() }}</span>
        </div>
        <div class="dm-meta">
          <div class="dm-title">
          <div class="dm-name">{{ getDisplayName(dm) || "Kullan??c??" }}</div>
            <span v-if="isDmMuted(dm)" class="mute-badge">mute</span>
            <span v-if="isPinned(dm)" class="pin-badge">pin</span>
          </div>
          <div class="dm-last">{{ dm.lastMessage?.content || "Hen??z mesaj yok" }}</div>
        </div>
        <div class="dm-actions">
          <button class="dm-action-btn" @click.stop="goDm(dm._id)" title="Message">
            Msg
          </button>
          <button class="dm-action-btn" @click.stop="startCallFor(dm)" title="Call">
            Call
          </button>
          <button class="dm-action-btn" @click.stop="togglePin(dm)" title="Pin">
            Pin
          </button>
        </div>
        <div v-if="dm.unreadCount > 0 && !isDmMuted(dm)" class="badge">{{ dm.unreadCount }}</div>
      </div>
      <div v-if="filteredDms.length === 0" class="empty">DM yok</div>

      <div
        class="dm-profile"
        @click.stop="toggleProfileCard"
      >
        <div class="dm-avatar">
          <img v-if="userStore.user?.avatar" :src="fullAvatar(userStore.user.avatar)" />
          <span v-else>{{ (userStore.user?.username || "U").slice(0,1).toUpperCase() }}</span>
          <span
            class="status-dot"
            :class="isOnline ? 'online' : 'offline'"
            :title="isOnline ? 'Online' : 'Offline'"
          ></span>
        </div>
        <div class="dm-meta">
          <div class="dm-name">{{ userStore.user?.username }}</div>
          <div class="status-row">
            <span class="status-pill" :class="isOnline ? 'online' : 'offline'">
              {{ isOnline ? "Online" : "Offline" }}
            </span>
            <button class="custom-status" @click.stop="setCustomStatus">
              {{ customStatus || "Set status" }}
            </button>
          </div>
        </div>
        <div class="profile-actions">
          <button
            class="icon-btn"
            :class="{ off: micMuted }"
            @click.stop="toggleMic"
            title="Mikrofon"
          >
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
              <path d="M5 12a1 1 0 0 1 2 0 5 5 0 0 0 10 0 1 1 0 1 1 2 0 7 7 0 0 1-6 6.92V21a1 1 0 1 1-2 0v-2.08A7 7 0 0 1 5 12Z" />
            </svg>
          </button>
          <button
            class="icon-btn"
            :class="{ off: headphoneMuted }"
            @click.stop="toggleHeadphones"
            title="Kulaklik"
          >
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3a9 9 0 0 0-9 9v5a3 3 0 0 0 3 3h1v-7H6a1 1 0 0 0-1 1v-2a7 7 0 1 1 14 0v2a1 1 0 0 0-1-1h-1v7h1a3 3 0 0 0 3-3v-5a9 9 0 0 0-9-9Z" />
            </svg>
          </button>
          <button class="icon-btn" @click.stop="goProfile" title="Kullanici Ayarlari">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm8.5 3.5a6.7 6.7 0 0 0-.09-1l2.05-1.6-2-3.46-2.5 1a7.8 7.8 0 0 0-1.73-1l-.38-2.7H9.15l-.38 2.7c-.6.22-1.18.56-1.73 1l-2.5-1-2 3.46 2.05 1.6a6.7 6.7 0 0 0 0 2l-2.05 1.6 2 3.46 2.5-1c.55.44 1.13.78 1.73 1l.38 2.7h5.7l.38-2.7c.6-.22 1.18-.56 1.73-1l2.5 1 2-3.46-2.05-1.6c.06-.33.09-.66.09-1Z" />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="profileCardOpen" class="profile-card" @click.stop>
        <div class="profile-card-header">
          <div
            class="profile-banner"
            :style="{
              backgroundImage: userStore.user?.banner ? `url(${fullAvatar(userStore.user.banner)})` : ''
            }"
          ></div>
          <div class="profile-avatar">
            <img v-if="userStore.user?.avatar" :src="fullAvatar(userStore.user.avatar)" />
            <span v-else>{{ (userStore.user?.username || "U").slice(0,1).toUpperCase() }}</span>
            <span
              class="status-dot"
              :class="isOnline ? 'online' : 'offline'"
              :title="isOnline ? 'Online' : 'Offline'"
            ></span>
          </div>
        </div>
        <div class="profile-card-body">
          <div class="profile-card-name">{{ userStore.user?.username }}</div>
          <div class="profile-card-handle">@{{ userStore.user?.username?.toLowerCase() }}</div>
          <div class="profile-card-note">
            <div class="note-label">Not</div>
            <div class="note-value">{{ profileNote || "Not ekle" }}</div>
          </div>
          <button class="note-edit" @click="editProfileNote">Notu duzenle</button>
          <div class="profile-card-note">
            <div class="note-label">Custom status</div>
            <div class="note-value">
              <span v-if="customStatusEmoji">{{ customStatusEmoji }}</span>
              {{ displayStatus || "Durum ekle" }}
            </div>
          </div>
          <button class="note-edit" @click="setCustomStatus">Status duzenle</button>
          <div class="status-actions">
            <button class="chip-btn" @click="setStatusDuration(30)">30 dk</button>
            <button class="chip-btn" @click="setStatusDuration(60)">1 saat</button>
            <button class="chip-btn" @click="setStatusDuration(240)">4 saat</button>
            <button class="chip-btn" @click="setStatusDuration(1440)">24 saat</button>
            <button class="chip-btn" @click="clearStatus">Temizle</button>
          </div>
          <div class="profile-card-row">
            <span class="pill">Oyun Koleksiyonu</span>
            <button class="ghost-btn" @click="goProfile">Go</button>
          </div>
          <div class="profile-card-section">
            <button class="menu-row" @click="goProfile">Profili Duzenle</button>
            <button class="menu-row" @click="toggleDnd">
              {{ dndEnabled ? "Rahatsiz Etmeyin Kapat" : "Rahatsiz Etmeyin" }}
            </button>
          </div>
          <div class="profile-card-section">
            <button class="menu-row" @click="switchAccount">Hesap Degistir</button>
            <button class="menu-row" @click="copyUserId">Kullanici ID'sini Kopyala</button>
          </div>
        </div>
      </div>

      <div
        v-if="userMenuOpen"
        class="user-menu"
        :style="{ left: `${userMenuPos.x}px`, top: `${userMenuPos.y}px` }"
        @click.stop
      >
        <button class="user-menu-item" @click="togglePin(selectedDm)">
          {{ isPinned(selectedDm) ? "Unpin DM" : "Pin DM" }}
        </button>
        <button class="user-menu-item" @click="markAllRead">Okunmus Olarak Isaretle</button>
        <button class="user-menu-item" @click="menuGoProfile">Profil</button>
        <button class="user-menu-item" @click="menuCall">Ara</button>
        <button class="user-menu-item" @click="menuSetNote">Not Ekle</button>
        <button class="user-menu-item" @click="menuSetNickname">Arkadas Takma Adi Ekle</button>
        <button class="user-menu-item" @click="menuCloseDm">DM'yi Kapat</button>
        <div class="user-menu-divider"></div>
        <button class="user-menu-item" @click="menuInvite">Sunucuya Davet Et</button>
        <button class="user-menu-item" @click="menuRemoveFriend">Arkadasi Cikar</button>
        <button class="user-menu-item" :class="{ active: isIgnored }" @click="toggleIgnore">Yok Say</button>
        <button class="user-menu-item danger" :class="{ active: isBlocked }" @click="toggleBlock">
          {{ isBlocked ? "Engeli Kaldir" : "Engelle" }}
        </button>
        <div class="user-menu-divider"></div>
        <div class="user-menu-label">@{{ selectedUsername }} kanalini sustur</div>
        <button class="user-menu-item" @click="setMuteDuration(15)">15 dk</button>
        <button class="user-menu-item" @click="setMuteDuration(60)">1 saat</button>
        <button class="user-menu-item" @click="setMuteDuration(480)">8 saat</button>
        <button class="user-menu-item" @click="setMuteDuration(1440)">24 saat</button>
        <button class="user-menu-item" @click="setMuteDuration(0)">Sonsuza dek</button>
        <button class="user-menu-item" :class="{ active: isChannelMuted }" @click="clearMute">
          Susturmayi kaldir
        </button>
      </div>

      <transition name="fade">
        <div v-if="nicknameModalOpen" class="nickname-modal" @click="closeNicknameModal">
          <div class="nickname-card" @click.stop>
            <div class="nickname-head">
              <div class="nickname-title">Arkadas Takma Adi Ekle</div>
              <button class="modal-close" @click="closeNicknameModal">X</button>
            </div>
            <div class="nickname-sub">
              Kisisel takma adlarla arkadasini daha hizli bul. DM'lerde sadece sana gorunur.
            </div>
            <div class="nickname-field">
              <label>Arkadas Takma Adi</label>
              <input v-model="nicknameDraft" placeholder="Takma ad" @keydown.enter.prevent="saveNickname" />
              <button class="link-btn ghost" @click="resetNickname">Arkadas Takma Adini Sifirla</button>
            </div>
            <div class="nickname-actions">
              <button class="ghost-btn" @click="closeNicknameModal">Iptal</button>
              <button class="primary-btn" @click="saveNickname">Kaydet</button>
            </div>
          </div>
        </div>
      </transition>

      <transition name="fade">
        <div v-if="profileModalOpen" class="profile-modal" @click="closeProfileModal">
          <div class="profile-modal-card" @click.stop>
          <div class="profile-modal-left">
            <div
              class="profile-modal-banner"
              :style="{
                backgroundImage: profileUser?.banner ? `url(${fullAvatar(profileUser.banner)})` : ''
              }"
            ></div>
            <div class="profile-modal-avatar">
              <img v-if="profileUser?.avatar" :src="fullAvatar(profileUser.avatar)" />
              <span v-else>{{ profileUser?.username?.[0] || "?" }}</span>
            </div>
            <div class="profile-modal-name">{{ profileDisplayName }}</div>
            <div class="profile-modal-handle">@{{ profileUser?.username?.toLowerCase() }}</div>
            <div class="profile-modal-actions">
              <button class="primary-btn" @click="openProfileDm">Message</button>
              <button class="ghost-btn" @click="startProfileCall">Call</button>
            </div>
            <div class="profile-modal-section">
              <div class="section-title">Note (only you)</div>
              <textarea
                class="note-input"
                v-model="userNote"
                placeholder="Add a note"
                @input="saveUserNote"
              ></textarea>
            </div>
          </div>
          <div class="profile-modal-right">
            <div class="profile-tabs">
              <button
                class="tab-btn"
                :class="{ active: profileTab === 'overview' }"
                @click="profileTab = 'overview'"
              >
                Overview
              </button>
              <button
                class="tab-btn"
                :class="{ active: profileTab === 'activity' }"
                @click="profileTab = 'activity'"
              >
                Activity
              </button>
              <button
                class="tab-btn"
                :class="{ active: profileTab === 'mutuals' }"
                @click="profileTab = 'mutuals'"
              >
                Mutuals
              </button>
            </div>
            <div class="profile-tab-content" v-if="profileTab === 'overview'">
              <div class="info-card">
                <div class="info-title">Favorite game</div>
                <div class="info-body">{{ profileFavorite || "Not set" }}</div>
                <button class="info-edit" @click="editProfileFavorite">Edit</button>
              </div>
              <div class="info-card">
                <div class="info-title">Liked games</div>
                <div class="info-body">{{ profileLiked || "Not set" }}</div>
                <button class="info-edit" @click="editProfileLiked">Edit</button>
              </div>
            </div>
            <div class="profile-tab-content" v-else-if="profileTab === 'activity'">
              <div class="info-card">
                <div class="info-title">Recent activity</div>
                <div class="info-body">
                  {{ profileActivity || "No activity" }}
                </div>
              </div>
            </div>
            <div class="profile-tab-content" v-else>
              <div class="info-card">
                <div class="info-title">Mutuals</div>
                <div class="info-body">No mutuals</div>
              </div>
            </div>
          </div>
          <button class="modal-close" @click="closeProfileModal">Close</button>
        </div>
      </div>
      </transition>

    </section>

    <!-- RIGHT: Friends / add / requests -->
    <section class="friends">
      <div class="panel">
        <div class="panel-header"><button class="panel-btn">Notifications</button></div>
        <div v-if="notificationDms.length === 0" class="empty">No new messages</div>
        <div v-for="dm in notificationDms" :key="dm._id" class="notification-row">
          <div class="dm-avatar sm">
            <img v-if="getOtherUser(dm)?.avatar" :src="fullAvatar(getOtherUser(dm)?.avatar)" />
            <span v-else>{{ (getOtherUser(dm)?.username || "?").slice(0,1).toUpperCase() }}</span>
          </div>
          <div class="notification-meta">
          <div class="dm-name">{{ getDisplayName(dm) }}</div>
            <div class="dm-last">{{ dm.unreadCount }} unread</div>
          </div>
          <button class="link-btn" @click="goDm(dm._id)">Open</button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">Arkadaş Ekle</div>
        <div class="friends-filters">
          <button
            class="friends-filter-btn"
            :class="{ active: friendsFilter === 'all' }"
            @click="friendsFilter = 'all'"
          >
            Tüm Arkadaşlar
          </button>
          <button
            class="friends-filter-btn"
            :class="{ active: friendsFilter === 'offline' }"
            @click="friendsFilter = 'offline'"
          >
            Çevrimdışı Arkadaşlar
          </button>
          <button
            class="friends-filter-btn"
            :class="{ active: friendsFilter === 'online' }"
            @click="friendsFilter = 'online'"
          >
            Aktif Arkadaşlar
          </button>
        </div>
        <div class="add-row">
          <input v-model="username" placeholder="Kullanıcı adı" />
          <button @click="sendRequest">Gönder</button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">Bekleyen İstekler</div>
        <div v-if="requests.length === 0" class="empty">İstek yok</div>
        <div v-for="req in requests" :key="req._id" class="request-row">
          <span>{{ req.sender.username }}</span>
          <button @click="accept(req._id)">Kabul Et</button>
        </div>
      </div>
    </section>

    <!-- FAR RIGHT: Activity -->
    <section class="activity">
      <div class="panel">
        <div class="panel-title">Şimdi Aktif</div>
        <div v-if="filteredFriends.length === 0" class="empty">Kimse yok</div>
        <div
          v-for="u in filteredFriends"
          :key="u._id"
          class="activity-row"
        >
          <div class="dm-avatar sm">
            <img v-if="u.avatar" :src="fullAvatar(u.avatar)" />
            <span v-else>{{ (u.username || "?").slice(0,1).toUpperCase() }}</span>
          </div>
          <div class="activity-meta">
            <div class="dm-name">{{ u.username }}</div>
            <div class="dm-last">{{ u.online ? "Aktif" : "Çevrimdışı" }}</div>
          </div>
          <button class="link-btn" @click="goDm(u.roomId)">Git</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import { useUserStore } from "../store/user";
import socket from "../socket";
import { setGlobalMute, setGlobalDeafen } from "../webrtc/voice";

const router = useRouter();
const userStore = useUserStore();

if (!userStore.user) {
  router.push("/login");
}

const userId = userStore.user?._id;

const username = ref("");
const requests = ref([]);
const dms = ref([]);
const onlineUsers = ref([]);
const dmQuery = ref("");
const dmFilter = ref("all");
const friendsFilter = ref("all");
const pinnedIds = ref([]);
const micMuted = ref(false);
const headphoneMuted = ref(false);
const userMenuOpen = ref(false);
const userMenuPos = ref({ x: 0, y: 0 });
const userNote = ref("");
const userNickname = ref("");
const isIgnored = ref(false);
const isBlocked = ref(false);
const isChannelMuted = ref(false);
const selectedDm = ref(null);
const selectedUserId = ref("");
const selectedUsername = ref("kisi");
const muteUntil = ref(0);
const muteClock = ref(Date.now());
let muteInterval;
const customStatus = ref("");
const customStatusEmoji = ref("");
const customStatusUntil = ref(0);
const statusClock = ref(Date.now());
let statusInterval;
const profileCardOpen = ref(false);
const dndEnabled = ref(false);
const profileNote = ref("");
const profileModalOpen = ref(false);
const profileTab = ref("overview");
const profileFavorite = ref("");
const profileLiked = ref("");
const nicknameModalOpen = ref(false);
const nicknameDraft = ref("");
const rowTouchTimer = ref(null);
const rowTouchPos = ref({ x: 0, y: 0 });
const rowTouchDm = ref(null);

const loadAudioPrefs = () => {
  micMuted.value = localStorage.getItem("visicos_mic_muted") === "1";
  headphoneMuted.value = localStorage.getItem("visicos_headphone_muted") === "1";
  setGlobalMute(micMuted.value);
  setGlobalDeafen(headphoneMuted.value);
};

const requestNotifications = () => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
};

const notifyMessage = (msg) => {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (!document.hidden) return;
  const title = msg?.sender?.username ? `New message from ${msg.sender.username}` : "New message";
  const body = msg?.content ? msg.content.slice(0, 140) : "Open DM to read";
  new Notification(title, { body });
};
const loadRequests = async () => {
  const res = await axios.get(`/api/friends/requests/${userId}`);
  requests.value = res.data;
};

const loadDms = async () => {
  const res = await axios.get(`/api/dm/list/${userId}`);
  dms.value = res.data;
};

const loadPinned = () => {
  const raw = localStorage.getItem(`visicos_pins_${userId}`) || "[]";
  try {
    pinnedIds.value = JSON.parse(raw);
  } catch (err) {
    pinnedIds.value = [];
  }
};

const savePinned = () => {
  localStorage.setItem(`visicos_pins_${userId}`, JSON.stringify(pinnedIds.value));
};

const togglePin = (dm) => {
  if (!dm?._id) return;
  const idx = pinnedIds.value.indexOf(dm._id);
  if (idx >= 0) {
    pinnedIds.value.splice(idx, 1);
  } else {
    pinnedIds.value.unshift(dm._id);
  }
  savePinned();
};

const isPinned = (dm) => {
  if (!dm?._id) return false;
  return pinnedIds.value.includes(dm._id);
};

const getOtherUser = (dm) => {
  return dm.users.find(u => u._id !== userId);
};

const isDmOnline = (dm) => {
  const other = dm ? getOtherUser(dm) : null;
  if (!other?._id) return false;
  return onlineUsers.value.includes(other._id);
};

const sendRequest = async () => {
  if (!username.value) return;

  await axios.post("/api/friends/request", {
    senderId: userId,
    username: username.value
  });

  username.value = "";
  loadRequests();
};

const accept = async (requestId) => {
  const res = await axios.post("/api/friends/accept", { requestId });
  await loadDms();
  loadRequests();
  router.push(`/dm/${res.data.dmRoomId}`);
};

const toggleMic = () => {
  micMuted.value = !micMuted.value;
  localStorage.setItem("visicos_mic_muted", micMuted.value ? "1" : "0");
  setGlobalMute(micMuted.value);
};

const toggleHeadphones = () => {
  headphoneMuted.value = !headphoneMuted.value;
  localStorage.setItem("visicos_headphone_muted", headphoneMuted.value ? "1" : "0");
  setGlobalDeafen(headphoneMuted.value);
};

const goDm = (id) => {
  localStorage.setItem("visicos_last_dm", id);
  router.push(`/dm/${id}`);
};

const startCallFor = (dm) => {
  if (!dm?._id) return;
  router.push({ path: `/dm/${dm._id}`, query: { call: "1" } });
};

const goProfile = () => {
  closeProfileCard();
  router.push("/profile");
};
const menuGoProfile = () => {
  closeUserMenu();
  openProfileModal();
};

const setCustomStatus = () => {
  const emoji = window.prompt("Emoji", customStatusEmoji.value || "");
  if (emoji === null) return;
  const next = window.prompt("Status", customStatus.value || "");
  if (next === null) return;
  customStatusEmoji.value = emoji.trim();
  customStatus.value = next.trim();
  saveCustomStatus();
};

const saveCustomStatus = () => {
  localStorage.setItem(`visicos_status_${userId}`, customStatus.value);
  localStorage.setItem(`visicos_status_emoji_${userId}`, customStatusEmoji.value);
  localStorage.setItem(`visicos_status_until_${userId}`, String(customStatusUntil.value));
};

const loadCustomStatus = () => {
  customStatus.value = localStorage.getItem(`visicos_status_${userId}`) || "";
  customStatusEmoji.value = localStorage.getItem(`visicos_status_emoji_${userId}`) || "";
  const stored = localStorage.getItem(`visicos_status_until_${userId}`);
  customStatusUntil.value = stored ? Number(stored) : 0;
};

const setStatusDuration = (minutes) => {
  if (!customStatus.value && !customStatusEmoji.value) return;
  customStatusUntil.value = Date.now() + minutes * 60 * 1000;
  saveCustomStatus();
};

const clearStatus = () => {
  customStatus.value = "";
  customStatusEmoji.value = "";
  customStatusUntil.value = 0;
  localStorage.removeItem(`visicos_status_${userId}`);
  localStorage.removeItem(`visicos_status_emoji_${userId}`);
  localStorage.removeItem(`visicos_status_until_${userId}`);
};

const editProfileNote = () => {
  const next = window.prompt("Not", profileNote.value || "");
  if (next === null) return;
  profileNote.value = next.trim();
  if (profileNote.value) {
    localStorage.setItem(`visicos_note_${userId}`, profileNote.value);
  } else {
    localStorage.removeItem(`visicos_note_${userId}`);
  }
};

const loadProfileNote = () => {
  profileNote.value = localStorage.getItem(`visicos_note_${userId}`) || "";
};

const setFilter = (value) => {
  dmFilter.value = value;
};

const profileKey = (suffix, targetId) => {
  if (!userId || !targetId) return `visicos_profile_${suffix}_unknown`;
  return `visicos_profile_${suffix}_${userId}_${targetId}`;
};

const loadProfileExtras = (targetId) => {
  profileFavorite.value = localStorage.getItem(profileKey("favorite", targetId)) || "";
  profileLiked.value = localStorage.getItem(profileKey("liked", targetId)) || "";
};

const editProfileFavorite = () => {
  if (!selectedUserId.value) return;
  const next = window.prompt("Favorite game", profileFavorite.value || "");
  if (next === null) return;
  profileFavorite.value = next.trim();
  if (profileFavorite.value) {
    localStorage.setItem(profileKey("favorite", selectedUserId.value), profileFavorite.value);
  } else {
    localStorage.removeItem(profileKey("favorite", selectedUserId.value));
  }
};

const editProfileLiked = () => {
  if (!selectedUserId.value) return;
  const next = window.prompt("Liked games (comma separated)", profileLiked.value || "");
  if (next === null) return;
  profileLiked.value = next.trim();
  if (profileLiked.value) {
    localStorage.setItem(profileKey("liked", selectedUserId.value), profileLiked.value);
  } else {
    localStorage.removeItem(profileKey("liked", selectedUserId.value));
  }
};

const openProfileModal = () => {
  if (!selectedDm.value) return;
  loadProfileExtras(selectedUserId.value);
  profileModalOpen.value = true;
  profileTab.value = "overview";
};

const closeProfileModal = () => {
  profileModalOpen.value = false;
};

const closeNicknameModal = () => {
  nicknameModalOpen.value = false;
};

const saveNickname = () => {
  if (!selectedUserId.value) return;
  const next = nicknameDraft.value.trim();
  if (next) {
    localStorage.setItem(prefKey("nickname", selectedUserId.value), next);
  } else {
    localStorage.removeItem(prefKey("nickname", selectedUserId.value));
  }
  nicknameModalOpen.value = false;
};

const resetNickname = () => {
  if (!selectedUserId.value) return;
  nicknameDraft.value = "";
  localStorage.removeItem(prefKey("nickname", selectedUserId.value));
};

const openProfileDm = () => {
  if (selectedDm.value?._id) goDm(selectedDm.value._id);
  closeProfileModal();
};

const startProfileCall = () => {
  if (selectedDm.value?._id) startCallFor(selectedDm.value);
  closeProfileModal();
};

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
  router.push("/login");
};

const copyUserId = async () => {
  const id = userStore.user?._id || "";
  if (!id) return;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(id);
  }
};

const loadProfilePrefs = () => {
  dndEnabled.value = localStorage.getItem("visicos_dnd") === "1";
};

const prefKey = (suffix, targetId) => {
  if (!userId || !targetId) return `visicos_user_${suffix}_unknown`;
  return `visicos_user_${suffix}_${userId}_${targetId}`;
};

const loadUserPrefs = (targetId) => {
  userNote.value = localStorage.getItem(prefKey("note", targetId)) || "";
  userNickname.value = localStorage.getItem(prefKey("nickname", targetId)) || "";
  isIgnored.value = localStorage.getItem(prefKey("ignored", targetId)) === "1";
  isBlocked.value = localStorage.getItem(prefKey("blocked", targetId)) === "1";
  const stored = localStorage.getItem(prefKey("mute_until", targetId));
  muteUntil.value = stored ? Number(stored) : 0;
  isChannelMuted.value = muteUntil.value === -1 || Date.now() < muteUntil.value;
};

const saveUserNote = () => {
  const targetId = selectedUserId.value;
  if (!targetId) return;
  if (userNote.value) localStorage.setItem(prefKey("note", targetId), userNote.value);
  else localStorage.removeItem(prefKey("note", targetId));
};

const onRowTouchStart = (event, dm) => {
  rowTouchDm.value = dm;
  rowTouchPos.value = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  if (rowTouchTimer.value) clearTimeout(rowTouchTimer.value);
  rowTouchTimer.value = setTimeout(() => {
    if (!rowTouchDm.value) return;
    openUserMenu({ clientX: rowTouchPos.value.x, clientY: rowTouchPos.value.y }, rowTouchDm.value);
    rowTouchTimer.value = null;
  }, 550);
};

const onRowTouchEnd = () => {
  if (rowTouchTimer.value) {
    clearTimeout(rowTouchTimer.value);
    rowTouchTimer.value = null;
  }
  rowTouchDm.value = null;
};

const getNickname = (targetId) => {
  if (!targetId) return "";
  return localStorage.getItem(prefKey("nickname", targetId)) || "";
};

const getDisplayName = (dm) => {
  const other = dm ? getOtherUser(dm) : null;
  if (!other?._id) return "";
  return getNickname(other._id) || other.username || "";
};

const getMenuDm = () => {
  return selectedDm.value || null;
};

const getMuteUntil = (targetId) => {
  const stored = localStorage.getItem(prefKey("mute_until", targetId));
  return stored ? Number(stored) : 0;
};

const isDmMuted = (dm) => {
  muteClock.value;
  const other = dm ? getOtherUser(dm) : null;
  if (!other?._id) return false;
  const until = getMuteUntil(other._id);
  if (until === -1) return true;
  return Date.now() < until;
};

const markAllRead = () => {
  const dm = getMenuDm();
  if (!dm) return;
  dms.value = dms.value.map((item) =>
    item._id === dm._id ? { ...item, unreadCount: 0 } : item
  );
  closeUserMenu();
};

const menuCall = () => {
  const dm = getMenuDm();
  if (!dm) {
    window.alert("Aranacak kisi bulunamadi.");
    return;
  }
  closeUserMenu();
  router.push({ path: `/dm/${dm._id}`, query: { call: "1" } });
};

const menuSetNote = () => {
  const dm = getMenuDm();
  const other = dm ? getOtherUser(dm) : null;
  if (!other?._id) {
    window.alert("Kisi bulunamadi.");
    return;
  }
  const next = window.prompt("Not Ekle", userNote.value || "");
  if (next === null) return;
  userNote.value = next.trim();
  saveUserNote();
  closeUserMenu();
};

const menuSetNickname = () => {
  const dm = getMenuDm();
  const other = dm ? getOtherUser(dm) : null;
  if (!other?._id) {
    window.alert("Kisi bulunamadi.");
    return;
  }
  nicknameDraft.value = getNickname(other._id) || other.username || "";
  nicknameModalOpen.value = true;
  closeUserMenu();
};

const menuCloseDm = async () => {
  const dm = getMenuDm();
  if (!dm) {
    window.alert("Kapatilacak DM bulunamadi.");
    return;
  }
  try {
    await axios.post("/api/dm/close", { roomId: dm._id, userId });
    dms.value = dms.value.filter((item) => item._id !== dm._id);
  } catch (err) {
    window.alert("DM kapatilamadi.");
  } finally {
    closeUserMenu();
  }
};

const menuInvite = async () => {
  const dm = getMenuDm();
  if (!dm) {
    window.alert("Davet edilecek DM bulunamadi.");
    return;
  }
  try {
    const res = await axios.post("/api/dm/invite", { roomId: dm._id, userId });
    const link = res.data?.link || "";
    if (link && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link);
      window.alert("Davet linki kopyalandi.");
    } else {
      window.alert(link || "Davet linki olusturulamadi.");
    }
  } catch (err) {
    window.alert("Davet olusturulamadi.");
  } finally {
    closeUserMenu();
  }
};

const menuRemoveFriend = async () => {
  const dm = getMenuDm();
  if (!dm) {
    window.alert("Arkadas bulunamadi.");
    return;
  }
  const other = getOtherUser(dm);
  if (!other?._id) {
    window.alert("Arkadas bulunamadi.");
    return;
  }
  try {
    await axios.post("/api/friends/remove", {
      userId,
      targetId: other._id,
      roomId: dm._id
    });
    dms.value = dms.value.filter((item) => item._id !== dm._id);
  } catch (err) {
    window.alert("Arkadas kaldirilamadi.");
  } finally {
    closeUserMenu();
  }
};

const toggleIgnore = () => {
  const dm = getMenuDm();
  const other = dm ? getOtherUser(dm) : null;
  if (!other?._id) return;
  isIgnored.value = !isIgnored.value;
  localStorage.setItem(prefKey("ignored", other._id), isIgnored.value ? "1" : "0");
  closeUserMenu();
};

const toggleBlock = () => {
  const dm = getMenuDm();
  const other = dm ? getOtherUser(dm) : null;
  if (!other?._id) return;
  isBlocked.value = !isBlocked.value;
  localStorage.setItem(prefKey("blocked", other._id), isBlocked.value ? "1" : "0");
  closeUserMenu();
};

const setMuteDuration = (minutes) => {
  if (!selectedUserId.value) return;
  if (minutes === 0) {
    muteUntil.value = -1;
  } else {
    muteUntil.value = Date.now() + minutes * 60 * 1000;
  }
  localStorage.setItem(prefKey("mute_until", selectedUserId.value), String(muteUntil.value));
  isChannelMuted.value = muteUntil.value === -1 || Date.now() < muteUntil.value;
  closeUserMenu();
};

const clearMute = () => {
  if (!selectedUserId.value) return;
  muteUntil.value = 0;
  localStorage.removeItem(prefKey("mute_until", selectedUserId.value));
  isChannelMuted.value = false;
  closeUserMenu();
};

const onMenuKeydown = (event) => {
  if (event.key === "Escape") {
    closeUserMenu();
    closeProfileCard();
    closeProfileModal();
    closeNicknameModal();
  }
};

const openUserMenu = (event, dm) => {
  const other = dm ? getOtherUser(dm) : null;
  if (!other?._id) return;
  selectedDm.value = dm;
  selectedUserId.value = other._id;
  selectedUsername.value = other.username || "kisi";
  loadUserPrefs(other._id);
  const menuWidth = 220;
  const menuHeight = 460;
  const padding = 12;
  const maxX = window.innerWidth - menuWidth - padding;
  const maxY = window.innerHeight - menuHeight - padding;
  userMenuPos.value = {
    x: Math.max(padding, Math.min(event.clientX, maxX)),
    y: Math.max(padding, Math.min(event.clientY, maxY))
  };
  userMenuOpen.value = true;
};

const closeUserMenu = () => {
  userMenuOpen.value = false;
};

const fullAvatar = (url) => {
  if (!url) return "";
  return url.startsWith("http") ? url : `https://visicos-backend.onrender.com${url}`;
};

const activeUsers = computed(() => {
  const list = [];
  onlineUsers.value.forEach((id) => {
    const room = dms.value.find(dm => dm.users.some(u => u._id === id));
    const user = room?.users.find(u => u._id === id);
    if (room && user && id !== userId) {
      list.push({ ...user, roomId: room._id });
    }
  });
  return list;
});

const friendsList = computed(() =>
  dms.value
    .map((dm) => {
      const user = getOtherUser(dm);
      if (!user?._id) return null;
      return {
        ...user,
        roomId: dm._id,
        online: onlineUsers.value.includes(user._id)
      };
    })
    .filter(Boolean)
);

const filteredFriends = computed(() => {
  if (friendsFilter.value === "online") {
    return friendsList.value.filter((u) => u.online);
  }
  if (friendsFilter.value === "offline") {
    return friendsList.value.filter((u) => !u.online);
  }
  return friendsList.value;
});

const filteredDms = computed(() => {
  const query = dmQuery.value.trim().toLowerCase();
  const filtered = dms.value.filter((dm) => {
    const name = getOtherUser(dm)?.username || "";
    const matchesQuery = !query || name.toLowerCase().includes(query);
    const matchesFilter =
      dmFilter.value === "all" ||
      (dmFilter.value === "online" && isDmOnline(dm)) ||
      (dmFilter.value === "offline" && !isDmOnline(dm));
    return matchesQuery && matchesFilter;
  });
  const pinned = filtered
    .filter((dm) => isPinned(dm))
    .sort((a, b) => pinnedIds.value.indexOf(a._id) - pinnedIds.value.indexOf(b._id));
  const unpinned = filtered.filter((dm) => !isPinned(dm));
  return [...pinned, ...unpinned];
});

const notificationDms = computed(() => {
  return dms.value.filter((dm) => dm.unreadCount > 0 && !isDmMuted(dm));
});

const profileUser = computed(() => {
  if (!selectedDm.value) return null;
  return getOtherUser(selectedDm.value);
});

const profileDisplayName = computed(() => {
  if (!profileUser.value?._id) return "";
  return getNickname(profileUser.value._id) || profileUser.value.username || "";
});

const profileActivity = computed(() => {
  const msg = selectedDm.value?.lastMessage;
  if (!msg?.content) return "";
  return `Last message: ${msg.content}`;
});

const displayStatus = computed(() => {
  statusClock.value;
  if (!customStatus.value && !customStatusEmoji.value) return "";
  if (!customStatusUntil.value) return customStatus.value;
  if (Date.now() > customStatusUntil.value) {
    clearStatus();
    return "";
  }
  return customStatus.value;
});

const isOnline = computed(() => {
  if (!userId) return false;
  return onlineUsers.value.includes(userId);
});

onMounted(() => {
  if (!userStore.user) {
    router.push("/login");
    return;
  }

  loadAudioPrefs();
  requestNotifications();
  loadProfilePrefs();
  loadPinned();
  loadCustomStatus();
  loadProfileNote();

  loadRequests();
  loadDms();

  socket.on("new-message", (payload) => {
    loadDms(); // yeni mesaj -> liste guncelle
    if (payload?.message) notifyMessage(payload.message);
  });

  socket.on("messages-read", () => {
    loadDms(); // DM acildi -> unread sifirla
  });

  socket.on("online-users", (users) => {
    onlineUsers.value = users;
  });

  window.addEventListener("click", closeUserMenu);
  window.addEventListener("click", closeProfileCard);
  window.addEventListener("click", closeProfileModal);
  window.addEventListener("keydown", onMenuKeydown);
  muteInterval = setInterval(() => {
    muteClock.value = Date.now();
  }, 30000);
  statusInterval = setInterval(() => {
    statusClock.value = Date.now();
  }, 30000);
});

onBeforeUnmount(() => {
  socket.off("new-message");
  socket.off("messages-read");
  socket.off("online-users");
  window.removeEventListener("click", closeUserMenu);
  window.removeEventListener("click", closeProfileCard);
  window.removeEventListener("click", closeProfileModal);
  window.removeEventListener("keydown", onMenuKeydown);
  if (muteInterval) clearInterval(muteInterval);
  if (statusInterval) clearInterval(statusInterval);
});
</script>

<style scoped> .layout {   display: grid;   grid-template-columns: 80px 260px 1fr 260px;   height: 100vh;   background: var(--bg);   color: var(--text);   font-family: "Inter", "Segoe UI", system-ui, sans-serif;   --user-panel-height: 72px; }  .servers {   background: var(--bg-elev);   border-right: 1px solid var(--border);   display: flex;   flex-direction: column;   align-items: center;   padding: 12px 0;   gap: 12px; }  .logo {   width: 48px;   height: 48px;   border-radius: 14px;   background: linear-gradient(145deg, var(--accent-strong), var(--accent));   display: grid;   place-items: center;   font-weight: 800;   font-size: 20px;   color: #fff;   box-shadow: 0 8px 18px rgba(0,0,0,0.35); } .logo img {   width: 100%;   height: 100%;   object-fit: contain; }  .server-pill {   width: 48px;   height: 48px;   border-radius: 50%;   background: var(--accent-dark);   display: grid;   place-items: center;   color: var(--accent);   font-weight: 700;   cursor: pointer;   transition: all 0.15s ease; }  .server-pill:hover {   background: var(--border-strong);   transform: translateY(-2px); }  .server-pill.add {   background: #1f1f1f;   color: var(--accent);   border: 1px dashed var(--border-soft); }  .dm-list {   background: var(--bg-elev);   border-right: 1px solid var(--border);   display: flex;   flex-direction: column;   overflow-x: hidden;   overflow-y: auto;   position: relative;   padding-bottom: calc(var(--user-panel-height) + 10px); }  .dm-header {   padding: 16px;   font-weight: 700;   letter-spacing: 0.3px;   border-bottom: 1px solid var(--border); }  .dm-tools {   padding: 12px 14px;   display: grid;   gap: 10px;   border-bottom: 1px solid var(--border);   background: #151515; }  .dm-search {   width: 100%;   background: var(--input-bg);   border: 1px solid var(--border-strong);   border-radius: 10px;   padding: 8px 10px;   color: var(--text); }  .dm-filters {   display: flex;   gap: 8px; }  .filter-btn {   background: #1f1f1f;   border: 1px solid var(--border-strong);   color: var(--text-muted);   border-radius: 999px;   padding: 4px 10px;   font-size: 12px;   cursor: pointer; }  .filter-btn.active {   color: var(--text-strong);   border-color: var(--accent-strong);   background: #241214; }  .dm-row {   display: grid;   grid-template-columns: 44px 1fr auto auto;   gap: 10px;   align-items: center;   padding: 12px 14px;   cursor: pointer;   border-bottom: 1px solid var(--accent-dark);   transition: background 0.12s ease; }  .dm-row:hover {   background: #191313; }  .dm-avatar {   width: 44px;   height: 44px;   border-radius: 50%;   background: var(--chip);   display: grid;   place-items: center;   font-weight: 700;   color: var(--accent);   overflow: hidden;   position: relative; }  .dm-avatar img {   width: 100%;   height: 100%;   object-fit: cover; } .dm-avatar.sm {   width: 40px;   height: 40px; }  .dm-meta {   display: flex;   flex-direction: column;   gap: 4px; }  .dm-name {   font-weight: 600; }  .dm-last {   font-size: 12px;   color: var(--text-muted);   overflow: hidden;   text-overflow: ellipsis;   white-space: nowrap; }  .badge {   background: var(--accent-strong);   color: var(--text-strong);   border-radius: 12px;   padding: 2px 8px;   font-size: 12px;   min-width: 20px;   text-align: center; }  .friends {   padding: 20px;   display: flex;   flex-direction: column;   gap: 16px;   overflow-y: auto;   position: relative; }  .panel {   background: var(--panel);   border: 1px solid var(--border);   border-radius: 12px;   padding: 16px;   box-shadow: 0 12px 30px rgba(0,0,0,0.25); }  .panel-title {   font-weight: 700;   margin-bottom: 12px; }  .link-text {   color: var(--accent);   font-weight: 600;   font-size: 12px; }  .link-btn {   background: linear-gradient(145deg, var(--accent-strong), var(--accent));   color: var(--accent-dark);   border: none;   border-radius: 10px;   padding: 8px 12px;   cursor: pointer;   font-weight: 700; }  .add-row {   display: flex;   gap: 10px; }  .add-row input {   flex: 1;   background: var(--input-bg);   border: 1px solid var(--border-strong);   border-radius: 10px;   padding: 10px 12px;   color: var(--text); }  .add-row button {   background: linear-gradient(145deg, var(--accent-strong), var(--accent));   color: var(--accent-dark);   border: none;   border-radius: 10px;   padding: 0 16px;   cursor: pointer;   font-weight: 600; }  .request-row {   display: flex;   justify-content: space-between;   align-items: center;   padding: 10px 0;   border-bottom: 1px solid #161b25; }  .request-row:last-child {   border-bottom: none; }  .request-row button {   background: var(--accent-strong);   color: #fdf5d9;   border: none;   border-radius: 8px;   padding: 6px 12px;   cursor: pointer; }  .empty {   color: var(--text-muted);   font-size: 13px;   padding: 10px 0; }  .notification-row {   display: grid;   grid-template-columns: 40px 1fr auto;   gap: 10px;   align-items: center;   padding: 8px 0;   border-bottom: 1px solid #161b25; }  .notification-row:last-child {   border-bottom: none; }  .notification-meta {   display: flex;   flex-direction: column;   gap: 2px; }  .dm-profile {   position: sticky;   bottom: 0;   min-height: 64px;   background: #1f1f22;   border-top: 1px solid #2a2a2e;   padding: 10px 12px;   display: grid;   grid-template-columns: 36px 1fr auto;   gap: 10px;   align-items: center;   cursor: pointer;   z-index: 5;   box-shadow: 0 -8px 18px rgba(0, 0, 0, 0.35); }  .dm-profile .dm-avatar {   width: 36px;   height: 36px;   border-radius: 12px; }  .dm-title {   display: flex;   align-items: center;   gap: 6px; }  .mute-badge {   font-size: 10px;   text-transform: uppercase;   letter-spacing: 0.4px;   color: #9aa0a6;   background: #2a2a2e;   padding: 2px 6px;   border-radius: 999px; }  .pin-badge {   font-size: 10px;   text-transform: uppercase;   letter-spacing: 0.4px;   color: #c7bfa4;   background: #2a1e1e;   padding: 2px 6px;   border-radius: 999px; }  .dm-actions {   display: inline-flex;   gap: 6px;   opacity: 0;   transition: opacity 0.15s ease; }  .dm-row:hover .dm-actions {   opacity: 1; }  .dm-action-btn {   height: 24px;   padding: 0 6px;   border-radius: 6px;   border: none;   background: #1f1f22;   color: var(--text-muted);   cursor: pointer;   font-size: 11px; }  .dm-action-btn:hover {   background: #2a2a2e;   color: var(--text-strong); }  .status-dot {   position: absolute;   right: 2px;   bottom: 2px;   width: 8px;   height: 8px;   border-radius: 50%;   border: 2px solid #1f1f22; }  .status-row {   margin-top: 4px;   display: flex;   flex-direction: column;   gap: 2px; }  .custom-status {   background: transparent;   border: none;   color: var(--text-muted);   font-size: 10px;   padding: 0;   text-align: left;   cursor: pointer; }  .custom-status:hover {   color: var(--text-strong); } .status-pill {   display: inline-block;   font-size: 10px;   color: var(--text-muted); }  .status-dot.online {   background: #2ecc71; }  .status-dot.offline {   background: #7b7b7b; }  .status-pill.online {   color: #9be7a1; }  .status-pill.offline {   color: var(--text-muted); }  .profile-actions {   display: inline-flex;   gap: 6px;   align-items: center; }  .icon-btn {   width: 28px;   height: 28px;   border-radius: 6px;   border: none;   background: transparent;   color: var(--text-muted);   display: inline-flex;   align-items: center;   justify-content: center;   cursor: pointer;   transition: background 0.15s ease, color 0.15s ease; }  .icon-btn:hover {   background: #2a2a2e;   color: var(--text-strong); }  .icon-btn.off {   color: #7d7d7d;   background: #2a2a2e; }  .icon {   width: 16px;   height: 16px;   fill: currentColor; }  .user-menu {   position: fixed;   min-width: 220px;   background: #1d1d1f;   border: 1px solid #2a2a2e;   border-radius: 10px;   padding: 6px;   display: flex;   flex-direction: column;   gap: 2px;   z-index: 50;   box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45); }  .profile-modal {   position: fixed;   inset: 0;   background: rgba(0, 0, 0, 0.55);   display: flex;   align-items: center;   justify-content: center;   z-index: 70; }  .profile-modal-card {   position: relative;   width: min(860px, 92vw);   min-height: 420px;   background: #1f2024;   border: 1px solid #2d2e33;   border-radius: 18px;   display: grid;   grid-template-columns: 280px 1fr;   overflow: hidden;   box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5); }  .profile-modal-left {   background: #23242a;   padding: 16px;   display: flex;   flex-direction: column;   gap: 10px; }  .profile-modal-banner {   height: 120px;   border-radius: 12px;   background: linear-gradient(120deg, #6c6aa8, #8a7bc0);   background-size: cover;   background-position: center; }  .profile-modal-avatar {   width: 88px;   height: 88px;   border-radius: 50%;   border: 4px solid #23242a;   background: #1f1f22;   display: grid;   place-items: center;   color: var(--text-strong);   margin-top: -46px;   overflow: hidden; }  .profile-modal-avatar img {   width: 100%;   height: 100%;   object-fit: cover; }  .profile-modal-name {   font-size: 18px;   font-weight: 700; }  .profile-modal-handle {   font-size: 12px;   color: var(--text-muted); }  .profile-modal-actions {   display: flex;   gap: 8px; }  .profile-modal-section {   border-top: 1px solid #2d2e33;   padding-top: 10px;   display: grid;   gap: 6px; }  .section-title {   font-size: 11px;   color: var(--text-muted);   text-transform: uppercase;   letter-spacing: 0.4px; }  .section-body {   font-size: 12px;   color: var(--text); }  .note-input {   min-height: 72px;   resize: none;   background: #1f1f22;   border: 1px solid #33343a;   border-radius: 10px;   padding: 8px;   color: var(--text);   font-size: 12px; }  .note-input:focus {   outline: none;   border-color: var(--accent); }  .profile-modal-right {   padding: 18px;   display: flex;   flex-direction: column;   gap: 14px; }  .profile-tabs {   display: flex;   gap: 10px;   border-bottom: 1px solid #2d2e33;   padding-bottom: 8px; }  .tab-btn {   background: transparent;   border: none;   color: var(--text-muted);   padding: 6px 2px;   cursor: pointer;   font-size: 13px; }  .tab-btn.active {   color: var(--text-strong);   border-bottom: 2px solid var(--accent); }  .profile-tab-content {   display: grid;   gap: 12px; }  .info-edit {   margin-top: 10px;   background: transparent;   border: 1px solid #3a3b41;   color: var(--text-muted);   border-radius: 8px;   padding: 6px 10px;   font-size: 12px;   cursor: pointer; }  .info-edit:hover {   color: var(--text-strong);   border-color: #4a4b52; }  .fade-enter-active, .fade-leave-active {   transition: opacity 0.2s ease; }  .fade-enter-from, .fade-leave-to {   opacity: 0; }  .nickname-modal {   position: fixed;   inset: 0;   background: rgba(0, 0, 0, 0.55);   display: flex;   align-items: center;   justify-content: center;   z-index: 80; }  .nickname-card {   width: min(420px, 92vw);   background: #2a2b30;   border: 1px solid #35363b;   border-radius: 16px;   padding: 16px;   display: grid;   gap: 12px;   box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5); }  .nickname-head {   display: flex;   align-items: center;   justify-content: space-between; }  .nickname-title {   font-size: 16px;   font-weight: 700; }  .nickname-sub {   font-size: 12px;   color: var(--text-muted); }  .nickname-field {   display: grid;   gap: 8px; }  .nickname-field label {   font-size: 12px;   color: var(--text-muted); }  .nickname-field input {   background: #1f1f22;   border: 1px solid #33343a;   border-radius: 10px;   padding: 10px 12px;   color: var(--text); }  .nickname-actions {   display: flex;   gap: 10px;   justify-content: flex-end; }  .link-btn.ghost {   background: transparent;   border: none;   color: #7aa7ff;   padding: 0; }  .info-card {   background: #2a2b30;   border: 1px solid #33343a;   border-radius: 12px;   padding: 14px; }  .info-title {   font-size: 12px;   color: var(--text-muted);   margin-bottom: 8px; }  .info-body {   font-size: 13px;   color: var(--text); }  .primary-btn {   background: linear-gradient(145deg, var(--accent-strong), var(--accent));   color: var(--accent-dark);   border: none;   border-radius: 10px;   padding: 8px 12px;   cursor: pointer;   font-weight: 700; }  .modal-close {   position: absolute;   top: 12px;   right: 12px;   background: transparent;   border: 1px solid #33343a;   color: var(--text-muted);   border-radius: 8px;   padding: 6px 10px;   cursor: pointer; }  .modal-close:hover {   color: var(--text-strong);   border-color: #4a4b52; }  @media (max-width: 720px) {   .profile-modal-card {     grid-template-columns: 1fr;   }   .profile-modal-right {     padding-top: 0;   } }  .profile-card {   position: fixed;   left: 92px;   bottom: 96px;   width: 280px;   background: #2a2b30;   border: 1px solid #3a3b41;   border-radius: 14px;   overflow: hidden;   z-index: 60;   box-shadow: 0 18px 40px rgba(0, 0, 0, 0.5); }  .profile-card-header {   position: relative;   height: 88px;   background: #3b3d44; }  .profile-banner {   height: 100%;   background: linear-gradient(120deg, #6c6aa8, #8a7bc0);   background-size: cover;   background-position: center; }  .profile-avatar {   position: absolute;   left: 14px;   bottom: -20px;   width: 56px;   height: 56px;   border-radius: 50%;   border: 4px solid #2a2b30;   background: #1f1f22;   display: grid;   place-items: center;   color: var(--text-strong);   overflow: hidden; }  .profile-avatar img {   width: 100%;   height: 100%;   object-fit: cover; }  .profile-card-body {   padding: 28px 14px 14px;   display: flex;   flex-direction: column;   gap: 8px; }  .profile-card-name {   font-size: 16px;   font-weight: 700; }  .profile-card-handle {   font-size: 12px;   color: var(--text-muted); }  .profile-card-note {   display: grid;   gap: 2px;   background: #1f1f22;   border: 1px solid #35363b;   border-radius: 10px;   padding: 6px 8px; }  .note-label {   font-size: 10px;   text-transform: uppercase;   letter-spacing: 0.4px;   color: #9aa0a6; }  .note-value {   font-size: 12px;   color: var(--text); }  .note-edit {   background: transparent;   border: 1px solid #3a3b41;   color: var(--text-muted);   border-radius: 8px;   padding: 6px 10px;   font-size: 12px;   cursor: pointer; }  .note-edit:hover {   color: var(--text-strong);   border-color: #4a4b52; }  .status-actions {   display: flex;   flex-wrap: wrap;   gap: 6px; }  .chip-btn {   background: #1f1f22;   border: 1px solid #3a3b41;   color: var(--text-muted);   border-radius: 999px;   padding: 4px 8px;   font-size: 11px;   cursor: pointer; }  .chip-btn:hover {   color: var(--text-strong);   border-color: #4a4b52; }  .profile-card-row {   display: flex;   align-items: center;   justify-content: space-between;   gap: 8px; }  .pill {   background: #1f1f22;   border: 1px solid #3a3b41;   color: var(--text);   border-radius: 10px;   padding: 6px 10px;   font-size: 12px; }  .ghost-btn {   background: transparent;   border: 1px solid #3a3b41;   color: var(--text-muted);   border-radius: 8px;   padding: 6px 10px;   font-size: 12px;   cursor: pointer; }  .ghost-btn:hover {   color: var(--text-strong);   border-color: #4a4b52; }  .profile-card-section {   border-top: 1px solid #35363b;   padding-top: 6px;   display: flex;   flex-direction: column;   gap: 6px; }  .menu-row {   background: transparent;   border: none;   color: var(--text);   text-align: left;   padding: 6px 4px;   border-radius: 8px;   cursor: pointer;   font-size: 12px; }  .menu-row:hover {   background: #35363b; } .user-menu-item {   width: 100%;   text-align: left;   background: transparent;   border: none;   color: var(--text);   padding: 8px 10px;   border-radius: 8px;   cursor: pointer;   font-size: 13px; }  .user-menu-item:hover {   background: #2a2a2f; }  .user-menu-item.active::after {   content: "ԣ�";   float: right;   color: var(--text-muted); }  .user-menu-item.danger {   color: #ff6b6b; }  .user-menu-label {   padding: 6px 10px;   font-size: 12px;   color: var(--text-muted); }  .user-menu-divider {   height: 1px;   background: #2a2a2e;   margin: 4px 6px; }    .activity {   padding: 20px;   border-left: 1px solid var(--border);   overflow-y: auto;   background: var(--bg-elev); }  .activity-row {   display: grid;   grid-template-columns: 44px 1fr auto;   align-items: center;   gap: 10px;   padding: 10px 0;   border-bottom: 1px solid var(--accent-dark); }  .activity-row:last-child {   border-bottom: none; }  .activity-meta {   display: flex;   flex-direction: column;   gap: 2px; }  .activity .link-btn {   padding: 6px 10px; }  @media (max-width: 900px) {   .layout {     grid-template-columns: 70px 1.1fr 1.3fr;   } } @media (max-width: 700px) {   .layout {     grid-template-columns: 64px 1fr;   }   .logo,   .server-pill {     width: 40px;     height: 40px;     border-radius: 12px;   }   .dm-list {     max-height: none;   }   .dm-row {     grid-template-columns: 44px 1fr auto;   }   .dm-actions {     display: none;   }   .friends {     display: none;   }   .activity {     display: none;   } }  .panel-header {   display: flex;   justify-content: flex-end;   margin-bottom: 10px; }  .panel-btn {   background: #1f1f1f;   border: 1px solid var(--border-strong);   color: var(--text-muted);   border-radius: 999px;   padding: 4px 12px;   font-size: 12px;   cursor: pointer; }  .friends-filters {   display: flex;   flex-wrap: wrap;   gap: 8px;   margin-bottom: 10px; }  .friends-filter-btn {   background: #1f1f1f;   border: 1px solid var(--border-strong);   color: var(--text-muted);   border-radius: 999px;   padding: 4px 10px;   font-size: 12px;   cursor: pointer; }  .friends-filter-btn.active {   color: var(--text-strong);   border-color: var(--accent-strong);   background: #241214; } </style>








