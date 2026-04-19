import { Request, Response } from "express";
import User from "../models/User.js";
import { BlacklistedToken } from "../models/BlacklistedToken.js";

/**
 * @desc    User Register
 * @route   POST api/auth/register
 * @access  Public
 */
export const registerController = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Account already exist. Use different email!",
      });
    }

    const hashedPassword = await User.hashPassword(password);

    // Create new user
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      errors: err.message,
    });
  }
};

/**
 * @desc    User Login
 * @route   POST api/auth/login
 * @access  Public
 */
export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required",
      });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await user.isValidPassword(password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = await user.generateJWT();

    const userObj = user.toObject();
    const { password: userPassword, ...userWithoutPassword } = userObj;

    res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
      message: "Login successful",
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Login failed",
      errors: err.message,
    });
  }
};

/**
 * @desc    Get User
 * @route   GET api/auth/profile
 * @access  Private
 */
export const ProfileController = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const profile = await User.findOne({ _id: req.user }).select("-password");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
      message: "Profile retrieved successfully",
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Profile retrieval failed",
      errors: err.message,
    });
  }
};

/**
 * @desc    Logout User
 * @route   POST api/auth/logOut
 * @access  Private
 */
export const logoutController = async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ _id: req.user });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const blacklistedToken = new BlacklistedToken({ token });
    await blacklistedToken.save();

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Logout failed",
      errors: err.message,
    });
  }
};
