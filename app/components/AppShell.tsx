"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

const navItems = [
  {
    href: "/",
    label: "Practice",
    description: "指板と基本操作",
  },
  {
    href: "/progression",
    label: "Progression Edit",
    description: "コード進行を編集",
  },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="appShell">
      <aside className="appSidebar">
        <div className="sidebarBrand">
          <span className="sidebarBrandMark" aria-hidden="true">
            μ
          </span>
          <div>
            <strong>Bass Chord Degree</strong>
            <span>Practice workspace</span>
          </div>
        </div>

        <nav className="sidebarNav" aria-label="Main">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "sidebarNavItem active" : "sidebarNavItem"}
                aria-current={isActive ? "page" : undefined}
              >
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="shellContent">
        <header className="shellMobileNav" aria-label="Main">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "shellMobileTab active" : "shellMobileTab"}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </header>
        {children}
      </div>
    </div>
  );
}
