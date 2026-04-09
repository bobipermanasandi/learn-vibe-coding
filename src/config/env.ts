const getOptionalEnv = (key: string) => process.env[key];

const getOptionalNumber = (key: string) => {
  const raw = process.env[key];
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Invalid number for env: ${key}`);
  return n;
};

export const env = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
  DATABASE_HOST: getOptionalEnv("DATABASE_HOST"),
  DATABASE_PORT: getOptionalNumber("DATABASE_PORT"),
  DATABASE_USER: getOptionalEnv("DATABASE_USER"),
  DATABASE_PASSWORD: getOptionalEnv("DATABASE_PASSWORD"),
  DATABASE_NAME: getOptionalEnv("DATABASE_NAME"),
};

