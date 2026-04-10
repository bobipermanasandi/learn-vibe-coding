const getOptionalEnv = (key: string) => process.env[key];

const getOptionalNumber = (key: string) => {
  const raw = process.env[key];
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Invalid number for env: ${key}`);
  return n;
};

const getPort = () => {
  const raw = process.env.PORT;
  if (!raw) return 3000;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1 || n > 65535) {
    throw new Error("PORT must be a number between 1 and 65535");
  }
  return n;
};

export const env = {
  PORT: getPort(),
  DATABASE_HOST: getOptionalEnv("DATABASE_HOST"),
  DATABASE_PORT: getOptionalNumber("DATABASE_PORT"),
  DATABASE_USER: getOptionalEnv("DATABASE_USER"),
  DATABASE_PASSWORD: getOptionalEnv("DATABASE_PASSWORD"),
  DATABASE_NAME: getOptionalEnv("DATABASE_NAME"),
};

