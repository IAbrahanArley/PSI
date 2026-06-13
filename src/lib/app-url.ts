/**
 * Resolve a URL base da aplicação a partir do ambiente ou dos headers da request.
 * Prioridade: APP_BASE_URL > x-forwarded-host > host > localhost:3000.
 */
export function resolveAppBaseUrl(req: Request): string {
  const envBase = process.env.APP_BASE_URL?.trim();
  if (envBase) return envBase.replace(/\/+$/, "");

  const headerHost = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const headerProto = req.headers.get("x-forwarded-proto") ?? "http";
  if (headerHost) return `${headerProto}://${headerHost}`;

  return "http://localhost:3000";
}
