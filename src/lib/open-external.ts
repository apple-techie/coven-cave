export const OPEN_IN_APP_BROWSER_EVENT = "cave:open-url-in-browser";
export const PENDING_IN_APP_BROWSER_URL_KEY = "cave:pending-in-app-browser-url";

export function openInAppBrowserUrl(url: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PENDING_IN_APP_BROWSER_URL_KEY, url);
  window.dispatchEvent(new CustomEvent(OPEN_IN_APP_BROWSER_EVENT, { detail: { url } }));
  if (window.location.pathname !== "/") {
    window.location.assign("/#browser");
  }
}

// Historical name kept for existing call sites. External destinations should
// open inside Cave's Browser surface instead of the system browser/new tab.
export function openExternalUrl(url: string): void {
  openInAppBrowserUrl(url);
}

/**
 * Open a URL in a real top-level browsing context (system browser / new tab).
 *
 * Use for cross-origin apps that rely on first-party Secure / SameSite / __Host-
 * cookies (Omnigent web UI). Cave's in-app browser embeds third-party sites and
 * those session cookies often fail to stick.
 *
 * Falls back to the in-app browser only if the popup is blocked.
 */
export function openSystemBrowserUrl(url: string): void {
  if (typeof window === "undefined") return;
  const trimmed = url.trim();
  if (!trimmed) return;
  try {
    const opened = window.open(trimmed, "_blank", "noopener,noreferrer");
    if (opened) return;
  } catch {
    /* fall through */
  }
  openInAppBrowserUrl(trimmed);
}

/** True when this URL should skip the in-app browser (cookie/auth-sensitive). */
export function shouldOpenInSystemBrowser(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host === "omnigent" || host.startsWith("omnigent.")) return true;
    if (host.includes("omnigent.") && host.endsWith(".ts.net")) return true;
    return false;
  } catch {
    return false;
  }
}

/** Route to system browser for Omnigent (etc.), else in-app Browser. */
export function openUrl(url: string): void {
  if (shouldOpenInSystemBrowser(url)) openSystemBrowserUrl(url);
  else openExternalUrl(url);
}
