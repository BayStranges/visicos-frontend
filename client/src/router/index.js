import { createRouter, createWebHistory, createWebHashHistory } from "vue-router";
import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import DM from "../views/DM.vue";
import Friends from "../views/Friends.vue";
import Server from "../views/Server.vue";

const routes = [
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  { path: "/", redirect: "/friends" },
  { path: "/dm/:id", component: DM, meta: { requiresAuth: true } },
  { path: "/friends", component: Friends, meta: { requiresAuth: true } },
  { path: "/profile", component: () => import("../views/Profile.vue"), meta: { requiresAuth: true } },
  { path: "/server/:id", component: Server, meta: { requiresAuth: true } }
];

const isElectron = typeof navigator !== "undefined" && /Electron/i.test(navigator.userAgent || "");

const router = createRouter({
  history: isElectron ? createWebHashHistory() : createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  if (to.meta.requiresAuth && (!user || !token)) {
    if (user && !token) localStorage.removeItem("user");
    next("/login");
  } else if ((to.path === "/login" || to.path === "/register") && user && token) {
    next("/friends");
  } else {
    next();
  }
});

export default router;
