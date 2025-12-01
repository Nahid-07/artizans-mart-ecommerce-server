import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";

configDotenv();

export const verifyToken = (req, res, next) => {
  const token = req.cookies?.token; // If using cookies
  // OR check headers if you prefer: const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};