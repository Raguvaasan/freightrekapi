import dotenv from "dotenv";
dotenv.config();
import express from "express";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import authRoutes from "./routes/admin";
import locationRoutes from "./routes/location.routes";
import markupRoutes from "./routes/markup.routes";
import walletRoutes from "./routes/wallet.routes";
import shipmentRoutes from "./routes/shipment.routes";
import franchiseRoleRoutes from "./routes/admin/franchiseRole.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import adminDashboardRoutes from "./routes/admin/dashboard.routes";
import adminReportsRoutes from "./routes/admin/reports.routes";
import jobPostingRoutes from "./routes/jobPosting.routes";
import careerApplicationRoutes from "./routes/careerApplication.routes";
import customerRoutes from "./routes/customer/customer.routes";
import { cashfreeWebhook } from "./controllers/wallet.controller";

const app = express();

app.use(express.json());

// CORS configuration for frontend API access
const configuredOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const allowAllOrigins = configuredOrigins.includes('*');

  if (allowAllOrigins) {
    res.header('Access-Control-Allow-Origin', '*');
  } else if (requestOrigin && configuredOrigins.includes(requestOrigin)) {
    res.header('Access-Control-Allow-Origin', requestOrigin);
    res.header('Vary', 'Origin');
  }

  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

// Serve static files (for HTML page)
app.use(express.static(path.join(__dirname, '../public')));

// Serve swagger spec as JSON (from pre-generated static file)
app.get("/api-docs.json", (req, res) => {
  res.sendFile(path.join(__dirname, '../public/swagger.json'));
});

// Swagger UI with CDN assets for serverless compatibility
app.get("/api-docs", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Freightrek API Docs</title>
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; padding: 0; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "/api-docs.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>
  `);
});

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
app.use("/admin/franchise/role", franchiseRoleRoutes);
app.use("/admin/dashboard", adminDashboardRoutes);
app.use("/admin/reports", adminReportsRoutes);
app.use("/location", locationRoutes);
app.use("/api/v1/settings", markupRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/shipment", shipmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/careers", jobPostingRoutes);
app.use("/api/applications", careerApplicationRoutes);
app.use("/api/customers", customerRoutes);

// Webhook endpoint (no auth, verified by signature)
app.post("/webhook/cashfree", cashfreeWebhook);

export default app;
