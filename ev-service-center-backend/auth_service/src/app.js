import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import cors from "cors";
import bodyParser from "body-parser";

import sequelize from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
app.use(express.json());

// Swagger config
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Auth Service API",
      version: "1.0.0",
      description: "Authentication & Authorization Service for EV System",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5001}`,
      },
    ],
  },
  apis: ["./src/routes/*.js"], // Đường dẫn đến các file có mô tả @swagger
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use("/api/auth", authRoutes);

app.use(cors());
app.use(bodyParser.json());

app.use("/", authRoutes);

sequelize.sync({ alter: true })
  .then(() => console.log(" Auth DB Connected and Synced"))
  .catch(err => console.error(" DB Connection Error:", err));

export default app;