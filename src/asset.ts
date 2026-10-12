/** Resolves a /public path against the build's base URL, so the same build works at a domain
 * root (leadclickz card site) or under a sub-path (an embedded preview). */
const base: string = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';

export function asset(path: string) {
  if (!path.startsWith('/') || base === '/') return path;
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
