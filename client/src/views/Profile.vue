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

      <div v-if="activeTab === 'Hesabim'" class="panel-card account-card">
        <div class="account-top">
          <div class="banner-wrap" @click="pickBanner">
            <img v-if="bannerPreview" :src="bannerPreview" />
            <div v-else class="banner-fallback">Banner</div>
            <div class="banner-overlay">Change banner</div>
          </div>
          <div class="account-header">
            <div class="account-left">
              <div class="avatar-wrap" @click="pickAvatar">
                <img v-if="preview" :src="preview" />
                <div v-else class="avatar-fallback">{{ initials }}</div>
                <div class="avatar-overlay">Change avatar</div>
              </div>
              <div class="account-identity">
                <div class="account-name">{{ displayName || user?.username || "User" }}</div>
                <div class="account-status">Online</div>
              </div>
            </div>
            <button class="primary-btn" @click="save" :disabled="loading">
              Kullanici Profilini Duzenle
            </button>
            <input ref="fileInput" type="file" hidden accept="image/*" @change="onFile" />
            <input ref="bannerInput" type="file" hidden accept="image/*" @change="onBannerFile" />
          </div>
        </div>

        <div class="account-info">
          <div class="info-row">
            <div class="info-text">
              <div class="info-label">Gorunen Ad</div>
              <div class="info-value">{{ displayName || "-" }}</div>
            </div>
            <button class="ghost-btn" @click="openEdit('displayName')">Duzenle</button>
          </div>
          <div class="info-row">
            <div class="info-text">
              <div class="info-label">Kullanici Adi</div>
              <div class="info-value">{{ username || "-" }}</div>
            </div>
            <button class="ghost-btn" @click="openEdit('username')">Duzenle</button>
          </div>
          <div class="info-row">
            <div class="info-text">
              <div class="info-label">E-posta</div>
              <div class="info-value">{{ email || "-" }}</div>
            </div>
            <button class="ghost-btn" @click="openEdit('email')">Duzenle</button>
          </div>
          <div class="info-row">
            <div class="info-text">
              <div class="info-label">Telefon Numarasi</div>
              <div class="info-value">{{ phone || "Henuz bir telefon numarasi eklemedin." }}</div>
            </div>
            <button class="ghost-btn" @click="openEdit('phone')">Ekle</button>
          </div>
        </div>

        <div class="account-section">
          <div class="section-title">Baglantilar (profilde gorunen)</div>
          <div v-if="profileConnections.length === 0" class="section-desc">
            Henuz goruntulenecek baglanti yok.
          </div>
          <div v-else class="connections-badges">
            <div v-for="conn in profileConnections" :key="conn.id" class="badge-item">
              <span class="platform-icon" :style="{ background: conn.color }" v-html="platformIcon(conn.key)"></span>
              <span>{{ conn.label }}</span>
            </div>
          </div>
        </div>

        <div class="account-section">
          <div class="section-title">Sifre ve Dogrulama</div>
          <button class="primary-btn">Sifreyi Degistir</button>
        </div>

        <div class="account-section">
          <div class="section-title">Dogrulayici Uygulama</div>
          <div class="section-desc">
            Ekstra guvenlik icin giris adimlarini artir.
          </div>
          <button class="primary-btn">Dogrulayici Uygulamayi Etkinlestir</button>
        </div>

        <div class="account-section">
          <div class="section-title">Guvenlik Anahtarlari</div>
          <div class="section-desc">
            Bir guvenlik anahtari ile hesabina ek koruma sagla.
          </div>
          <button class="primary-btn">Bir Guvenlik Anahtari Kaydet</button>
        </div>

        <div class="account-section danger">
          <div class="section-title">Hesabi Devre Disi Birak</div>
          <div class="section-desc">
            Hesabini gecici olarak kapatabilirsin. Istendiginde yeniden acilabilir.
          </div>
          <button class="danger-btn">Hesabi Devre Disi Birak</button>
        </div>
      </div>

      <div v-else-if="activeTab === 'Veri Gizliligi'" class="panel-card privacy-card">
        <div class="privacy-item" v-for="item in privacyItems" :key="item.key">
          <div class="privacy-text">
            <div class="privacy-title">{{ item.title }}</div>
            <div class="privacy-desc">{{ item.desc }}</div>
            <a class="privacy-link" href="#" @click.prevent> Daha fazla bilgi edin </a>
          </div>
          <label class="toggle">
            <input type="checkbox" v-model="privacyPrefs[item.key]" />
            <span class="toggle-ui"></span>
          </label>
        </div>

        <div class="privacy-divider"></div>

        <div class="privacy-request">
          <div class="privacy-title">Verilerini iste</div>
          <div class="privacy-desc">Tum verilerinin bir kopyasini al.</div>
          <button class="primary-btn">Veri iste</button>
        </div>
      </div>

      <div v-else-if="activeTab === 'Cihazlar'" class="panel-card devices-card">
        <div class="devices-intro">
          Discord hesap oturumunun etkin oldugu tum cihazlar burada. Bilinmeyen bir cihaz gorursen sifreni degistir.
        </div>

        <div class="devices-section">
          <div class="section-title">Mevcut Cihaz</div>
          <div v-if="currentDevice" class="device-row">
            <div class="device-icon">PC</div>
            <div class="device-info">
              <div class="device-title">{{ currentDevice.name }}</div>
              <div class="device-sub">
                {{ currentDevice.location }} <span v-if="currentDevice.lastActive">- {{ formatDeviceTime(currentDevice.lastActive) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="device-warning">Cihaz bulunamadi.</div>
        </div>

        <div class="devices-section">
          <div class="section-title">Diger Cihazlar</div>
          <div v-for="device in otherDevices" :key="device.deviceId" class="device-row">
            <div class="device-icon">PC</div>
            <div class="device-info">
              <div class="device-title">{{ device.name }}</div>
              <div class="device-sub">
                {{ device.location }} <span v-if="device.lastActive">- {{ formatDeviceTime(device.lastActive) }}</span>
              </div>
            </div>
            <button class="device-remove" @click="removeDevice(device.deviceId)">X</button>
          </div>
          <div v-if="otherDevices.length === 0" class="device-warning">
            Diger cihaz yok.
          </div>
          <div class="device-warning">
            Bazi eski cihazlar burada gorunmeyebilir. Oturumu kapatmak icin sifreni degistir.
          </div>
        </div>

        <div class="devices-section">
          <div class="section-title">Bilinen tum cihazlarda oturumu kapat</div>
          <div class="section-desc">Oturum kapattigin tum cihazlarda tekrar giris yapman gerekir.</div>
          <button class="danger-btn" @click="logoutAllDevices">Bilinen Tum Cihazlarda Oturumu Kapat</button>
        </div>
      </div>

      <div v-else-if="activeTab === 'Baglantilar'" class="panel-card connections-card">
        <div class="connections-intro">
          Profiline hesap ekle. Bu bilgi iznin olmadan paylasilmaz.
        </div>
        <div class="connections-icons">
          <button
            v-for="platform in connectionPlatforms"
            :key="platform.key"
            class="platform-btn"
            @click="openConnectionModal(platform)"
          >
            <span class="platform-icon" :style="{ background: platform.color }" v-html="platformIcon(platform.key)"></span>
            {{ platform.label }}
          </button>
        </div>

        <div v-if="connections.length === 0" class="device-warning">
          Henuz baglanti yok.
        </div>

        <div v-for="conn in connections" :key="conn.id" class="connection-card">
          <div class="connection-left">
            <span class="platform-icon" :style="{ background: conn.color }" v-html="platformIcon(conn.key)"></span>
            <div>
              <div class="connection-name">{{ conn.username }}</div>
              <div class="connection-platform">{{ conn.label }}</div>
            </div>
          </div>
          <div class="connection-toggles">
            <div class="toggle-row">
              <span>Profilde goruntule</span>
              <label class="toggle">
                <input type="checkbox" v-model="conn.showOnProfile" @change="saveConnections" />
                <span class="toggle-ui"></span>
              </label>
            </div>
            <div class="toggle-row">
              <span>Durumda goster</span>
              <label class="toggle">
                <input type="checkbox" v-model="conn.showStatus" @change="saveConnections" />
                <span class="toggle-ui"></span>
              </label>
            </div>
          </div>
          <button class="device-remove" @click="removeConnection(conn.id)">X</button>
        </div>
      </div>

      <div v-else-if="activeTab === 'Kayitli Oyunlar'" class="panel-card games-card">
        <div class="games-detect">
          <div class="games-detect-title">Oyun tespit edilemedi</div>
          <div class="games-detect-desc">Ne oynuyorsun?!</div>
        </div>
        <div class="games-detect-foot">
          Oyunun gorunmuyor musun? <button class="link-btn" @click="openGameModal">Ekle!</button>
        </div>

        <div class="games-divider"></div>

        <div class="games-section">
          <div class="section-title">Eklenen Oyunlar</div>
          <div class="section-desc">
            Oyunlarla ilgili bazi bilgiler (tur ve kapak gorseli gibi) IGDB tarafindan saglanmistir.
          </div>
          <div v-if="registeredGames.length === 0" class="games-empty">
            Henuz oyun eklenmedi.
          </div>
          <div v-else class="games-list">
            <div v-for="game in registeredGames" :key="game.id" class="game-card">
              <div class="game-left">
                <div class="game-cover">{{ game.cover }}</div>
                <div>
                  <div class="game-title">
                    {{ game.name }}
                    <span v-if="game.verified" class="game-verified">✔</span>
                  </div>
                  <div class="game-sub">En son {{ game.lastPlayed }}</div>
                </div>
              </div>
              <div class="game-actions">
                <button
                  class="game-icon"
                  :class="{ active: game.visible }"
                  @click="toggleGameVisible(game)"
                  title="Gorunur"
                >
                  👁
                </button>
                <button
                  class="game-icon"
                  :class="{ active: game.detected }"
                  @click="toggleGameDetected(game)"
                  title="Etkin"
                >
                  📍
                </button>
                <button class="game-icon danger" @click="removeGame(game.id)" title="Kaldir">
                  ⛔
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'Oyun Arayuzu'" class="panel-card overlay-card">
        <div class="overlay-section">
          <div class="overlay-row">
            <div>
              <div class="overlay-title">Arayuzu Etkinlestir</div>
              <div class="overlay-desc">
                Daha hafif, daha hizli ve daha ozellestirilebilir. Kenarliksiz ekran ayari gerektirir.
              </div>
            </div>
            <label class="toggle">
              <input type="checkbox" v-model="overlayPrefs.enabled" />
              <span class="toggle-ui"></span>
            </label>
          </div>
          <div class="overlay-row">
            <div>
              <div class="overlay-title">Eski arayuzu etkinlestir</div>
              <div class="overlay-desc">
                Eski arayuz, desteklenen tum oyunlarda kullanilabilir.
              </div>
            </div>
            <label class="toggle">
              <input type="checkbox" v-model="overlayPrefs.legacy" />
              <span class="toggle-ui"></span>
            </label>
          </div>
          <div class="overlay-row">
            <div>
              <div class="overlay-title">Bir Sorun Bildir</div>
              <div class="overlay-desc">
                Arayuz bekledigin gibi calismiyorsa sorun duzeltebilmemiz icin bize haber ver.
              </div>
            </div>
            <button class="primary-btn">Bildir</button>
          </div>
        </div>

        <div class="overlay-section">
          <div class="overlay-row">
            <div>
              <div class="overlay-title">Arayuz Kilidini Ayarla</div>
              <div class="overlay-desc">
                Arayuz tus atamasi gecersiz bir tus atamasi (sadece shift) nedeniyle devre disi birakildi.
                Lutfen tus atamasini farkli bir tusla degistir.
              </div>
            </div>
            <div class="overlay-keybind">
              <span class="key-pill">{{ overlayKey }}</span>
              <button class="ghost-btn" @click="openKeybindModal">Tus At. Duzenle</button>
            </div>
          </div>
          <div class="overlay-row">
            <div>
              <div class="overlay-title">Arayuzde tiklanabilir bolgeleri etkinlestir</div>
              <div class="overlay-desc">
                Arayuz kilitliyken bildirimler gibi alanlarin tiklanabilir olmasina izin ver.
              </div>
            </div>
            <label class="toggle">
              <input type="checkbox" v-model="overlayPrefs.clickable" />
              <span class="toggle-ui"></span>
            </label>
          </div>
        </div>

        <div class="overlay-section overlay-grid">
          <div class="overlay-controls">
            <div class="overlay-subtitle">Ses Widget'i</div>
            <div class="overlay-control">
              <div class="control-label">Avatar Boyutu</div>
              <select v-model="overlayAvatarSize" class="control-select">
                <option v-for="opt in avatarSizeOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="overlay-control">
              <div class="control-label">Adlari Goruntule</div>
              <select v-model="overlayNameDisplay" class="control-select">
                <option v-for="opt in nameDisplayOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="overlay-control">
              <div class="control-label">Kullanicilari Goruntule</div>
              <select v-model="overlayUserDisplay" class="control-select">
                <option v-for="opt in userDisplayOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="overlay-control">
              <div class="control-label">Goruntulenen Maksimum Kullanici</div>
              <div class="slider-wrap">
                <input
                  class="control-slider"
                  type="range"
                  min="5"
                  max="25"
                  step="5"
                  v-model="overlayMaxUsers"
                />
                <div class="slider-scale">
                  <span v-for="n in [5,10,15,20,25]" :key="n">{{ n }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="overlay-preview">
            <div class="preview-title">
              Ses Kanali
              <span v-if="overlayPreviewActive" class="preview-live">{{ overlayPreviewLabel }}</span>
            </div>
            <div class="preview-card">
              <div
                v-for="user in overlayPreviewUsers"
                :key="user.id"
                class="preview-user"
                :class="{ speaking: user.speaking }"
              >
                <div class="preview-avatar" :style="{ background: user.color }">{{ user.initials }}</div>
                <div class="preview-name">{{ user.name }}</div>
                <div class="preview-status" :class="{ mute: user.muted }">
                  {{ user.muted ? "Mute" : user.speaking ? "Konusuyor" : "Bos" }}
                </div>
                <button
                  class="preview-mic"
                  :class="{ muted: user.muted, disabled: overlayPreviewActive }"
                  :disabled="overlayPreviewActive"
                  @click="togglePreviewMute(user)"
                >
                  {{ user.muted ? "Mic Kapali" : "Mic" }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="overlay-section">
          <div class="overlay-subtitle">Bildirimler</div>
          <div class="overlay-row">
            <div>
              <div class="overlay-title">Mesajlar</div>
              <div class="overlay-desc">
                Her yazili mesaj bildirimi icin cevap verebilecegin bir bildirim gosterir.
              </div>
            </div>
            <label class="toggle">
              <input type="checkbox" v-model="overlayPrefs.notifMessages" />
              <span class="toggle-ui"></span>
            </label>
          </div>
          <div class="overlay-row">
            <div>
              <div class="overlay-title">Hos geldin</div>
              <div class="overlay-desc">
                Arayuz her acildiginda, arayuzun simdi aktif oldugunu bildiren bir bildirim gosterir.
              </div>
            </div>
            <label class="toggle">
              <input type="checkbox" v-model="overlayPrefs.notifWelcome" />
              <span class="toggle-ui"></span>
            </label>
          </div>
          <div class="overlay-row">
            <div>
              <div class="overlay-title">Go Live</div>
              <div class="overlay-desc">
                Arayuz ilk acildiginda bir oyun yayini yapabilecegini sana bildirir.
              </div>
            </div>
            <label class="toggle">
              <input type="checkbox" v-model="overlayPrefs.notifGoLive" />
              <span class="toggle-ui"></span>
            </label>
          </div>
          <div class="overlay-row">
            <div>
              <div class="overlay-title">Oyun Etkinligi</div>
              <div class="overlay-desc">
                Su anda oynadigin oyunu oynayan veya yakin zamanda oynamis arkadaslarini gosterir.
              </div>
            </div>
            <label class="toggle">
              <input type="checkbox" v-model="overlayPrefs.notifActivity" />
              <span class="toggle-ui"></span>
            </label>
          </div>
          <div class="overlay-row">
            <div>
              <div class="overlay-title">Simdi Oynuyor</div>
              <div class="overlay-desc">
                Su anda oynadigin oyunu bir arkadasin oynamaya basladiginda sana bildirir.
              </div>
            </div>
            <label class="toggle">
              <input type="checkbox" v-model="overlayPrefs.notifNowPlaying" />
              <span class="toggle-ui"></span>
            </label>
          </div>
        </div>
      </div>

      <div v-else class="panel-card">
        <div class="panel-note">
          {{ activeTab }} ayarlari yakinda buradan yonetilecek.
        </div>
      </div>
    </main>

    <div v-if="connectionModalOpen" class="edit-modal" @click="closeConnectionModal">
      <div class="edit-card" @click.stop>
        <div class="edit-title">Baglanti Ekle</div>
        <div class="connections-icons modal-grid">
          <button
            v-for="platform in connectionPlatforms"
            :key="platform.key"
            class="platform-btn"
            @click="selectConnectionPlatform(platform)"
          >
            <span class="platform-icon" :style="{ background: platform.color }" v-html="platformIcon(platform.key)"></span>
            {{ platform.label }}
          </button>
        </div>
        <input v-model="connectionUsername" class="edit-input" placeholder="Kullanici adi" />
        <div class="edit-actions">
          <button class="ghost-btn" @click="closeConnectionModal">Iptal</button>
          <button class="primary-btn" @click="addConnection">Ekle</button>
        </div>
      </div>
    </div>

    <div v-if="editModalOpen" class="edit-modal" @click="closeEdit">
      <div class="edit-card" @click.stop>
        <div class="edit-title">Duzenle</div>
        <input v-model="editValue" class="edit-input" />
        <div class="edit-actions">
          <button class="ghost-btn" @click="closeEdit">Iptal</button>
          <button class="primary-btn" @click="saveEdit" :disabled="loading">Kaydet</button>
        </div>
      </div>
    </div>

    <div v-if="gameModalOpen" class="edit-modal" @click="closeGameModal">
      <div class="edit-card" @click.stop>
        <div class="edit-title">Oyun Ekle</div>
        <input v-model="gameNameInput" class="edit-input" placeholder="Oyun adi" />
        <div class="edit-actions">
          <button class="ghost-btn" @click="closeGameModal">Iptal</button>
          <button class="primary-btn" @click="addGame">Ekle</button>
        </div>
      </div>
    </div>

    <div v-if="keybindModalOpen" class="edit-modal" @click="closeKeybindModal">
      <div class="edit-card" @click.stop>
        <div class="edit-title">Arayuz Kisalolunu Ayarla</div>
        <div class="keybind-instructions">
          Yeni bir tus kombinasyonu gir. ESC iptal eder.
        </div>
        <div class="keybind-display">{{ pendingKeybind || "Tuslara bas..." }}</div>
        <div class="edit-actions">
          <button class="ghost-btn" @click="closeKeybindModal">Iptal</button>
          <button class="primary-btn" :disabled="!pendingKeybind" @click="saveKeybind">Kaydet</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import axios from "axios";
import { useUserStore } from "../store/user";
import { useRouter } from "vue-router";

const userStore = useUserStore();
const router = useRouter();

const user = userStore.user;
const username = ref(user?.username || "");
const displayName = ref(user?.displayName || "");
const email = ref(user?.email || "");
const phone = ref(user?.phone || "");
const preview = ref(user?.avatar || "");
const bannerPreview = ref(user?.banner || "");
const fileInput = ref(null);
const bannerInput = ref(null);
const loading = ref(false);
const activeTab = ref("Hesabim");
const editModalOpen = ref(false);
const editField = ref("");
const editValue = ref("");
const devices = ref([]);
const deviceId = ref("");
const connections = ref([]);
const connectionModalOpen = ref(false);
const connectionPlatform = ref(null);
const connectionUsername = ref("");
const keybindModalOpen = ref(false);
const pendingKeybind = ref("");
const keybindHandler = ref(null);
const gameModalOpen = ref(false);
const gameNameInput = ref("");

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
const connectionPlatforms = [
  { key: "bnet", label: "Battle.net", color: "#1a9fff" },
  { key: "paypal", label: "PayPal", color: "#003087" },
  { key: "reddit", label: "Reddit", color: "#ff4500" },
  { key: "steam", label: "Steam", color: "#1b2838" },
  { key: "tiktok", label: "TikTok", color: "#111111" },
  { key: "x", label: "X", color: "#000000" },
  { key: "ebay", label: "eBay", color: "#e53238" },
  { key: "crunchy", label: "Crunchyroll", color: "#f47521" },
  { key: "psn", label: "PlayStation", color: "#006fcd" },
  { key: "xbox", label: "Xbox", color: "#107c10" }
];
const avatarSizeOptions = ["Kucuk", "Orta", "Buyuk"];
const nameDisplayOptions = ["Her zaman", "Konusurken"];
const userDisplayOptions = ["Her zaman", "Aktif olunca"];
const privacyItems = [
  {
    key: "service_data",
    title: "Verileri hizmetleri gelistirmek icin kullan",
    desc: "Hizmetleri iyilestirmek icin verileri kullanmamiza izin ver."
  },
  {
    key: "sponsored_activity",
    title: "Sponsorlu icerigi kisisellestirmek icin etkinligini kullan",
    desc: "Etkinligini kullanarak sponsorlu icerikleri sana uygun hale getir."
  },
  {
    key: "third_party",
    title: "Ucuncu taraf verilerini kullan",
    desc: "Ucuncu taraflardan gelen verilerle deneyimini kisisellestir."
  },
  {
    key: "personalize",
    title: "Deneyimi kisisellestirmek icin verilerini kullan",
    desc: "Konustugun kisilere ve oyunlara gore deneyimini ayarla."
  },
  {
    key: "service_core",
    title: "Hizmetin calismasi icin verileri kullan",
    desc: "Temel hizmetleri sunmak icin gerekli verileri isle."
  }
];
const privacyPrefs = ref({
  service_data: true,
  sponsored_activity: true,
  third_party: true,
  personalize: true,
  service_core: true
});
const overlayPrefs = ref({
  enabled: true,
  legacy: false,
  clickable: true,
  notifMessages: true,
  notifWelcome: true,
  notifGoLive: true,
  notifActivity: true,
  notifNowPlaying: true
});
const overlayKey = ref("SHIFT");
const overlayAvatarSize = ref("Buyuk");
const overlayNameDisplay = ref("Her zaman");
const overlayUserDisplay = ref("Her zaman");
const overlayMaxUsers = ref(10);
const overlayLive = ref(null);
const overlayPreviewFallback = [
  { id: 1, name: "m1rcaxdetanirlar", initials: "M1", color: "#5865f2", speaking: true, muted: false },
  { id: 2, name: "Acetaminophen", initials: "AC", color: "#16a34a", speaking: false, muted: true },
  { id: 3, name: "Koyanth", initials: "KO", color: "#0ea5e9", speaking: true, muted: false },
  { id: 4, name: "Scynder", initials: "SC", color: "#f59e0b", speaking: false, muted: false }
];
const registeredGames = ref([]);

const initials = computed(() =>
  (user?.username || "U").slice(0, 2).toUpperCase()
);

const getInitials = (name) => (name || "U").slice(0, 2).toUpperCase();

const overlayPreviewActive = computed(() => {
  return !!overlayLive.value && overlayLive.value.status && overlayLive.value.status !== "idle";
});

const overlayPreviewLabel = computed(() => {
  const status = overlayLive.value?.status;
  if (status === "connected") return "Bagli";
  if (status === "connecting") return "Baglaniyor";
  if (status === "ringing") return "Araniyor";
  return "Ornek";
});

const overlayPreviewUsers = computed(() => {
  const live = overlayLive.value;
  if (!overlayPreviewActive.value || !live) return overlayPreviewFallback;

  const users = [];
  const selfName = live.self?.name || displayName.value || username.value || "Sen";
  const selfMuted = !!live.self?.muted;
  users.push({
    id: live.self?.id || "self",
    name: selfName,
    initials: getInitials(selfName),
    color: "#5865f2",
    speaking: live.status === "connected" && !selfMuted,
    muted: selfMuted
  });

  if (live.other?.name) {
    users.push({
      id: live.other?.id || "other",
      name: live.other.name,
      initials: getInitials(live.other.name),
      color: "#0ea5e9",
      speaking: live.status === "connected",
      muted: false
    });
  }

  return users;
});

const loadOverlayLive = () => {
  const raw = localStorage.getItem("visicos_voice_overlay");
  if (!raw) {
    overlayLive.value = null;
    return;
  }
  try {
    overlayLive.value = JSON.parse(raw);
  } catch (err) {
    overlayLive.value = null;
  }
};

const onEsc = (event) => {
  if (event.key === "Escape") router.push("/friends");
};

onMounted(() => {
  if (!user) router.push("/login");
  window.addEventListener("keydown", onEsc);
  const saved = localStorage.getItem("visicos_privacy");
  if (saved) privacyPrefs.value = JSON.parse(saved);
  const overlaySaved = localStorage.getItem("visicos_game_overlay");
  if (overlaySaved) {
    try {
      const parsed = JSON.parse(overlaySaved);
      overlayPrefs.value = { ...overlayPrefs.value, ...parsed.prefs };
      overlayKey.value = parsed.key || overlayKey.value;
      overlayAvatarSize.value = parsed.avatarSize || overlayAvatarSize.value;
      overlayNameDisplay.value = parsed.nameDisplay || overlayNameDisplay.value;
      overlayUserDisplay.value = parsed.userDisplay || overlayUserDisplay.value;
      overlayMaxUsers.value = parsed.maxUsers || overlayMaxUsers.value;
    } catch (err) {
      console.error(err);
    }
  }
  deviceId.value = localStorage.getItem("visicos_device_id") || "";
  loadConnections();
  loadOverlayLive();
  window.addEventListener("storage", loadOverlayLive);
  window.addEventListener("visicos-overlay-update", loadOverlayLive);
  loadRegisteredGames();
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onEsc);
  window.removeEventListener("storage", loadOverlayLive);
  window.removeEventListener("visicos-overlay-update", loadOverlayLive);
  cleanupKeybindListener();
});

watch(
  privacyPrefs,
  (val) => localStorage.setItem("visicos_privacy", JSON.stringify(val)),
  { deep: true }
);

watch(
  [overlayPrefs, overlayKey, overlayAvatarSize, overlayNameDisplay, overlayUserDisplay, overlayMaxUsers],
  () => {
    const payload = {
      prefs: overlayPrefs.value,
      key: overlayKey.value,
      avatarSize: overlayAvatarSize.value,
      nameDisplay: overlayNameDisplay.value,
      userDisplay: overlayUserDisplay.value,
      maxUsers: overlayMaxUsers.value
    };
    localStorage.setItem("visicos_game_overlay", JSON.stringify(payload));
  },
  { deep: true }
);

watch(
  registeredGames,
  () => localStorage.setItem("visicos_registered_games", JSON.stringify(registeredGames.value)),
  { deep: true }
);

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
    const payload = {};
    if (username.value) payload.username = username.value;
    if (displayName.value) payload.displayName = displayName.value;
    if (email.value) payload.email = email.value;
    if (phone.value) payload.phone = phone.value;
    if (preview.value) payload.avatar = preview.value;
    if (bannerPreview.value) payload.banner = bannerPreview.value;
    const res = await axios.put(`/api/auth/profile/${user._id}`, payload);
    userStore.setUser(res.data);
    alert("Profil guncellendi");
  } catch (e) {
    console.error(e);
    alert("Profil guncellenemedi");
  } finally {
    loading.value = false;
  }
};

const openEdit = (field) => {
  editField.value = field;
  if (field === "displayName") editValue.value = displayName.value;
  if (field === "username") editValue.value = username.value;
  if (field === "email") editValue.value = email.value;
  if (field === "phone") editValue.value = phone.value;
  editModalOpen.value = true;
};

const closeEdit = () => {
  editModalOpen.value = false;
};

const saveEdit = async () => {
  const field = editField.value;
  const value = editValue.value.trim();
  if (!field) return;
  loading.value = true;
  try {
    const payload = {};
    payload[field] = value;
    const res = await axios.put(`/api/auth/profile/${user._id}`, payload);
    userStore.setUser(res.data);
    displayName.value = res.data.displayName || "";
    username.value = res.data.username || "";
    email.value = res.data.email || "";
    phone.value = res.data.phone || "";
    closeEdit();
  } catch (e) {
    console.error(e);
    alert("Guncelleme basarisiz");
  } finally {
    loading.value = false;
  }
};

const logout = () => {
  userStore.logout();
  router.push("/login");
};

const loadDevices = async () => {
  if (!user?._id) return;
  const res = await axios.get(`/api/auth/devices/${user._id}`);
  devices.value = res.data || [];
};

const currentDevice = computed(() => {
  if (!devices.value.length) return null;
  return devices.value.find((d) => d.deviceId === deviceId.value) || devices.value[0];
});

const otherDevices = computed(() => {
  return devices.value.filter((d) => d.deviceId !== deviceId.value);
});

const removeDevice = async (id) => {
  if (!user?._id || !id) return;
  const res = await axios.post("/api/auth/devices/remove", {
    userId: user._id,
    deviceId: id
  });
  devices.value = res.data?.devices || [];
};

const logoutAllDevices = async () => {
  if (!user?._id) return;
  const res = await axios.post("/api/auth/devices/logout-all", {
    userId: user._id,
    keepDeviceId: deviceId.value
  });
  devices.value = res.data?.devices || [];
};

const formatDeviceTime = (ts) => {
  if (!ts) return "";
  const date = new Date(ts);
  return date.toLocaleString("tr-TR");
};

const loadConnections = () => {
  const saved = localStorage.getItem(`visicos_connections_${user?._id}`) || "[]";
  try {
    connections.value = JSON.parse(saved);
  } catch (err) {
    connections.value = [];
  }
};

const saveConnections = () => {
  localStorage.setItem(`visicos_connections_${user?._id}`, JSON.stringify(connections.value));
};

const openConnectionModal = (platform) => {
  connectionPlatform.value = platform;
  connectionUsername.value = "";
  connectionModalOpen.value = true;
};

const selectConnectionPlatform = (platform) => {
  connectionPlatform.value = platform;
};

const closeConnectionModal = () => {
  connectionModalOpen.value = false;
};

const addConnection = () => {
  if (!connectionPlatform.value) return;
  const username = connectionUsername.value.trim();
  if (!username) return;
  connections.value.push({
    id: `${connectionPlatform.value.key}-${Date.now()}`,
    key: connectionPlatform.value.key,
    label: connectionPlatform.value.label,
    color: connectionPlatform.value.color,
    username,
    showOnProfile: true,
    showStatus: true
  });
  saveConnections();
  closeConnectionModal();
};

const platformIcon = (key) => {
  const icons = {
    bnet: "<svg viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2'><circle cx='12' cy='12' r='7'/><path d='M12 5v14'/><path d='M5 12h14'/></svg>",
    paypal: "<svg viewBox='0 0 24 24' fill='white'><path d='M7 4h6a5 5 0 0 1 0 10h-3l-1 6H5l2-12z'/></svg>",
    reddit: "<svg viewBox='0 0 24 24' fill='white'><circle cx='12' cy='13' r='5'/><circle cx='9' cy='12' r='1'/><circle cx='15' cy='12' r='1'/><path d='M10 15c1.2 1 2.8 1 4 0'/><circle cx='18' cy='8' r='2'/></svg>",
    steam: "<svg viewBox='0 0 24 24' fill='white'><circle cx='16.5' cy='7.5' r='3.5'/><circle cx='7.5' cy='16.5' r='2.5'/><path d='M10 14l4-4'/></svg>",
    tiktok: "<svg viewBox='0 0 24 24' fill='white'><path d='M14 5c1 2 2.5 3 4 3v3c-1.5 0-3-0.6-4-1.6V16a4 4 0 1 1-4-4v3a1 1 0 1 0 1 1V5h3z'/></svg>",
    x: "<svg viewBox='0 0 24 24' fill='white'><path d='M5 5l14 14M19 5L5 19' stroke='white' stroke-width='2'/></svg>",
    ebay: "<svg viewBox='0 0 24 24' fill='white'><path d='M4 9h6v2H4zM11 9h6v2h-6zM7 13h10v2H7z'/></svg>",
    crunchy: "<svg viewBox='0 0 24 24' fill='white'><path d='M12 5a7 7 0 1 0 7 7h-3a4 4 0 1 1-4-4V5z'/></svg>",
    psn: "<svg viewBox='0 0 24 24' fill='white'><path d='M7 8l8-3v12l-3-1V9l-2 1v7l-3-1z'/></svg>",
    xbox: "<svg viewBox='0 0 24 24' fill='white'><path d='M6 6c3 2 4 4 6 6 2-2 3-4 6-6 2 2 2 6 0 8-2 2-4 2-6 4-2-2-4-2-6-4-2-2-2-6 0-8z'/></svg>"
  };
  return icons[key] || "";
};

const removeConnection = (id) => {
  connections.value = connections.value.filter((c) => c.id !== id);
  saveConnections();
};

const profileConnections = computed(() => {
  return connections.value.filter((c) => c.showOnProfile);
});

watch(activeTab, (val) => {
  if (val === "Cihazlar") loadDevices();
});

const openKeybindModal = () => {
  pendingKeybind.value = "";
  keybindModalOpen.value = true;
  attachKeybindListener();
};

const closeKeybindModal = () => {
  keybindModalOpen.value = false;
  pendingKeybind.value = "";
  cleanupKeybindListener();
};

const attachKeybindListener = () => {
  cleanupKeybindListener();
  keybindHandler.value = (event) => {
    if (!keybindModalOpen.value) return;
    if (event.key === "Escape") {
      closeKeybindModal();
      return;
    }
    event.preventDefault();
    const parts = [];
    if (event.ctrlKey) parts.push("CTRL");
    if (event.altKey) parts.push("ALT");
    if (event.shiftKey) parts.push("SHIFT");
    if (event.metaKey) parts.push("META");
    const key = event.key.toUpperCase();
    if (!["CONTROL", "SHIFT", "ALT", "META"].includes(key)) parts.push(key);
    const formatted = parts.join(" + ");
    if (formatted && formatted !== "SHIFT") pendingKeybind.value = formatted;
  };
  window.addEventListener("keydown", keybindHandler.value);
};

const cleanupKeybindListener = () => {
  if (keybindHandler.value) {
    window.removeEventListener("keydown", keybindHandler.value);
    keybindHandler.value = null;
  }
};

const saveKeybind = () => {
  if (!pendingKeybind.value) return;
  overlayKey.value = pendingKeybind.value;
  closeKeybindModal();
};

const togglePreviewMute = (user) => {
  if (overlayPreviewActive.value) return;
  user.muted = !user.muted;
  if (user.muted) user.speaking = false;
};

const loadRegisteredGames = () => {
  const raw = localStorage.getItem("visicos_registered_games");
  if (!raw) {
    registeredGames.value = [
      {
        id: "valorant",
        name: "VALORANT",
        cover: "V",
        verified: true,
        lastPlayed: "25 gun once oynandi",
        visible: true,
        detected: true
      }
    ];
    return;
  }
  try {
    registeredGames.value = JSON.parse(raw);
  } catch (err) {
    registeredGames.value = [];
  }
};

const openGameModal = () => {
  gameNameInput.value = "";
  gameModalOpen.value = true;
};

const closeGameModal = () => {
  gameModalOpen.value = false;
};

const addGame = () => {
  const name = gameNameInput.value.trim();
  if (!name) return;
  registeredGames.value.unshift({
    id: `${name}-${Date.now()}`,
    name,
    cover: name.slice(0, 1).toUpperCase(),
    verified: false,
    lastPlayed: "az once",
    visible: true,
    detected: true
  });
  closeGameModal();
};

const removeGame = (id) => {
  registeredGames.value = registeredGames.value.filter((g) => g.id !== id);
};

const toggleGameVisible = (game) => {
  game.visible = !game.visible;
};

const toggleGameDetected = (game) => {
  game.detected = !game.detected;
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

.account-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.account-top {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.account-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.account-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.account-identity {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.account-name {
  font-size: 18px;
  font-weight: 700;
}

.account-status {
  font-size: 12px;
  color: #9be7a1;
}

.account-info {
  background: #1f1f22;
  border: 1px solid #2d2e33;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.info-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 11px;
  color: var(--text-muted);
}

.info-value {
  font-size: 13px;
  color: var(--text);
}

.account-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 6px;
  border-top: 1px solid #2d2e33;
}

.section-desc {
  font-size: 12px;
  color: var(--text-muted);
}

.account-section.danger .section-title {
  color: #ff6b6b;
}

.danger-btn {
  background: #2b1313;
  border: 1px solid #5a1d1d;
  color: #ffd4d4;
  border-radius: 10px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 700;
}

.danger-btn:hover {
  border-color: #7a2a2a;
}

.panel-note {
  color: var(--text-muted);
  font-size: 13px;
}

.privacy-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.privacy-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 12px;
  background: #1f1f22;
  border: 1px solid #2d2e33;
  border-radius: 12px;
}

.privacy-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.privacy-title {
  font-size: 13px;
  font-weight: 600;
}

.privacy-desc {
  font-size: 12px;
  color: var(--text-muted);
}

.privacy-link {
  font-size: 12px;
  color: #7aa7ff;
}

.privacy-divider {
  height: 1px;
  background: #2d2e33;
}

.privacy-request {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.devices-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.devices-intro {
  color: var(--text-muted);
  font-size: 12px;
}

.devices-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 6px;
  border-top: 1px solid #2d2e33;
}

.device-row {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 12px;
  align-items: center;
  background: #1f1f22;
  border: 1px solid #2d2e33;
  border-radius: 12px;
  padding: 10px;
}

.device-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #2a2b30;
  display: grid;
  place-items: center;
  font-size: 12px;
  color: var(--text-muted);
}

.device-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.device-title {
  font-size: 13px;
  font-weight: 600;
}

.device-sub {
  font-size: 12px;
  color: var(--text-muted);
}

.device-remove {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 16px;
}

.device-warning {
  font-size: 12px;
  color: var(--text-muted);
  padding: 8px 10px;
  background: #1f1f22;
  border: 1px dashed #2d2e33;
  border-radius: 10px;
}

.connections-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.connections-intro {
  font-size: 12px;
  color: var(--text-muted);
}

.connections-icons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.platform-btn {
  background: #1f1f22;
  border: 1px solid #2d2e33;
  color: var(--text);
  border-radius: 10px;
  padding: 8px 10px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 12px;
}

.platform-icon {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.connections-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.badge-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #1f1f22;
  border: 1px solid #2d2e33;
  border-radius: 10px;
  padding: 6px 8px;
  font-size: 12px;
  color: var(--text);
}

.connection-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  background: #1f1f22;
  border: 1px solid #2d2e33;
  border-radius: 12px;
  padding: 12px;
}

.connection-left {
  display: flex;
  gap: 10px;
  align-items: center;
}

.connection-name {
  font-size: 13px;
  font-weight: 600;
}

.connection-platform {
  font-size: 12px;
  color: var(--text-muted);
}

.connection-toggles {
  display: grid;
  gap: 8px;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--text-muted);
}

.modal-grid {
  max-height: 160px;
  overflow-y: auto;
}

.games-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.games-detect {
  background: #2a2b30;
  border: 1px solid #33343a;
  border-radius: 14px;
  padding: 16px;
}

.games-detect-title {
  font-size: 13px;
  font-weight: 700;
}

.games-detect-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 6px;
}

.games-detect-foot {
  font-size: 12px;
  color: var(--text-muted);
}

.link-btn {
  background: none;
  border: none;
  color: #7aa7ff;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
}

.games-divider {
  height: 1px;
  background: #2d2e33;
}

.games-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.games-empty {
  font-size: 12px;
  color: var(--text-muted);
  padding: 10px 12px;
  background: #1f1f22;
  border: 1px dashed #2d2e33;
  border-radius: 10px;
}

.games-list {
  display: grid;
  gap: 10px;
}

.game-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  background: #2a2b30;
  border: 1px solid #33343a;
  border-radius: 12px;
  padding: 12px;
}

.game-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.game-cover {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: #1f1f22;
  border: 1px solid #33343a;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 700;
}

.game-title {
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}

.game-verified {
  color: #7aa7ff;
  font-size: 12px;
}

.game-sub {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

.game-actions {
  display: flex;
  gap: 8px;
}

.game-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid #3a3b41;
  background: #1f1f22;
  color: var(--text-muted);
  cursor: pointer;
  display: grid;
  place-items: center;
}

.game-icon.active {
  color: #9be7a1;
  border-color: #2ecc71;
}

.game-icon.danger {
  color: #ff9a9a;
  border-color: #5a2a2a;
  background: #2b1313;
}

.overlay-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.overlay-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 6px;
  border-top: 1px solid #2d2e33;
}

.overlay-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px;
  background: #2a2b30;
  border: 1px solid #33343a;
  border-radius: 12px;
}

.overlay-title {
  font-size: 13px;
  font-weight: 600;
}

.overlay-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
  max-width: 520px;
}

.overlay-subtitle {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 4px;
}

.overlay-keybind {
  display: flex;
  align-items: center;
  gap: 10px;
}

.key-pill {
  background: #1f1f22;
  border: 1px solid #3a3b41;
  color: var(--text);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
}

.overlay-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 16px;
}

.overlay-controls {
  display: grid;
  gap: 12px;
}

.overlay-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #2a2b30;
  border: 1px solid #33343a;
  border-radius: 12px;
  padding: 12px;
}

.control-label {
  font-size: 12px;
  color: var(--text-muted);
}

.control-select {
  background: #1f1f22;
  border: 1px solid #33343a;
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--text);
}

.slider-wrap {
  display: grid;
  gap: 8px;
}

.control-slider {
  width: 100%;
}

.slider-scale {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-muted);
}

.overlay-preview {
  background: #2a2b30;
  border: 1px dashed #3a3b41;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-title {
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-live {
  font-size: 10px;
  color: #9be7a1;
  background: rgba(46, 204, 113, 0.15);
  border: 1px solid rgba(46, 204, 113, 0.4);
  border-radius: 999px;
  padding: 2px 8px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.preview-card {
  display: grid;
  gap: 8px;
}

.preview-user {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1f1f22;
  border: 1px solid #2d2e33;
  border-radius: 10px;
  padding: 6px 8px;
}

.preview-user.speaking {
  border-color: #5865f2;
  box-shadow: 0 0 0 1px rgba(88,101,242,0.4);
}

.preview-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 700;
}

.preview-name {
  font-size: 12px;
  font-weight: 600;
  flex: 1;
}

.preview-status {
  font-size: 10px;
  color: var(--text-muted);
  padding: 2px 6px;
  border-radius: 999px;
  background: #2a2b30;
}

.preview-status.mute {
  color: #ff9a9a;
  background: #3b1f1f;
}

.preview-mic {
  background: #2a2b30;
  border: 1px solid #3a3b41;
  color: var(--text-muted);
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 10px;
  cursor: pointer;
}

.preview-mic.muted {
  color: #ff9a9a;
  border-color: #5a2a2a;
  background: #2b1313;
}

.preview-mic.disabled {
  opacity: 0.6;
  cursor: default;
}

.keybind-instructions {
  font-size: 12px;
  color: var(--text-muted);
}

.keybind-display {
  background: #1f1f22;
  border: 1px solid #33343a;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.toggle {
  position: relative;
  width: 46px;
  height: 26px;
  flex-shrink: 0;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-ui {
  position: absolute;
  inset: 0;
  background: #3a3b41;
  border-radius: 999px;
  transition: background 0.2s ease;
}

.toggle-ui::after {
  content: "";
  position: absolute;
  width: 20px;
  height: 20px;
  top: 3px;
  left: 3px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s ease;
}

.toggle input:checked + .toggle-ui {
  background: #5865f2;
}

.toggle input:checked + .toggle-ui::after {
  transform: translateX(20px);
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

.primary-btn {
  background: linear-gradient(145deg, var(--accent-strong), var(--accent));
  color: var(--accent-dark);
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 700;
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.ghost-btn {
  background: #2a2b30;
  border: 1px solid #3a3b41;
  color: var(--text-muted);
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 600;
}

.ghost-btn:hover {
  color: var(--text-strong);
  border-color: #4a4b52;
}

.edit-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
}

.edit-card {
  width: min(420px, 92vw);
  background: #2a2b30;
  border: 1px solid #35363b;
  border-radius: 16px;
  padding: 16px;
  display: grid;
  gap: 12px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
}

.edit-title {
  font-size: 16px;
  font-weight: 700;
}

.edit-input {
  background: #1f1f22;
  border: 1px solid #33343a;
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--text);
}

.edit-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

@media (max-width: 800px) {
  .settings {
    grid-template-columns: 1fr;
  }
  .settings-nav {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
  .overlay-grid {
    grid-template-columns: 1fr;
  }
}
</style>
