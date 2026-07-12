import { getClientIp } from "@/lib/security/rate-limit";

export type AdminRequestContext = {
  ipAddress: string;
  userAgent: string | null;
};

export function getAdminRequestContext(headers: Headers): AdminRequestContext {
  return {
    ipAddress: getClientIp(headers),
    userAgent: limitHeader(headers.get("user-agent"), 512),
  };
}

function limitHeader(value: string | null, maxLength: number) {
  if (!value) return null;
  return value.slice(0, maxLength);
}
