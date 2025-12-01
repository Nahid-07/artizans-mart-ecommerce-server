import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";

configDotenv();

export const createToken = async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "365d",
  });

  res
    .cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    })
    .send({ success: true });
};

export const logoutUser = async (req, res) => {
  res
    .clearCookie("token", {
      maxAge: 0,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    })
    .send({ success: true });
};