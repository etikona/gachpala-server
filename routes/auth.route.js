import { Router } from "express";
import { register, login } from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const authRouter = Router();
authRouter.post("/register", register);
authRouter.post("/login", login);

export default authRouter;
