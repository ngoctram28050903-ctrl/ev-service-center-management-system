import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import sequelize from "./config/db.js";
import partRoutes from "./routes/partRoutes.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api/inventory/parts", partRoutes);

sequelize.sync().then(() => console.log("✅ Inventory DB synced"));

export default app;
