import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const SESSION_SECRET = process.env.SESSION_SECRET || "nbc-secret-key-1234567890";
