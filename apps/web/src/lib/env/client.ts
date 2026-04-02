/**
 * Client-safe environment values.
 * Only expose NEXT_PUBLIC_ variables here.
 */

export type ClientEnv = {
  appUrl: string;
};

export const clientEnv: ClientEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000",
};
