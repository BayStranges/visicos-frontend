import { io } from "socket.io-client";

const socket = io("https://visicos-backend.onrender.com"); // backend WS server

export default socket;
