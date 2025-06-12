import { createSeller, getSellerByUserId } from "../models/seller.model.js";

export const registerBusiness = async (req, res) => {
  try {
    const { businessName } = req.body;
    const seller = await createSeller({ userId: req.user.id, businessName });
    res.status(201).json(seller);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Seller registration failed", error: err.message });
  }
};

export const getSellerProfile = async (req, res) => {
  try {
    const seller = await getSellerByUserId(req.user.id);
    res.json(seller);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to get seller profile", error: err.message });
  }
};
