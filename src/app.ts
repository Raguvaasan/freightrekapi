import dotenv from "dotenv";
dotenv.config();
import express from "express";
import path from "path";
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
import customerAuthRoutes from "./routes/customer/auth.routes";
import customerEmailAuthRoutes from "./routes/customer/emailAuth.routes";
import ltlShipmentRoutes from "./routes/ltlShipment.routes";
import hubOrderRoutes from "./routes/hub/order.routes";
import hubParcelOrderRoutes from "./routes/hub/parcelOrder.routes";
import hubStaffRoutes from "./routes/hub/hubStaff.routes";
import hubDashboardRoutes from "./routes/hub/dashboard.routes";
import hubRoleRoutes from "./routes/hub/hubRole.routes";
import hubManageStaffRoutes from "./routes/hub/hubManageStaff.routes";
import hubInvoiceRoutes from "./routes/hub/invoice.routes";
import b2bAuthRoutes from "./routes/b2b/auth.routes";
import b2bMarkupRoutes from "./routes/b2b/b2bMarkup.routes";
import { cashfreeWebhook } from "./controllers/wallet.controller";
import { delhiveryWebhook } from "./controllers/delhivery.webhook.controller";
import { pollDelhiveryStatuses } from "./services/delhivery.cron.service";
import { authMiddleware } from "./middleware/auth.middleware";
import { responseTimeMiddleware } from "./middleware/responseTime.middleware";

const app = express();

// CORS configuration for frontend API access
// Registered before any body parser so the headers are present even when a
// request fails early (malformed JSON, payload too large, etc.) — otherwise the
// browser reports a CORS error instead of the real status.
const configuredOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const allowAllOrigins = configuredOrigins.includes('*');

  if (requestOrigin && (allowAllOrigins || configuredOrigins.includes(requestOrigin))) {
    // Echo the origin (never '*') so credentialed requests are also accepted
    res.header('Access-Control-Allow-Origin', requestOrigin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Vary', 'Origin');
  } else if (allowAllOrigins) {
    res.header('Access-Control-Allow-Origin', '*');
  }

  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  // Reflect whatever the preflight asked for so custom headers don't fail
  const requestedHeaders = req.headers['access-control-request-headers'];
  res.header(
    'Access-Control-Allow-Headers',
    typeof requestedHeaders === 'string' && requestedHeaders
      ? requestedHeaders
      : 'Content-Type, Authorization'
  );
  res.header('Access-Control-Expose-Headers', 'X-Response-Time');
  res.header('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

app.use(responseTimeMiddleware);
app.use(express.json());

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
app.use("/api/ltl-shipment", ltlShipmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/careers", jobPostingRoutes);
app.use("/api/applications", careerApplicationRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/customer/auth", customerAuthRoutes);
app.use("/api/customer/email-auth", customerEmailAuthRoutes);
app.use("/hub/orders", hubOrderRoutes);
app.use("/hub/parcel-order", hubParcelOrderRoutes);
app.use("/hub/staff", hubStaffRoutes);
app.use("/hub/role", hubRoleRoutes);
app.use("/hub/manage/staff", hubManageStaffRoutes);
app.use("/hub/dashboard", hubDashboardRoutes);
// Read-only: the invoices for the parcels routed through this hub
app.use("/hub/invoice", hubInvoiceRoutes);
app.use("/b2b/auth", b2bAuthRoutes);
app.use("/b2b/markup", b2bMarkupRoutes);

// Mobile team markup routes (no /api prefix, proxy-friendly)
app.use("/v1/settings", markupRoutes);

// Webhook endpoint (no auth, verified by signature)
app.post("/webhook/cashfree", cashfreeWebhook);

// Delhivery webhook — receives shipment status updates (no auth, public endpoint)
app.post("/webhook/delhivery", delhiveryWebhook);

// Manual trigger to sync all active shipment statuses from Delhivery (admin use)
app.post("/admin/delhivery/sync-status", authMiddleware, async (req, res) => {
  try {
    const result = await pollDelhiveryStatuses();
    return res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default app;
