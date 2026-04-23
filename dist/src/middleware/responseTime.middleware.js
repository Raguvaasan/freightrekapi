"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseTimeMiddleware = void 0;
const responseTimeMiddleware = (req, res, next) => {
    const start = process.hrtime.bigint();
    const originalJson = res.json.bind(res);
    res.json = function (body) {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1000000;
        res.setHeader("X-Response-Time", `${durationMs.toFixed(2)}ms`);
        const method = req.method;
        const url = req.originalUrl;
        let label = "✅";
        if (durationMs > 3000)
            label = "🔴 SLOW";
        else if (durationMs > 1000)
            label = "🟡 WARNING";
        console.log(`${label} [${method}] ${url} - ${res.statusCode} - ${durationMs.toFixed(2)}ms`);
        return originalJson(body);
    };
    next();
};
exports.responseTimeMiddleware = responseTimeMiddleware;
