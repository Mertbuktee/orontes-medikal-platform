export function shouldRenderCookieConsentUi(pathname: string | null) {
  if (!pathname) {
    return true;
  }

  return pathname !== "/admin" && !pathname.startsWith("/admin/");
}
