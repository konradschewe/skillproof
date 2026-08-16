export const config = {
  port: Number(process.env.PORT ?? "3000"),
  apiKey: process.env.API_KEY ?? "",
  logLevel: process.env.LOG_LEVEL ?? "info",
};
