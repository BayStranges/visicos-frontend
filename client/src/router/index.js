import { createRouter, createWebHistory } from "vue-router";
import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import DM from "../views/DM.vue";
import Friends from "../views/Friends.vue";

const routes = [
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  { path: "/", redirect: "/friends" },
  { path: "/dm/:id", component: DM, meta: { requiresAuth: true } },
  { path: "/friends", component: Friends, meta: { requiresAuth: true } },
  { path: "/profile", component: () => import("../views/Profile.vue"), meta: { requiresAuth: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (to.meta.requiresAuth && !user) {
    next("/login");
  } else if ((to.path === "/login" || to.path === "/register") && user) {
    next("/friends");
  } else {
    next();
  }
});

export default router;
