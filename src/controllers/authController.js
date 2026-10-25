const authService = require("../services/authService");
const asyncHandler = require("../utils/asyncHandler");

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json(result);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { session, token } = await authService.loginUser(
    email,
    password,
    req.ip,
  );

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("sentinel_session", token, {
    httpOnly: true,
    secure: isProduction, // Must be true for sameSite: 'none' (HTTPS)
    sameSite: isProduction ? "none" : "lax", // 'none' allows cross-domain cookies on Render
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.status(200).json({ message: "Logged in", session });
});

exports.logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.session._id);
  res.clearCookie("sentinel_session");
  res.status(200).json({ message: "Logged out" });
});

exports.me = asyncHandler(async (req, res) => {
  res.status(200).json({ user: req.user, session: req.session });
});
