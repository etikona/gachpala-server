// sellerAuth.middleware.js
import jwt from "jsonwebtoken";
import { getSellerById } from "../models/seller.model.js";

const sellerAuth = async (req, res, next) => {
  try {
    console.log("Authorization header:", req.header("Authorization"));

    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      console.log("No token found");
      return res.status(401).json({ msg: "No token, authorization denied" });
    }

    console.log("Token received:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    // Extract seller ID based on your token structure
    const sellerId = decoded.id; // Your token has "id" directly
    console.log("Extracted seller ID:", sellerId);

    if (!sellerId) {
      return res
        .status(401)
        .json({ msg: "Invalid token structure - no seller ID found" });
    }

    // Check if the role is seller
    if (decoded.role !== "seller") {
      return res
        .status(403)
        .json({ msg: "Access denied. Seller role required." });
    }

    // Verify the seller exists and is approved
    const seller = await getSellerById(sellerId);
    console.log("Seller from DB:", seller);

    if (!seller) {
      return res.status(401).json({ msg: "Seller not found" });
    }

    // if (seller.status !== "approved") {
    //   return res.status(403).json({ msg: "Seller account not approved" });
    // }

    req.seller = seller;
    console.log("Seller set on request:", req.seller);
    next();
  } catch (err) {
    console.log("Auth error:", err.message);
    res.status(401).json({ msg: "Token is not valid" });
  }
};

export default sellerAuth;
