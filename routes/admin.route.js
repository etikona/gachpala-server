// routes/adminAuth.routes.js
import { Router } from "express";
import { loginAdmin } from "../controllers/admin.controller.js";

const adminAuthRouter = Router();

adminAuthRouter.post("/login", loginAdmin);

export default adminAuthRouter;
