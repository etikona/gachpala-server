import { blogRouter } from "express";

import blogController from "../controllers/blog.controller.js";
import commentController from "../controllers/comment.controller.js";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

const blogRouter = Router();
// Public
blogRouter.get("/", blogController.list); // ?search=...&category=...
blogRouter.get("/:id", blogController.details);

blogRouter.post("/", auth, role("admin"), blogController.create);

// Authenticated users can comment
blogRouter.post("/:blogId/comments", auth, commentController.create);

export default blogRouter;
