export function getRequiredDatabaseUrl(env: NodeJS.ProcessEnv = process.env) {
  const value = env.DATABASE_URL?.trim();

  if (!value) {
    throw new Error("DATABASE_URL is required for database operations.");
  }

  return value;
}
