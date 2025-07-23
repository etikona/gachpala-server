// controllers/adminUser.controller.js
import {
  getUserById,
  updateUser,
  deleteUser,
  getUserOrders,
} from "../models/user.model.js";

export const getUserProfile = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to get user profile", error: err.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const updatedUser = await updateUser(req.params.id, req.body);
    if (!updatedUser) return res.status(404).json({ msg: "User not found" });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ msg: "Failed to update user", error: err.message });
  }
};

export const suspendUserAccount = async (req, res) => {
  try {
    const updatedUser = await updateUser(req.params.id, {
      status: "suspended",
    });
    if (!updatedUser) return res.status(404).json({ msg: "User not found" });
    res.json({ ...updatedUser, msg: "Account suspended successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to suspend user", error: err.message });
  }
};

export const deleteUserAccount = async (req, res) => {
  try {
    await deleteUser(req.params.id);
    res.json({ msg: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to delete user", error: err.message });
  }
};

export const getUserOrderHistory = async (req, res) => {
  try {
    const orders = await getUserOrders(req.params.id);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ msg: "Failed to get orders", error: err.message });
  }
};
