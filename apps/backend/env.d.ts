declare namespace NodeJS {
  interface ProcessEnv {
    NEWSAPI_API_KEY: string;
    OPENAI_API_KEY: string;
    DATABASE_URL: string;
    REDIS_URL: string;
    VAPID_PRIVATE_KEY: string;
    VAPID_PUBLIC_KEY: string;
    /** contact mailto: or http: for the VAPID subject */
    VAPID_SUBJECT: string;
    /** JWT secret key for token signing */
    JWT_SECRET: string;
    /** JWT token expiration time (e.g., '1d', '7d', '24h') */
    JWT_EXPIRES_IN: string;
  }
}
