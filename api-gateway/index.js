import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));

const proxyTo = (target) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    proxyTimeout: 30000,
    timeout: 30000,
    logLevel: "warn",
    onProxyReq: (proxyReq, req, res) => {
      // Forward body nếu có
      if (req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
  });

// Mapping các service
app.use("/api/auth", proxyTo("http://auth-service:5001"));
app.use("/api/booking", proxyTo("http://booking-service:5002"));
app.use("/api/service-center", proxyTo("http://booking-service:5002"));

app.use("/api/finance", proxyTo("http://finance-service:5003"));
app.use("/api/invoice", proxyTo("http://finance-service:5003"));

app.use("/api/inventory", proxyTo("http://inventory-service:5004"));

app.use("/api/notification", proxyTo("http://notification-service:5005"));
app.use("/api/vehicle", proxyTo("http://vehicle-service:5006"));

app.use("/api/workorder", proxyTo("http://workorder-service:5007"));
app.use("/api/chat", proxyTo("http://chat-service:5008"));

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => console.log(`🚀 API Gateway running on port ${PORT}`));
