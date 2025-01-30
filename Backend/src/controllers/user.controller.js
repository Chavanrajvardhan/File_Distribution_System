import asyncHandler from "../utils/asyncHandler.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import connectDB from "../db/db.js";
import bcrypt from "bcryptjs";

const generateAccessTokenAndRefreshToken = async (user_id) => {
  try {
    const db = await connectDB();
    const [rows] = await db.query("SELECT * FROM users WHERE user_id = ?", [
      user_id,
    ]);

    const user = rows[0];
    if (!user) {
      return null;
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await db.query("UPDATE users SET refresh_token = ? WHERE user_id = ?", [
      refreshToken,
      user.user_id,
    ]);

    return { accessToken, refreshToken };
  } catch (error) {
    console.error(error);
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const db = await connectDB();

  let {
    first_name,
    middle_name,
    last_name,
    email,
    password,
    role,
    center_id,
    pc_id,
  } = req.body;

  if (
    [
      first_name,
      middle_name,
      last_name,
      email,
      password,
      role,
      center_id,
      pc_id,
    ].some((field) => field.trim() === "")
  ) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  const capitalize = (str) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  first_name = capitalize(first_name.trim());
  middle_name = capitalize(middle_name.trim());
  last_name = capitalize(last_name.trim());
  role = role.trim().toLowerCase();

  const [existedUser] = await db.query("SELECT * FROM users WHERE  email = ?", [
    email,
  ]);

  if (existedUser.length > 0) {
    return res.status(400).json({
      success: false,
      message: "user with email already exists",
    });
  }

  const saltRound = 10;
  const hash_password = await bcrypt.hash(password, saltRound);

  const created_at = new Date().toISOString();
  const updated_at = new Date().toISOString();

  const [user] = await db.query(
    "INSERT INTO users (first_name, middle_name, last_name, email, password, role, center_id, pc_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      first_name,
      middle_name,
      last_name,
      email,
      hash_password,
      role,
      center_id,
      pc_id,
      created_at,
      updated_at,
    ]
  );

  if (!user) {
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Something went wrong while registering the user",
    });
  }

  return res.status(200).json({
    status: 200,
    success: true,
    data: {
      first_name,
      middle_name,
      last_name,
      email,
      hash_password,
      role,
      center_id,
      pc_id,
    },
    message: "User registerd Successfully",
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const db = await connectDB();
  const { email, password } = req.body;

  if (!(email && password)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "All Fields are required",
    });
  }

  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  const user = rows[0];
  if (!user) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "Incorect Email",
    });
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "Incorect Password",
    });
  }

  //genrate accessToken and refreshToken
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user.user_id);

  const [result] = await db.query(
    "SELECT user_id, first_name, middle_name, last_name, email, role, pc_id, center_id, created_at, updated_at from users WHERE user_id = ?",
    [user?.user_id]
  );

  const newLogedInUser = result[0];

    const accessTokenOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict', // Prevents the cookie from being sent with cross-site requests
        maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    };
    
    // Options for refreshToken
    const refreshTokenOptions = {
        ...accessTokenOptions, // Inherits other properties
        maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days in milliseconds
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, accessTokenOptions)
        .cookie("refreshToken", refreshToken, refreshTokenOptions)
        .json({
            status: 200,
            success: true,
            data: {
            newLogedInUser
            },
            message: "user logged in Successfully"
        })
})

const logoutUser = asyncHandler(async (req, res) => {
  const db = await connectDB();
  const userId = req.user.user_id;

  const [rows] = await db.query(
    "UPDATE users SET refresh_token = NULL WHERE user_id = ?",
    [userId]
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({
      status: 200,
      success: true,
      message: "User Logged out successfully",
    });
});

export { registerUser, loginUser, logoutUser };
