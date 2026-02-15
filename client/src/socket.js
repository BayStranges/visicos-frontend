import { io } from "socket.io-client";
import { SOCKET_URL } from "./config";

const socket = io(SOCKET_URL, {
  autoConnect: false,
  auth: { token: localStorage.getItem("token") || "" }
});

export const setSocketAuthToken = (token) => {
  socket.auth = { token: token || "" };
};

export default socket;
