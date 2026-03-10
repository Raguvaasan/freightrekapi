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
const wallet_controller_1 = require("./controllers/wallet.controller");
const app = (0, express_1.default)();
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
app.use("/api/dashboard", dashboard_routes_1.default);
app.use("/api/careers", jobPosting_routes_1.default);
app.use("/api/applications", careerApplication_routes_1.default);
// Webhook endpoint (no auth, verified by signature)
app.post("/webhook/cashfree", wallet_controller_1.cashfreeWebhook);
exports.default = app;
