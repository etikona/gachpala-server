import { Router } from "express";
import {
  create,
  list,
  details,
  update,
  remove,
} from "../controllers/blog.controller.js";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";
import blogUpload from "../middlewares/blogUpload.middleware.js";

const blogRouter = Router();

// Public routes
blogRouter.get("/", list);
blogRouter.get("/:id", details); // Supports both ID and slug

// Protected admin routes
//auth, role("admin"),
blogRouter.post("/", blogUpload, create);
blogRouter.put("/:id", blogUpload, update);
blogRouter.delete("/:id", remove);

export default blogRouter;
