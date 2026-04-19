import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { BlacklistedToken } from "../models/BlacklistedToken.js";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          error: "Not authorized, token missing",
          statusCode: 401,
        });
      }
      
      const  tokenExists = await BlacklistedToken.findOne({ token });
      
      if (tokenExists) {
        return res.status(401).json({
          success: false,
          error: "Not authorized, token is blacklisted",
          statusCode: 401,
        });
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!,
      ) as jwt.JwtPayload;

      if (!decoded || typeof decoded === "string" || !decoded._id) {
        return res.status(400).json({
          success: false,
          message: "Not authorized token!",
        });
      }

      req.user = decoded._id as string;

      return next();
    } catch (err: any) {
      console.log(err);
      console.error("Auth middleware error:", err.message);
    
      return res.status(401).json({
        success: false,
        error: "Not authorized, token failed",
        statusCode: 401,
      });
    }
  }
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Not authorized, no token",
      statusCode: 401,
    });
  }
};

export default protect;
