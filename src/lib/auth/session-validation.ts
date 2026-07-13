export type SessionValidationRecord = {
  revokedAt: Date | null;
  expiresAt: Date;
  createdAt?: Date;
  user: {
    isActive: boolean;
    passwordChangedAt?: Date | null;
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
      session.user.isActive &&
      (!session.user.passwordChangedAt ||
        !session.createdAt ||
        session.createdAt >= session.user.passwordChangedAt)
  );
}
