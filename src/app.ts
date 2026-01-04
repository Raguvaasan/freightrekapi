import dotenv from "dotenv";
dotenv.config();
import express from "express";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import authRoutes from "./routes/admin";

const app = express();

app.use(express.json());

// Serve static files (for HTML page)
app.use(express.static(path.join(__dirname, '../public')));

// Swagger API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Freightrek API Docs'
}));

// API endpoint for JSON response
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Freightrek Server API",
    version: "1.0.0",
    documentation: "http://localhost:3000/api-docs",
    endpoints: {
      auth: {
        register: "POST /admin/auth/register",
        login: "POST /admin/auth/login"
      },
      role: "POST|GET|PUT|DELETE /admin/role",
      hub: "POST|GET|PUT|DELETE /admin/hub"
    },
    links: {
      "Swagger UI": "/api-docs",
      "Health Check": "/health"
    }
  });
});

// Root endpoint serves HTML page (removed old JSON response)
// The HTML file is served from public/index.html via express.static

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use("/admin", authRoutes);

export default app;
