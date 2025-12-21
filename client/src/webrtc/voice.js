import socket from "../socket";

let pc = null;
let localStream = null;
let currentRoomId = null;

const log = (...args) => {
  const room = currentRoomId ? ` room=${currentRoomId}` : "";
  console.log(`[voice]${room}`, ...args);
};

const buildIceServers = () => {
  const servers = [{ urls: "stun:stun.l.google.com:19302" }];
  log("ice servers final:", servers);
  return servers;
};

const ensureRemoteAudioElement = () => {
  let audio = document.getElementById("remote-audio");
  if (!audio) {
    audio = document.createElement("audio");
    audio.id = "remote-audio";
    audio.autoplay = true;
    audio.playsInline = true;
    document.body.appendChild(audio);
  }
  return audio;
};

export const initVoice = async (roomId, { onStateChange, onRemoteTrack } = {}) => {
  currentRoomId = roomId;
  log("initVoice start");
  // Reuse PC but make sure tracks exist
  if (!localStream) {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      log("getUserMedia ok", {
        audioTracks: localStream.getAudioTracks().length,
        videoTracks: localStream.getVideoTracks().length
      });
    } catch (err) {
      log("getUserMedia failed", {
        name: err?.name,
        message: err?.message
      });
      throw err;
    }
  }

  if (!pc) {
    pc = new RTCPeerConnection({ iceServers: buildIceServers() });
    log("pc created", pc);

    pc.onicecandidate = (e) => {
      if (!e.candidate) {
        log("ice candidate complete");
        return;
      }
      log("ice candidate", {
        type: e.candidate?.type,
        protocol: e.candidate?.protocol,
        address: e.candidate?.address,
        port: e.candidate?.port
      });
      socket.emit("webrtc-ice", { roomId, candidate: e.candidate });
    };

    pc.onicecandidateerror = (e) => {
      log("ice candidate error", {
        errorCode: e?.errorCode,
        errorText: e?.errorText,
        url: e?.url
      });
    };

    pc.onsignalingstatechange = () => {
      log("signaling state:", pc.signalingState);
    };

    pc.onicegatheringstatechange = () => {
      log("ice gathering state:", pc.iceGatheringState);
    };

    pc.onnegotiationneeded = async () => {
      log("negotiation needed");
    };

    pc.onconnectionstatechange = () => {
      console.log("PC state:", pc.connectionState);
      log("pc connection state:", pc.connectionState);
      onStateChange?.(pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE state:", pc.iceConnectionState);
      log("ice connection state:", pc.iceConnectionState);
      onStateChange?.(pc.iceConnectionState);
    };

    pc.ontrack = (e) => {
      log("remote track", {
        trackId: e.track?.id,
        kind: e.track?.kind,
        streams: e.streams?.map((s) => s.id)
      });
      const [stream] = e.streams;
      if (!stream) return;
      const audio = ensureRemoteAudioElement();
      audio.srcObject = stream;
      onRemoteTrack?.(stream);
    };
  }

  // Attach local tracks if not already
  const senders = pc.getSenders();
  const hasAudio = senders.some((s) => s.track && s.track.kind === "audio");
  log("local senders", { senders: senders.length, hasAudio });
  if (!hasAudio && localStream) {
    localStream.getTracks().forEach((track) => {
      log("add local track", { id: track.id, kind: track.kind });
      pc.addTrack(track, localStream);
    });
  }

  log("initVoice done");
  return pc;
};

export const getPC = () => pc;

export const closeVoice = () => {
  log("closeVoice start");
  try {
    if (pc) pc.close();
  } catch {}

  pc = null;

  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }

  const audio = document.getElementById("remote-audio");
  if (audio) {
    audio.srcObject = null;
    audio.remove();
  }
  currentRoomId = null;
  log("closeVoice done");
};
