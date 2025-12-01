import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";

configDotenv();

export const createToken = async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "365d",
  });
  res.send({ success: true, token });
};

export const logoutUser = async (req, res) => {
  res.send({ success: true });
};
