function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const env = {
  port: process.env.PORT ?? "3000",
  apiKey: requireEnv("API_KEY"),
  logLevel: process.env.LOG_LEVEL ?? "info",
};
