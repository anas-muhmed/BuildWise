// lib/backend/config.ts
/**
 * Environment variable validation and configuration
 * Fails fast on startup if required variables are missing
 */

interface Config {
  // Database
  databaseUrl: string;
  mongodbUri: string;

  // Authentication
  jwtSecret: string;
  jwtIssuer: string;
  jwtExpiresIn: string;

  // Application
  nodeEnv: string;
  port: number;
  appUrl: string;

  // Features
  setupMode: boolean;
  setupSecret?: string;

  // Optional
  sentryDsn?: string;
  logLevel: string;
}

function getConfig(): Config {
  return {
    databaseUrl: process.env.DATABASE_URL || "",
    mongodbUri: process.env.MONGODB_URI || "",
    jwtSecret: process.env.JWT_SECRET || "default-secret-for-development",
    jwtIssuer: process.env.JWT_ISSUER || "buildwise",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "30d",
    nodeEnv: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "3000", 10),
    appUrl: process.env.APP_URL || "http://localhost:3000",
    setupMode: process.env.SETUP_MODE === "true",
    setupSecret: process.env.SETUP_SECRET,
    sentryDsn: process.env.SENTRY_DSN,
    logLevel: process.env.LOG_LEVEL || "info",
  };
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvVarOptional(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

/**
 * Validates and exports configuration
 * Call this at app startup to fail fast
 */
export function validateConfig(): Config {
  const config: Config = {
    // Database
    databaseUrl: getEnvVar("DATABASE_URL", "file:./dev.db"),
    mongodbUri: getEnvVar("MONGODB_URI", "mongodb://localhost:27017/buildwise"),

    // Authentication
    jwtSecret: getEnvVar("JWT_SECRET"),
    jwtIssuer: getEnvVar("JWT_ISSUER", "buildwise"),
    jwtExpiresIn: getEnvVar("JWT_EXPIRES_IN", "30d"),

    // Application
    nodeEnv: getEnvVar("NODE_ENV", "development"),
    port: parseInt(getEnvVar("PORT", "3000"), 10),
    appUrl: getEnvVar("APP_URL", "http://localhost:3000"),

    // Features
    setupMode: getEnvVar("SETUP_MODE", "false") === "true",
    setupSecret: getEnvVarOptional("SETUP_SECRET"),

    // Optional
    sentryDsn: getEnvVarOptional("SENTRY_DSN"),
    logLevel: getEnvVar("LOG_LEVEL", "info"),
  };

  // Additional validations
  if (config.setupMode && !config.setupSecret) {
    throw new Error("SETUP_SECRET required when SETUP_MODE is enabled");
  }

  if (config.nodeEnv === "production" && config.jwtSecret === "change-this-secret") {
    throw new Error("Change JWT_SECRET in production!");
  }

  return config;
}

// Get config with safe defaults (doesn't throw during build)
export const config = getConfig();

// Helper functions
export const isDevelopment = config.nodeEnv === "development";
export const isProduction = config.nodeEnv === "production";
export const isTest = config.nodeEnv === "test";
