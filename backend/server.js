import dns from "node:dns";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import scammerRoutes from "./routes/scammerRoutes.js";
import linkRoutes from "./routes/linkRoutes.js";
import { errorHandler } from "./middlewares/errorMiddleware.js";
import { setupSwagger } from "./swagger.js";

dotenv.config();

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();

// 1. Connect to Database directly
connectDB();

// 2. Middlewares
app.use(cors());
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
