import express from "express";
import bodyParser from "body-parser";
import sequelize from "./config/db.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";

const app = express();
app.use(bodyParser.json());

app.use("/api/finance", invoiceRoutes);
app.use("/api/invoice", invoiceRoutes);

sequelize.sync().then(() => console.log("✅ Finance DB synced"));

export default app;
