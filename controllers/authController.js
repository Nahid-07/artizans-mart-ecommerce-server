import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";

configDotenv();

export const createToken = async (req, res) => {
  const user = req.body;

  // Create a token
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h", // Token expires in 1 hour
  });

  // Send token as a cookie
  res
    .cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Set to true in production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    })
    .send({ success: true });
};

export const logoutUser = async (req, res) => {
  res
    .clearCookie("token", {
      maxAge: 0,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    })
    .send({ success: true });
};
