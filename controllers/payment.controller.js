// import { getPaymentsForSeller } from "../models/payment.model.js";
// import { getSellerByUserId } from "../models/seller.model.js";

// export const sellerPayments = async (req, res) => {
//   try {
//     const seller = await getSellerByUserId(req.user.id);
//     if (!seller) return res.status(403).json({ msg: "Not a seller" });

//     const payments = await getPaymentsForSeller(seller.id);
//     res.json(payments);
//   } catch (err) {
//     res.status(500).json({ msg: "Failed to get payments", error: err.message });
//   }
// };
