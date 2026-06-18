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

  const openControls = () => {
    window.dispatchEvent(new CustomEvent("shell:open-controls"));
  };

  const openProgression = () => {
    window.dispatchEvent(new CustomEvent("shell:open-progression"));
  };

  return (
    <div className="appShell">
      <aside className="appSidebar">
        <div className="sidebarBrand">
          <span className="sidebarBrandMark" aria-hidden="true">
            μ
          </span>
          <div>
            <strong>Bass Chord Degree</strong>
            <span>Mode switcher</span>
          </div>
        </div>

        <div className="sidebarSection">
          <p className="sidebarSectionLabel">Modes</p>
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
        </div>

        <div className="sidebarSection">
          <p className="sidebarSectionLabel">Panels</p>
          <div className="sidebarTools">
            <button type="button" className="sidebarToolButton" onClick={openControls}>
              <strong>Controls</strong>
              <span>コードと再生の操作を開く</span>
            </button>
            <button type="button" className="sidebarToolButton" onClick={openProgression}>
              <strong>Progression</strong>
              <span>再生状態とループを開く</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="shellContent">{children}</div>
    </div>
  );
}
