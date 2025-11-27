import express from "express";
import connectDB from "../config/db.js";
import authRoutes from "../routes/auth.routes.js";
import fileRoutes from "../routes/file.routes.js";

const app = express();

app.use(express.json());
connectDB();

const PORT = 3000 || process.env.PORT;

app.use("/auth", authRoutes);
app.use("/files", fileRoutes);

app.get("/", (req, res) => {
  res.send("API IS RUNNING :) ");
});

app.listen(PORT, () => {
  console.log(`Server running on Port ${PORT}`);
});
