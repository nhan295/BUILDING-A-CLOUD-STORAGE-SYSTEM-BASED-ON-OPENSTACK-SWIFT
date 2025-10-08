import dotenv from "dotenv";
dotenv.config();

export const SWIFT_CONFIG = {
  authUrl: process.env.SWIFT_AUTH_URL,
  user: process.env.ST_USER,
  key: process.env.ST_KEY,
};
