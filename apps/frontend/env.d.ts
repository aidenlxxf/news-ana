declare namespace NodeJS {
  interface ProcessEnv {
    BACKEND_HOST: string;
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: string;
    AUTH_COOKIE_NAME: string;
    OPENAI_API_KEY: string;
  }
}
