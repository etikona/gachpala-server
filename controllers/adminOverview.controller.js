import {
  getOverviewStats,
  getMonthlyRevenue,
  getDailyActiveUsers,
  getPerformanceMetrics,
  getRecentActivity,
} from "../models/overview.model.js";

export const getDashboardOverview = async (req, res) => {
  try {
    const stats = await getOverviewStats();
    res.json(stats);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to get overview stats", error: err.message });
  }
};

export const getRevenueOverview = async (req, res) => {
  try {
    const revenueData = await getMonthlyRevenue();
    res.json(revenueData);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to get revenue overview", error: err.message });
  }
};

export const getUserActivityData = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const userActivity = await getDailyActiveUsers(parseInt(days));
    res.json(userActivity);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to get user activity", error: err.message });
  }
};

export const getPerformanceData = async (req, res) => {
  try {
    const metrics = await getPerformanceMetrics();
    res.json(metrics);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to get performance metrics", error: err.message });
  }
};

export const getRecentActivities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const activities = await getRecentActivity(parseInt(limit));
    res.json(activities);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to get recent activities", error: err.message });
  }
};

// Get all overview data in one endpoint
export const getCompleteOverview = async (req, res) => {
  try {
    const [stats, revenueData, userActivity, metrics, activities] =
      await Promise.all([
        getOverviewStats(),
        getMonthlyRevenue(),
        getDailyActiveUsers(30),
        getPerformanceMetrics(),
        getRecentActivity(10),
      ]);

    res.json({
      stats,
      revenueData,
      userActivity,
      metrics,
      activities,
    });
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to get complete overview", error: err.message });
  }
};
