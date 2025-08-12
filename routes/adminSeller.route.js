// routes/adminSellerRoutes.js

import { Router } from "express";
import {
  getAdminSellerStats,
  getAdminSellers,
  getAdminSellerDetails,
  updateAdminSeller,
  suspendAdminSeller,
  deleteAdminSeller,
  createAdminSeller,
} from "../controllers/adminSeller.controller.js";
// import { adminAuth } from "../middleware/authMiddleware.js";
// Assuming you have admin auth middleware

const adminSellerRoute = Router();

adminSellerRoute.get("/test", (req, res) => {
  res.send("Admin Seller Route is working!");
});

adminSellerRoute.get("/stats", getAdminSellerStats);

adminSellerRoute.get("/", getAdminSellers);

adminSellerRoute.get("/:id", getAdminSellerDetails);

adminSellerRoute.put("/:id", updateAdminSeller);

adminSellerRoute.put("/:id/suspend", suspendAdminSeller);

adminSellerRoute.delete("/:id", deleteAdminSeller);

adminSellerRoute.post("/", createAdminSeller);

export default adminSellerRoute;
