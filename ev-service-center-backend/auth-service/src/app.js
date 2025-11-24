import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import sequelize from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();


app.use(cors());
app.use(bodyParser.json());

app.use("/api/auth", authRoutes);

sequelize.sync()
  .then(() => console.log(" Database synced"))
  .catch(err => console.error(" Sync error:", err));

export default app;
