export type NavLink = { href: string; label: string };

export function getNavLinks(isAdmin: boolean): NavLink[] {
  const links = [
    { href: "/rooms", label: "Salas" },
    { href: "/me/reservations", label: "Minhas reservas" },
  ];
  return isAdmin ? [...links, { href: "/admin", label: "Admin" }] : links;
}

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
