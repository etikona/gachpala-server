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

//! Update seller details
export const updateAdminSeller = async (req, res) => {
  try {
    // Log incoming request for debugging
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);

    // Validate request contains data
    if (!req.body && !req.files) {
      return res.status(400).json({ error: "No data provided for update" });
    }

    // Prepare update data
    const updateData = {
      ...req.body,
      ...(req.files?.govt_id_proof && {
        govt_id_proof: `/uploads/sellers/${req.files.govt_id_proof[0].filename}`,
      }),
      ...(req.files?.business_license && {
        business_license: `/uploads/sellers/${req.files.business_license[0].filename}`,
      }),
      ...(req.files?.profile_photo && {
        profile_photo_or_logo: `/uploads/sellers/${req.files.profile_photo[0].filename}`,
      }),
    };

    // Remove empty fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined || updateData[key] === "") {
        delete updateData[key];
      }
    });

    // Validate we have at least one field to update
    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ error: "No valid fields provided for update" });
    }

    const updatedSeller = await updateSeller(req.params.id, updateData);
    res.json(updatedSeller);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      error: error.message || "Failed to update seller",
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
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
