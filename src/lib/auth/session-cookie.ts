export const ADMIN_SESSION_COOKIE_NAME = "orontes_admin_session";
export const DEFAULT_ADMIN_SESSION_MAX_AGE_SECONDS = 10 * 60 * 60;
export const DEFAULT_ADMIN_REMEMBER_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export type AdminSessionCookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  path: "/admin";
  secure: boolean;
  maxAge: number;
  expires?: Date;
};

export function getAdminSessionMaxAgeSeconds(env: NodeJS.ProcessEnv = process.env) {
  const raw = env.ADMIN_SESSION_MAX_AGE_SECONDS;

  if (!raw) {
    return DEFAULT_ADMIN_SESSION_MAX_AGE_SECONDS;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed < 300 || parsed > 7 * 24 * 60 * 60) {
    return DEFAULT_ADMIN_SESSION_MAX_AGE_SECONDS;
  }

  return Math.floor(parsed);
}

export function getRememberedAdminSessionMaxAgeSeconds(
  env: NodeJS.ProcessEnv = process.env
) {
  const raw = env.ADMIN_REMEMBER_SESSION_MAX_AGE_SECONDS;

  if (!raw) {
    return DEFAULT_ADMIN_REMEMBER_SESSION_MAX_AGE_SECONDS;
  }

  const parsed = Number(raw);

  if (
    !Number.isFinite(parsed) ||
    parsed < 24 * 60 * 60 ||
    parsed > 60 * 24 * 60 * 60
  ) {
    return DEFAULT_ADMIN_REMEMBER_SESSION_MAX_AGE_SECONDS;
  }

  return Math.floor(parsed);
}

export function getAdminSessionMaxAgeForPolicy(
  remembered = false,
  env: NodeJS.ProcessEnv = process.env
) {
  return remembered
    ? getRememberedAdminSessionMaxAgeSeconds(env)
    : getAdminSessionMaxAgeSeconds(env);
}

export function getAdminSessionExpiresAt(
  now = new Date(),
  env: NodeJS.ProcessEnv = process.env,
  remembered = false
) {
  return new Date(
    now.getTime() + getAdminSessionMaxAgeForPolicy(remembered, env) * 1000
  );
}

export function getAdminSessionCookieOptions(
  env: NodeJS.ProcessEnv = process.env,
  remembered = false
): AdminSessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/admin",
    secure: env.APP_ENV === "production" || env.VERCEL_ENV === "production",
    maxAge: getAdminSessionMaxAgeForPolicy(remembered, env),
  };
}

export function getExpiredAdminSessionCookieOptions(
  env: NodeJS.ProcessEnv = process.env
): AdminSessionCookieOptions {
  return {
    ...getAdminSessionCookieOptions(env),
    maxAge: 0,
    expires: new Date(0),
  };
}
