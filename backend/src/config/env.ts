export interface AppEnv {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  corsOrigin: string;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  maxAttachmentBytes: number;
  positionRebalanceThreshold: number;
}

const REQUIRED = ["MONGO_URI", "JWT_SECRET"] as const;

function toInt(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`);
  }
  return parsed;
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const missing = REQUIRED.filter((key) => !source[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  if ((source.JWT_SECRET as string).length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }
  return {
    nodeEnv: source.NODE_ENV ?? "development",
    port: toInt(source.PORT, 4000, "PORT"),
    apiPrefix: source.API_PREFIX ?? "api/v1",
    corsOrigin: source.CORS_ORIGIN ?? "http://localhost:3000",
    mongoUri: source.MONGO_URI as string,
    jwtSecret: source.JWT_SECRET as string,
    jwtExpiresIn: source.JWT_EXPIRES_IN ?? "7d",
    bcryptRounds: toInt(source.BCRYPT_ROUNDS, 10, "BCRYPT_ROUNDS"),
    maxAttachmentBytes: toInt(source.MAX_ATTACHMENT_BYTES, 10 * 1024 * 1024, "MAX_ATTACHMENT_BYTES"),
    positionRebalanceThreshold: toInt(source.POSITION_REBALANCE_THRESHOLD, 48, "POSITION_REBALANCE_THRESHOLD")
  };
}
