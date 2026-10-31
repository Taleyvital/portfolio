"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/lib/site";

export function NavLinks() {
  const pathname = usePathname();
  return (
    <ul className="nav-links">
      {navigation.map((item) => {
        const actif = item.href === pathname || (item.href === "/#projets" && pathname.startsWith("/projets"));
        return (
          <li key={item.href}>
            <Link href={item.href} aria-current={actif ? "page" : undefined}>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
