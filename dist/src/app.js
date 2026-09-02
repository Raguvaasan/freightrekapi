"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const admin_1 = __importDefault(require("./routes/admin"));
const location_routes_1 = __importDefault(require("./routes/location.routes"));
const markup_routes_1 = __importDefault(require("./routes/markup.routes"));
const wallet_routes_1 = __importDefault(require("./routes/wallet.routes"));
const shipment_routes_1 = __importDefault(require("./routes/shipment.routes"));
const franchiseRole_routes_1 = __importDefault(require("./routes/admin/franchiseRole.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const dashboard_routes_2 = __importDefault(require("./routes/admin/dashboard.routes"));
const reports_routes_1 = __importDefault(require("./routes/admin/reports.routes"));
const jobPosting_routes_1 = __importDefault(require("./routes/jobPosting.routes"));
const careerApplication_routes_1 = __importDefault(require("./routes/careerApplication.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer/customer.routes"));
const auth_routes_1 = __importDefault(require("./routes/customer/auth.routes"));
const emailAuth_routes_1 = __importDefault(require("./routes/customer/emailAuth.routes"));
const ltlShipment_routes_1 = __importDefault(require("./routes/ltlShipment.routes"));
const order_routes_1 = __importDefault(require("./routes/hub/order.routes"));
const parcelOrder_routes_1 = __importDefault(require("./routes/hub/parcelOrder.routes"));
const hubStaff_routes_1 = __importDefault(require("./routes/hub/hubStaff.routes"));
const dashboard_routes_3 = __importDefault(require("./routes/hub/dashboard.routes"));
const hubRole_routes_1 = __importDefault(require("./routes/hub/hubRole.routes"));
const hubManageStaff_routes_1 = __importDefault(require("./routes/hub/hubManageStaff.routes"));
const invoice_routes_1 = __importDefault(require("./routes/hub/invoice.routes"));
const auth_routes_2 = __importDefault(require("./routes/b2b/auth.routes"));
const vehicle_routes_1 = __importDefault(require("./routes/b2b/vehicle.routes"));
const order_routes_2 = __importDefault(require("./routes/b2b/order.routes"));
const b2bOrder_routes_1 = __importDefault(require("./routes/admin/b2bOrder.routes"));
const b2bMarkup_routes_1 = __importDefault(require("./routes/b2b/b2bMarkup.routes"));
const wallet_controller_1 = require("./controllers/wallet.controller");
const delhivery_webhook_controller_1 = require("./controllers/delhivery.webhook.controller");
const delhivery_cron_service_1 = require("./services/delhivery.cron.service");
const auth_middleware_1 = require("./middleware/auth.middleware");
const responseTime_middleware_1 = require("./middleware/responseTime.middleware");
const app = (0, express_1.default)();
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
    }
    else if (allowAllOrigins) {
        res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    // Reflect whatever the preflight asked for so custom headers don't fail
    const requestedHeaders = req.headers['access-control-request-headers'];
    res.header('Access-Control-Allow-Headers', typeof requestedHeaders === 'string' && requestedHeaders
        ? requestedHeaders
        : 'Content-Type, Authorization');
    res.header('Access-Control-Expose-Headers', 'X-Response-Time');
    res.header('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    return next();
});
app.use(responseTime_middleware_1.responseTimeMiddleware);
app.use(express_1.default.json());
// Serve static files (for HTML page)
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Serve swagger spec as JSON (from pre-generated static file)
app.get("/api-docs.json", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/swagger.json'));
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
app.use("/admin", admin_1.default);
app.use("/admin/franchise/role", franchiseRole_routes_1.default);
app.use("/admin/dashboard", dashboard_routes_2.default);
app.use("/admin/reports", reports_routes_1.default);
app.use("/location", location_routes_1.default);
app.use("/api/v1/settings", markup_routes_1.default);
app.use("/api/wallet", wallet_routes_1.default);
app.use("/api/shipment", shipment_routes_1.default);
app.use("/api/ltl-shipment", ltlShipment_routes_1.default);
app.use("/api/dashboard", dashboard_routes_1.default);
app.use("/api/careers", jobPosting_routes_1.default);
app.use("/api/applications", careerApplication_routes_1.default);
app.use("/api/customers", customer_routes_1.default);
app.use("/api/customer/auth", auth_routes_1.default);
app.use("/api/customer/email-auth", emailAuth_routes_1.default);
app.use("/hub/orders", order_routes_1.default);
app.use("/hub/parcel-order", parcelOrder_routes_1.default);
app.use("/hub/staff", hubStaff_routes_1.default);
app.use("/hub/role", hubRole_routes_1.default);
app.use("/hub/manage/staff", hubManageStaff_routes_1.default);
app.use("/hub/dashboard", dashboard_routes_3.default);
// Read-only: the invoices for the parcels routed through this hub
app.use("/hub/invoice", invoice_routes_1.default);
app.use("/b2b/auth", auth_routes_2.default);
app.use("/b2b/vehicles", vehicle_routes_1.default);
app.use("/b2b/orders", order_routes_2.default);
app.use("/admin/b2b/orders", b2bOrder_routes_1.default);
app.use("/b2b/markup", b2bMarkup_routes_1.default);
// Mobile team markup routes (no /api prefix, proxy-friendly)
app.use("/v1/settings", markup_routes_1.default);
// Webhook endpoint (no auth, verified by signature)
app.post("/webhook/cashfree", wallet_controller_1.cashfreeWebhook);
// Delhivery webhook — receives shipment status updates (no auth, public endpoint)
app.post("/webhook/delhivery", delhivery_webhook_controller_1.delhiveryWebhook);
// Manual trigger to sync all active shipment statuses from Delhivery (admin use)
app.post("/admin/delhivery/sync-status", auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const result = await (0, delhivery_cron_service_1.pollDelhiveryStatuses)();
        return res.status(200).json({ success: true, data: result });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});
exports.default = app;
