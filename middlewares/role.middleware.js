const role = (allowedRoles) => {
  return (req, res, next) => {
    console.log("Role middleware - User role:", req.user?.role); // Debug log
    console.log("Allowed roles:", allowedRoles); // Debug log

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. User not authenticated.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

export default role;
