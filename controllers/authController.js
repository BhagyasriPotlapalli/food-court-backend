import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import catchAsync from "../utils/catchAsync.js";

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  const user = await User.findOne({ where: { username } });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    return next(error);
  }

  if (!user.isActive) {
    const error = new Error("Account is deactivated");
    error.statusCode = 403;
    return next(error);
  }

  const passwordIsValid = await bcrypt.compare(password, user.password);

  if (!passwordIsValid) {
    const error = new Error("Invalid password");
    error.statusCode = 401;
    return next(error);
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "24h" },
  );

  res.status(200).json({
    id: user.id,
    username: user.username,
    role: user.role,
    accessToken: token,
  });
});

// @desc    Register initial admin (helper)
// @route   POST /api/auth/register-admin
// @access  Public (should be disabled in prod)
export const registerAdmin = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  // Check if admin already exists to prevent multiple admins
  const existingAdmin = await User.findOne({ where: { role: "Admin" } });
  if (existingAdmin) {
    const error = new Error(
      "An admin already exists. Cannot register another.",
    );
    error.statusCode = 400;
    return next(error);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = await User.create({
    username,
    password: hashedPassword,
    role: "Admin",
    isActive: true,
  });

  res
    .status(201)
    .json({ message: "Admin registered successfully", id: admin.id });
});
