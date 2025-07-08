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
  }
}
