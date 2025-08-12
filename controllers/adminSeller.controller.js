// controllers/adminSellerController.js
import {
  getSellerStatistics,
  getAllSellers,
  getSellerById,
  updateSeller,
  suspendSeller,
  deleteSeller,
  createSellerByAdmin,
} from "../models/adminSeller.model.js";

// Get seller statistics for admin dashboard
export const getAdminSellerStats = async (req, res) => {
  try {
    const stats = await getSellerStatistics();
    res.json(stats);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to get seller statistics", error: err.message });
  }
};

// Get all sellers with pagination
export const getAdminSellers = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const result = await getAllSellers(
      parseInt(page),
      parseInt(limit),
      status,
      search
    );
    console.log(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ msg: "Failed to get sellers", error: err.message });
  }
};

// Get single seller details
export const getAdminSellerDetails = async (req, res) => {
  try {
    const seller = await getSellerById(req.params.id);
    if (!seller) {
      return res.status(404).json({ msg: "Seller not found" });
    }
    res.json(seller);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to get seller details", error: err.message });
  }
};

// Update seller details
export const updateAdminSeller = async (req, res) => {
  try {
    const seller = await updateSeller(req.params.id, req.body);
    res.json(seller);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to update seller", error: err.message });
  }
};

// Suspend seller account
export const suspendAdminSeller = async (req, res) => {
  try {
    const seller = await suspendSeller(req.params.id);
    res.json({ msg: "Seller account suspended", seller });
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to suspend seller", error: err.message });
  }
};

// Delete seller account
export const deleteAdminSeller = async (req, res) => {
  try {
    await deleteSeller(req.params.id);
    res.json({ msg: "Seller account deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to delete seller", error: err.message });
  }
};

// Create new seller from admin panel
export const createAdminSeller = async (req, res) => {
  try {
    const seller = await createSellerByAdmin(req.body);
    res.status(201).json(seller);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to create seller", error: err.message });
  }
};
