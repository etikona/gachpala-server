import { addRating } from "../models/ratingModel";

export const rateProduct = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const productId = req.params.productId;
    const userId = req.user.id;

    const result = await addRating({ userId, productId, rating, review });
    res.status(201).json(result);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Error submitting rating", error: err.message });
  }
};
