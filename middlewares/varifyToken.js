import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";

configDotenv();

export const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
 
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