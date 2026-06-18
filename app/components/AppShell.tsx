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
    icon: "P",
    label: "Practice",
    description: "Fretboard focus",
  },
  {
    href: "/progression",
    icon: "E",
    label: "Progression Edit",
    description: "Chord editing",
  },
];

const panelItems = [
  {
    key: "controls",
    icon: "C",
    label: "Controls",
    description: "Harmony & playback",
  },
  {
    key: "progression",
    icon: "R",
    label: "Progression",
    description: "Rhythm & loop",
  },
] as const;

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  const openControls = () => {
    window.dispatchEvent(new CustomEvent("shell:open-controls"));
  };

  const openProgression = () => {
    window.dispatchEvent(new CustomEvent("shell:open-progression"));
  };

  const handlePanelOpen = (key: (typeof panelItems)[number]["key"]) => {
    if (key === "controls") {
      openControls();
      return;
    }

    openProgression();
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
                  <span className="sidebarItemIcon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="sidebarItemBody">
                    <strong>{item.label}</strong>
                    <span>{item.description}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="sidebarSection">
          <p className="sidebarSectionLabel">Panels</p>
          <div className="sidebarTools">
            {panelItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className="sidebarToolButton"
                onClick={() => handlePanelOpen(item.key)}
              >
                <span className="sidebarItemIcon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="sidebarItemBody">
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="shellContent">{children}</div>
    </div>
  );
}
