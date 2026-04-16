import { Request, Response, NextFunction } from "express";

export const responseTimeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = process.hrtime.bigint();

  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    res.setHeader("X-Response-Time", `${durationMs.toFixed(2)}ms`);

    const method = req.method;
    const url = req.originalUrl;

    let label = "✅";
    if (durationMs > 3000) label = "🔴 SLOW";
    else if (durationMs > 1000) label = "🟡 WARNING";

    console.log(
      `${label} [${method}] ${url} - ${res.statusCode} - ${durationMs.toFixed(2)}ms`
    );

    return originalJson(body);
  };

  next();
};
