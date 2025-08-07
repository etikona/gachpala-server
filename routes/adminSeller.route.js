// routes/adminSellerRoutes.js
import express from "express";
import { Router } from "express";
import {
  getAdminSellerStats,
  getAdminSellers,
  getAdminSellerDetails,
  updateAdminSeller,
  suspendAdminSeller,
  deleteAdminSeller,
  createAdminSeller,
} from "../controllers/adminSellerController.js";
import { adminAuth } from "../middleware/authMiddleware.js";
// Assuming you have admin auth middleware

const adminSellerRoute = Router();

// Admin seller statistics
adminSellerRoute.get("/stats", adminAuth, getAdminSellerStats);

// Get all sellers with pagination
adminSellerRoute.get("/", adminAuth, getAdminSellers);

// Get single seller details
adminSellerRoute.get("/:id", adminAuth, getAdminSellerDetails);

// Update seller details
adminSellerRoute.put("/:id", adminAuth, updateAdminSeller);

// Suspend seller account
adminSellerRoute.put("/:id/suspend", adminAuth, suspendAdminSeller);

// Delete seller account
adminSellerRoute.delete("/:id", adminAuth, deleteAdminSeller);

// Create new seller from admin panel
adminSellerRoute.post("/", adminAuth, createAdminSeller);

export default adminSellerRoute;
