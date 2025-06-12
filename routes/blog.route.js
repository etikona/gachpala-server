import { Router } from "express";

import { create, list, details } from "../controllers/blog.controller.js";
import { createComment } from "../controllers/comment.controller.js";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

const blogRouter = Router();
// Public
blogRouter.get("/", list); // ?search=...&category=...
blogRouter.get("/:id", details);

blogRouter.post("/", auth, role("admin"), create);

// Authenticated users can comment
blogRouter.post("/:blogId/comments", auth, createComment);

export default blogRouter;
