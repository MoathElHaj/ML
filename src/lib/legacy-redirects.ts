/**
 * Old WordPress links from bariq.tech (before the move) → their new pages, so search rankings
 * and links shared on social media keep working. Applied in the proxy, before locale routing.
 */
const exact: Record<string, string> = {
  "/digital-marketing": "/services/digital-marketing",
  "/web-development": "/services/web-development",
  "/social-media-design": "/services/graphic-design",
  "/اهمية-التسويق-الرقمي": "/blog",
  "/26379-2": "/",
  "/nova1": "/portfolio",
  "/websiteask": "/contact",
  "/feed": "/blog",
};

const prefixes: [string, string][] = [
  ["/author/", "/blog"],
  ["/category/", "/blog"],
];

/** The new path for an old WordPress URL, or null. */
export function legacyRedirect(pathname: string): string | null {
  let path: string;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    path = pathname;
  }
  path = path.length > 1 ? path.replace(/\/+$/, "") : path;
  if (exact[path]) return exact[path];
  for (const [prefix, to] of prefixes) if (path.startsWith(prefix)) return to;
  return null;
}
