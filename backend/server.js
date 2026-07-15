import dns from "node:dns";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import scammerRoutes from "./routes/scammerRoutes.js";
import linkRoutes from "./routes/linkRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { errorHandler } from "./middlewares/errorMiddleware.js";
import { setupSwagger } from "./swagger.js";

dotenv.config();

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();

// 1. Connect to Database directly
connectDB();

// 2. Middlewares
// // app.use(cors());
app.use(cors({
  origin: true,
  credentials: true
}));

// app.use(cors({
//     origin: function (origin, callback) {
//         callback(null, true);
//     },
//     credentials: true
// }));

// Global Rate Limiter: 500 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    error: "Too Many Requests",
    message: "You have exceeded the request limit. Please try again after 15 minutes."
  }
});
app.use(limiter);

app.use(express.json());

// 3. Test Route
app.get("/", (req, res) => {
  res.json({ message: "Gaming Marketplace API is running on Vercel" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/scammers", scammerRoutes);
app.use("/api/links", linkRoutes);
app.use("/api/chat", chatRoutes);

// Setup Swagger Documentation
setupSwagger(app);

// 4. Error Handler
app.use(errorHandler);

// 5. Local Development Server (Vercel will ignore this block)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// 6. Export for Vercel Serverless
export default app;
