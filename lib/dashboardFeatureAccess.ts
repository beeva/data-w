/**
 * Dashboard feature access by account role.
 * Personal and company accounts use the Data Pool / finances flows only — not projects or project messaging.
 */

export function isPersonalOrCompanyRole(
  role: string | null | undefined,
): boolean {
  return role === "personal" || role === "company";
}
