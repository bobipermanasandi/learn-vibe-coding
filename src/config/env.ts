const getOptionalEnv = (key: string) => process.env[key];

export const env = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
  DATABASE_URL: getOptionalEnv("DATABASE_URL"),
};

