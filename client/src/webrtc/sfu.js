import { Device } from "mediasoup-client";
import socket from "../socket";

let device = null;
let sendTransport = null;
let recvTransport = null;
let producers = new Map();
let consumers = new Map();
let roomId = null;
let userId = null;
let localAudioTrack = null;
let localVideoTrack = null;
let screenTrack = null;

const ensureDevice = async (rtpCapabilities) => {
  if (!device) device = new Device();
  if (!device.loaded) {
    await device.load({ routerRtpCapabilities: rtpCapabilities });
  }
};

const createTransport = async (direction) =>
  new Promise((resolve, reject) => {
    socket.emit("sfu-create-transport", { roomId, userId, direction }, (res) => {
      if (res?.error) return reject(new Error(res.error));
      resolve(res);
    });
  });

const connectTransport = async (transport, dtlsParameters) =>
  new Promise((resolve, reject) => {
    socket.emit(
      "sfu-connect-transport",
      { roomId, userId, transportId: transport.id, dtlsParameters },
      (res) => {
        if (res?.error) return reject(new Error(res.error));
        resolve(res);
      }
    );
  });

const produceTrack = async (track, appData = {}) =>
  new Promise((resolve, reject) => {
    sendTransport.produce({
      track,
      appData
    }).then(resolve).catch(reject);
  });

const consume = async (producerId, producerUserId, onTrack) =>
  new Promise((resolve, reject) => {
    socket.emit(
      "sfu-consume",
      {
        roomId,
        userId,
        transportId: recvTransport.id,
        producerId,
        rtpCapabilities: device.rtpCapabilities
      },
      async (res) => {
        if (res?.error) return reject(new Error(res.error));
        const consumer = await recvTransport.consume({
          id: res.id,
          producerId: res.producerId,
          kind: res.kind,
          rtpParameters: res.rtpParameters
        });
        consumers.set(consumer.id, consumer);
        const stream = new MediaStream([consumer.track]);
        onTrack?.({ producerId, kind: consumer.kind, stream, userId: producerUserId });
        socket.emit("sfu-resume", { consumerId: consumer.id }, () => {});
        resolve(consumer);
      }
    );
  });

export const startSfuCall = async ({ room, user, onTrack, onProducerClosed }) => {
  roomId = room;
  userId = user;

  if (!socket.connected) socket.connect();

  const joinResult = await new Promise((resolve, reject) => {
    socket.emit("sfu-join", { roomId, userId }, (res) => {
      if (res?.error) return reject(new Error(res.error));
      resolve(res);
    });
  });

  await ensureDevice(joinResult.rtpCapabilities);

  const sendData = await createTransport("send");
  sendTransport = device.createSendTransport(sendData);
  sendTransport.on("connect", ({ dtlsParameters }, cb, errb) => {
    connectTransport(sendTransport, dtlsParameters).then(cb).catch(errb);
  });
  sendTransport.on("produce", ({ kind, rtpParameters }, cb, errb) => {
    socket.emit(
      "sfu-produce",
      { roomId, userId, transportId: sendTransport.id, kind, rtpParameters },
      (res) => {
        if (res?.error) return errb(new Error(res.error));
        cb({ id: res.id });
      }
    );
  });

  const recvData = await createTransport("recv");
  recvTransport = device.createRecvTransport(recvData);
  recvTransport.on("connect", ({ dtlsParameters }, cb, errb) => {
    connectTransport(recvTransport, dtlsParameters).then(cb).catch(errb);
  });

  socket.on("sfu-new-producer", async ({ producerId, userId: producerUserId }) => {
    await consume(producerId, producerUserId, onTrack);
  });

  socket.on("sfu-producer-closed", ({ producerId }) => {
    onProducerClosed?.(producerId);
  });

  for (const p of joinResult.producers || []) {
    await consume(p.producerId, p.userId, onTrack);
  }
};

export const enableMic = async (enabled) => {
  if (!localAudioTrack) return;
  localAudioTrack.enabled = !!enabled;
};

export const startMic = async (constraints) => {
  if (!sendTransport) return;
  if (!localAudioTrack) {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: constraints || true,
      video: false
    });
    localAudioTrack = stream.getAudioTracks()[0];
    const producer = await produceTrack(localAudioTrack, { source: "mic" });
    producers.set(producer.id, producer);
  }
};

export const startCamera = async () => {
  if (!sendTransport) return;
  if (!localVideoTrack) {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true
    });
    localVideoTrack = stream.getVideoTracks()[0];
    const producer = await produceTrack(localVideoTrack, { source: "cam" });
    producers.set(producer.id, producer);
  }
};

export const stopCamera = async () => {
  if (localVideoTrack) {
    localVideoTrack.stop();
    localVideoTrack = null;
  }
};

export const startScreen = async () => {
  if (!sendTransport) return;
  if (!screenTrack) {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false
    });
    screenTrack = stream.getVideoTracks()[0];
    const producer = await produceTrack(screenTrack, { source: "screen" });
    producers.set(producer.id, producer);
  }
};

export const stopScreen = async () => {
  if (screenTrack) {
    screenTrack.stop();
    screenTrack = null;
  }
};

export const stopSfuCall = async () => {
  socket.off("sfu-new-producer");
  socket.off("sfu-producer-closed");

  for (const producer of producers.values()) {
    try { producer.close(); } catch {}
  }
  producers.clear();

  for (const consumer of consumers.values()) {
    try { consumer.close(); } catch {}
  }
  consumers.clear();

  if (sendTransport) {
    try { sendTransport.close(); } catch {}
    sendTransport = null;
  }
  if (recvTransport) {
    try { recvTransport.close(); } catch {}
    recvTransport = null;
  }

  if (localAudioTrack) {
    localAudioTrack.stop();
    localAudioTrack = null;
  }
  if (localVideoTrack) {
    localVideoTrack.stop();
    localVideoTrack = null;
  }
  if (screenTrack) {
    screenTrack.stop();
    screenTrack = null;
  }

  if (roomId && userId) {
    socket.emit("sfu-leave", { roomId, userId });
  }
  roomId = null;
  userId = null;
  device = null;
};
