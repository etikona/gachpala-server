import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsBySellerId,
} from "../models/product.model.js";
import { getSellerById } from "../models/seller.model.js";
import {
  getRatingsForProduct,
  getProductRatingStats,
} from "../models/rating.model.js";

export const addProduct = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);

    const seller = await getSellerById(req.seller.id);
    if (!seller || seller.status !== "approved") {
      return res.status(403).json({ msg: "Not an approved seller" });
    }

    // Extract ALL data from form-data (not just image)
    const { name, description, category, price, stock } = req.body;
    let image = "";

    // Handle file upload
    if (req.file) {
      image = `/uploads/products/${req.file.filename}`;
    }

    console.log("Extracted data:", {
      name,
      description,
      category,
      price,
      stock,
      image,
    });

    // Validate required fields
    if (!name || !category || !price || !stock) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    const product = await createProduct({
      seller_id: seller.id,
      name: name.trim(),
      description: description ? description.trim() : "",
      category: category.trim(),
      price: parseFloat(price),
      stock: parseInt(stock),
      image,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("Add product error:", err);
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

// In product.controller.js - add this to getProduct function
export const getProduct = async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    // Get rating statistics
    const ratingStats = await getProductRatingStats(req.params.id);

    // Add rating stats to product response
    const productWithStats = {
      ...product,
      rating_stats: {
        average_rating: parseFloat(ratingStats.average_rating) || 0,
        total_ratings: parseInt(ratingStats.total_ratings) || 0,
      },
    };

    res.json(productWithStats);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching product", error: err.message });
  }
};

export const updateProductDetails = async (req, res) => {
  try {
    const seller = await getSellerById(req.seller.id);
    if (!seller || seller.status !== "approved") {
      return res.status(403).json({ msg: "Not an approved seller" });
    }

    // Extract ALL data from form-data
    const { name, description, category, price, stock, existingImage } =
      req.body;
    let image = existingImage || "";

    // Handle file upload if new image is provided
    if (req.file) {
      image = `/uploads/products/${req.file.filename}`;
    }

    // Prepare updates object
    const updates = {};

    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (category !== undefined) updates.category = category.trim();
    if (price !== undefined) updates.price = parseFloat(price);
    if (stock !== undefined) updates.stock = parseInt(stock);
    if (image !== undefined) updates.image = image;

    // Check if there are any valid updates
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ msg: "No valid fields to update" });
    }

    const product = await updateProduct(req.params.id, seller.id, updates);

    if (!product) {
      return res.status(404).json({
        msg: "Product not found or you don't have permission to update it",
      });
    }

    res.json(product);
  } catch (err) {
    console.error("Update product error:", err);
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
