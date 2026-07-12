export type SessionValidationRecord = {
  revokedAt: Date | null;
  expiresAt: Date;
  user: {
    isActive: boolean;
  };
};

export function canAuthenticateAdminSession(
  session: SessionValidationRecord | null,
  now = new Date()
) {
  return Boolean(
    session &&
      !session.revokedAt &&
      session.expiresAt > now &&
      session.user.isActive
  );
}
