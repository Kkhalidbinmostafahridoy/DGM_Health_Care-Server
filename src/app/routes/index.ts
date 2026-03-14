import express from "express";
import { userRoutes } from "../modules/user/user.route";
import { authRoutes } from "../modules/user/auth/auth.routs";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/user",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: authRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
