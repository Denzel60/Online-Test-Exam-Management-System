// middleware/roles.middleware.js
export const teacherOnly = (req, res, next) => {
  if (req.user.role !== "teacher") {
    return res.status(403).json({ message: "Teacher access only" });
  }
  next();
};

export const studentOnly = (req, res, next) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ message: "Student access only" });
  }
  next();
};

export const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};

export const adminOrTeacher = (req, res, next) => {
  if (req.user.role === "admin" || req.user.role === "teacher") {
    return next();
  }
  return res.status(403).json({ message: "Access denied: Admins and Teachers only" });
};