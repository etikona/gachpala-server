import pool from "../db.js";
import { SubscriptionPlan } from "../models/subscriptionPlan.model.js";
import { UserSubscription } from "../models/userSubscription.model.js";
// Get all available subscription plans
export const getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll();
    res.json({ success: true, plans });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch subscription plans" });
  }
};

// Get current user's subscription
export const getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscription = await UserSubscription.findByUserId(userId);

    if (!subscription) {
      const freePlan = await SubscriptionPlan.findByName("free");
      return res.json({
        success: true,
        subscription: {
          plan_name: "free",
          image_limit: freePlan.image_limit,
          images_used: 0,
          status: "active",
        },
        canGenerate: true,
        imagesRemaining: freePlan.image_limit,
      });
    }

    const imagesRemaining = Math.max(
      0,
      subscription.image_limit - subscription.images_used
    );
    const canGenerate = imagesRemaining > 0 && subscription.status === "active";

    res.json({
      success: true,
      subscription,
      canGenerate,
      imagesRemaining,
    });
  } catch (error) {
    console.error("Error fetching current subscription:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch subscription" });
  }
};

// Subscribe to a plan
export const subscribeToPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.body;

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });
    }

    const existingSubscription = await UserSubscription.findByUserAndPlan(
      userId,
      planId
    );
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: "You already have an active subscription to this plan",
      });
    }

    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscription = await UserSubscription.create(
      userId,
      planId,
      periodStart,
      periodEnd
    );

    res.json({
      success: true,
      message: `Successfully subscribed to ${plan.name} plan`,
      subscription,
    });
  } catch (error) {
    console.error("Error subscribing to plan:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to subscribe to plan" });
  }
};

// Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscription = await UserSubscription.findByUserId(userId);

    if (!subscription) {
      return res
        .status(404)
        .json({ success: false, message: "No active subscription found" });
    }

    await UserSubscription.update(subscription.id, {
      status: "canceled",
    });

    res.json({ success: true, message: "Subscription canceled successfully" });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to cancel subscription" });
  }
};

// Track image generation
export const trackImageGeneration = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscription = await UserSubscription.findByUserId(userId);

    let imagesRemaining;

    if (!subscription || subscription.status !== "active") {
      const freePlan = await SubscriptionPlan.findByName("free");
      imagesRemaining = freePlan.image_limit;

      if (imagesRemaining <= 0) {
        return res.status(400).json({
          success: false,
          message: "Free image limit exceeded. Please upgrade your plan.",
        });
      }

      return res.json({
        success: true,
        message: "Image tracked for free user",
        imagesRemaining: imagesRemaining - 1,
      });
    }

    imagesRemaining = subscription.image_limit - subscription.images_used;

    if (imagesRemaining <= 0) {
      return res.status(400).json({
        success: false,
        message: "Image limit exceeded for current billing period",
      });
    }

    await UserSubscription.incrementImagesUsed(subscription.id);

    res.json({
      success: true,
      imagesRemaining: imagesRemaining - 1,
      message: "Image tracked successfully",
    });
  } catch (error) {
    console.error("Error tracking image generation:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to track image generation" });
  }
};

// !Admin: Get all subscriptions
export const getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await UserSubscription.findAll();
    res.json({ success: true, subscriptions });
  } catch (error) {
    console.error("Error fetching all subscriptions:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch subscriptions" });
  }
};

// Admin: Update a subscription
export const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const subscription = await UserSubscription.update(id, updates);
    res.json({ success: true, subscription });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update subscription" });
  }
};

// Admin: Get all plans
export const adminGetPlans = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM subscription_plans ORDER BY price"
    );
    res.json({ success: true, plans: result.rows });
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ success: false, message: "Failed to fetch plans" });
  }
};

// Admin: Create a new plan
export const adminCreatePlan = async (req, res) => {
  try {
    const { name, price, image_limit, description, is_active } = req.body;

    const plan = await SubscriptionPlan.create({
      name,
      price,
      image_limit,
      description,
      is_active,
    });

    res.json({ success: true, plan });
  } catch (error) {
    console.error("Error creating plan:", error);
    res.status(500).json({ success: false, message: "Failed to create plan" });
  }
};

// Admin: Update a plan
export const adminUpdatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const plan = await SubscriptionPlan.update(id, updates);
    res.json({ success: true, plan });
  } catch (error) {
    console.error("Error updating plan:", error);
    res.status(500).json({ success: false, message: "Failed to update plan" });
  }
};

// Admin: Delete a plan
export const adminDeletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.delete(id);

    res.json({ success: true, message: "Plan deleted successfully", plan });
  } catch (error) {
    console.error("Error deleting plan:", error);
    res.status(500).json({ success: false, message: "Failed to delete plan" });
  }
};

// Admin: Get subscription usage statistics
export const getSubscriptionStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        sp.id as plan_id,
        sp.name as plan_name,
        sp.price as plan_price,
        COUNT(us.id) as total_subscriptions,
        COUNT(CASE WHEN us.status = 'active' THEN 1 END) as active_subscriptions,
        COUNT(CASE WHEN us.status = 'canceled' THEN 1 END) as canceled_subscriptions,
        AVG(us.images_used) as avg_images_used
      FROM subscription_plans sp
      LEFT JOIN user_subscriptions us ON sp.id = us.plan_id
      GROUP BY sp.id, sp.name, sp.price
      ORDER BY sp.price
    `);

    res.json({ success: true, stats: stats.rows });
  } catch (error) {
    console.error("Error fetching subscription stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscription statistics",
    });
  }
};

// Admin: Reset user's image usage
export const adminResetImageUsage = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await UserSubscription.update(subscriptionId, {
      images_used: 0,
    });

    res.json({
      success: true,
      message: "Image usage reset successfully",
      subscription,
    });
  } catch (error) {
    console.error("Error resetting image usage:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to reset image usage" });
  }
};

// Get user's subscription history
export const getSubscriptionHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await pool.query(
      `
      SELECT us.*, sp.name as plan_name, sp.price, sp.image_limit
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = $1
      ORDER BY us.created_at DESC
    `,
      [userId]
    );

    res.json({ success: true, history: history.rows });
  } catch (error) {
    console.error("Error fetching subscription history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscription history",
    });
  }
};

// Upgrade subscription plan
export const upgradeSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newPlanId } = req.body;

    const currentSubscription = await UserSubscription.findByUserId(userId);
    const newPlan = await SubscriptionPlan.findById(newPlanId);

    if (!newPlan) {
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });
    }

    if (currentSubscription && currentSubscription.plan_id === newPlanId) {
      return res.status(400).json({
        success: false,
        message: "You are already subscribed to this plan",
      });
    }

    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // If user has an existing subscription, cancel it
    if (currentSubscription) {
      await UserSubscription.update(currentSubscription.id, {
        status: "canceled",
      });
    }

    // Create new subscription
    const newSubscription = await UserSubscription.create(
      userId,
      newPlanId,
      periodStart,
      periodEnd
    );

    res.json({
      success: true,
      message: `Successfully upgraded to ${newPlan.name} plan`,
      subscription: newSubscription,
    });
  } catch (error) {
    console.error("Error upgrading subscription:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to upgrade subscription" });
  }
};
// Check if user can generate image
export const checkImageGeneration = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscription = await UserSubscription.findByUserId(userId);

    if (!subscription || subscription.status !== "active") {
      const freePlan = await SubscriptionPlan.findByName("free");
      const canGenerate = freePlan.image_limit > 0;

      return res.json({
        success: true,
        canGenerate,
        message: canGenerate
          ? "Can generate images"
          : "Free image limit exceeded",
      });
    }

    const imagesRemaining = subscription.image_limit - subscription.images_used;
    const canGenerate = imagesRemaining > 0;

    res.json({
      success: true,
      canGenerate,
      imagesRemaining,
      message: canGenerate
        ? "Can generate images"
        : "Image limit exceeded for current billing period",
    });
  } catch (error) {
    console.error("Error checking image generation:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to check image generation" });
  }
};
