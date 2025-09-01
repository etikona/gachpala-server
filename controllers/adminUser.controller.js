// controllers/adminUser.controller.js
import {
  // getUserById,
  updateUser,
  deleteUser,
  getUserOrders,
  getAllUsers,
  getTotalUsersCount,
  getUserStats,
  getUserById,
} from "../models/user.model.js";

// import UserModel from "../models/user.model.js";

export const getUserProfile = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User is missing" });
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
    const updatedUser = await UserModel.update(req.params.id, {
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

export const getUsersList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const users = await getAllUsers(page, limit);
    const totalUsers = await getTotalUsersCount();

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
      },
    });
  } catch (err) {
    res.status(500).json({ msg: "Failed to get users", error: err.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const stats = await getUserStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ msg: "Failed to get stats", error: err.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const newStatus = user.status === "active" ? "suspended" : "active";
    const updatedUser = await updateUser(req.params.id, { status: newStatus });

    res.json({
      ...updatedUser,
      msg: `Account ${
        newStatus === "suspended" ? "suspended" : "activated"
      } successfully`,
    });
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to update status", error: err.message });
  }
};
