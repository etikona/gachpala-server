import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsBySellerId,
} from "../models/product.model.js";
import { getSellerById } from "../models/seller.model.js";
import { getRatingsForProduct } from "../models/rating.model.js";

export const addProduct = async (req, res) => {
  try {
    console.log("Request seller object:", req.seller);

    // Use the seller already set in middleware (no need to query again)
    const seller = req.seller;
    console.log("Using seller:", seller);

    // Check status instead of approved field
    if (!seller || seller.status !== "approved") {
      return res.status(403).json({
        msg:
          "Not an approved seller. Current status: " +
          (seller?.status || "unknown"),
      });
    }

    const { name, description, category, price, stock, image } = req.body;
    console.log("Product data:", {
      name,
      description,
      category,
      price,
      stock,
      image,
    });

    const product = await createProduct({
      seller_id: seller.id,
      name,
      description,
      category,
      price,
      stock,
      image,
    });

    res.status(201).json(product);
  } catch (err) {
    console.log("Error details:", err);
    res.status(500).json({ msg: "Error adding product", error: err.message });
  }
};

export const listProducts = async (req, res) => {
  try {
    const { search, category } = req.query;
    const products = await getProducts(search, category);
    res.json(products);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Error fetching products", error: err.message });
  }
};

export const getSellerProducts = async (req, res) => {
  try {
    const seller = req.seller;
    console.log(seller);
    if (!seller || seller.status !== "approved") {
      return res.status(403).json({
        msg:
          "Not an approved seller. Current status: " +
          (seller?.status || "unknown"),
      });
    }

    const { search, category } = req.query;
    const products = await getProductsBySellerId(seller.id, search, category);
    console.log(products);
    res.json(products);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Error fetching seller products", error: err.message });
  }
};

export const getProduct = async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching product", error: err.message });
  }
};

export const updateProductDetails = async (req, res) => {
  try {
    const seller = await getSellerById(req.seller.id); // This should work now
    if (!seller || seller.status !== "approved") {
      return res.status(403).json({ msg: "Not an approved seller" });
    }

    const { name, description, category, price, stock, image } = req.body;
    const updates = { name, description, category, price, stock, image };

    // Remove undefined fields
    Object.keys(updates).forEach(
      (key) => updates[key] === undefined && delete updates[key]
    );

    const product = await updateProduct(req.params.id, seller.id, updates);

    if (!product) {
      return res.status(404).json({
        msg: "Product not found or you don't have permission to update it",
      });
    }

    res.json(product);
  } catch (err) {
    console.log("Update error:", err);
    res.status(500).json({ msg: "Error updating product", error: err.message });
  }
};
export const removeProduct = async (req, res) => {
  try {
    const seller = await getSellerById(req.seller.id);
    if (!seller || !seller.approved) {
      return res.status(403).json({ msg: "Not an approved seller" });
    }

    const product = await deleteProduct(req.params.id, seller.id);

    if (!product) {
      return res.status(404).json({
        msg: "Product not found or you don't have permission to delete it",
      });
    }

    res.json({ msg: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting product", error: err.message });
  }
};

export const getProductRatings = async (req, res) => {
  try {
    const ratings = await getRatingsForProduct(req.params.productId);
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ msg: "Failed to get ratings", error: err.message });
  }
};
