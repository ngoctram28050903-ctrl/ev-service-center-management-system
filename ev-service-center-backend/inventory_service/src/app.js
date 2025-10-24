import express from "express";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import bodyParser from "body-parser";
import sequelize from "./config/db.js";
import partRoutes from "./routes/partRoutes.js";

dotenv.config();
const app = express();
app.use(bodyParser.json());

// Swagger setup 
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",   
    info: {
        title: `${process.env.SERVICE_NAME} API`,
        version: "1.0.0",
        description: `API documentation for ${process.env.SERVICE_NAME}`,
    },
    servers: [
        {
            url: `http://localhost:${process.env.PORT || 5004}`,
        },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));


app.use("/api/parts", partRoutes);

// DB sync
sequelize
  .sync()
  .then(() => console.log(`✅ ${process.env.SERVICE_NAME} DB connected`))
  .catch((err) => console.error("❌ DB connection error:", err));

export default app;
