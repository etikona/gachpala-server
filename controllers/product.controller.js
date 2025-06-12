import { createProduct, getProducts } from "../models/product.model.js";
import { getSellerByUserId } from "../models/seller.model.js";
import { getRatingsForProduct } from "../models/rating.model.js";

export const addProduct = async (req, res) => {
  try {
    const seller = await getSellerByUserId(req.user.id);
    if (!seller || !seller.approved)
      return res.status(403).json({ msg: "Not an approved seller" });

    const { name, description, category, price, stock } = req.body;
    const product = await createProduct({
      sellerId: seller.id,
      name,
      description,
      category,
      price,
      stock,
    });

    res.status(201).json(product);
  } catch (err) {
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

export const getProductRatings = async (req, res) => {
  try {
    const ratings = await getRatingsForProduct(req.params.productId);
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ msg: "Failed to get ratings", error: err.message });
  }
};
