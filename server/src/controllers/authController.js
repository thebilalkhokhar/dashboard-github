const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

// Dummy hash for constant-time comparison when user doesn't exist
const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuvwxyzABCDEF";

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. User lookup (explicitly requesting password due to select: false)
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );

    // 3. Password comparison (Constant-time protection against timing attacks)
    const passwordMatch = await bcrypt.compare(
      password,
      user ? user.password : DUMMY_HASH,
    );

    if (!user || !passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 4. Update lastLoginAt asynchronously without blocking response
    User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() })
      .exec()
      .catch((err) => {
        console.error("Failed to update lastLoginAt:", err);
      });

    // 5. Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "8h",
      },
    );

    // 6. Return response
    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred",
    });
  }
};

module.exports = {
  login,
};
