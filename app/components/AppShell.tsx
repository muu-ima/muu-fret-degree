"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { LuChartNoAxesColumn, LuMusic4, LuPencil, LuSlidersHorizontal, LuTimer } from "react-icons/lu";

type AppShellProps = {
  children: ReactNode;
};

const navItems = [
  {
    href: "/",
    icon: LuMusic4,
    label: "Practice",
    shortLabel: "Practice",
    description: "Fretboard focus",
  },
];

const panelItems = [
  {
    key: "controls",
    icon: LuSlidersHorizontal,
    label: "Controls",
    shortLabel: "Controls",
    description: "Harmony & playback",
  },
  {
    key: "metronome",
    icon: LuTimer,
    label: "Metronome",
    shortLabel: "Tempo",
    description: "Tempo & pulse",
  },
  {
    key: "progression",
    icon: LuChartNoAxesColumn,
    label: "Progression",
    shortLabel: "Progression",
    description: "Rhythm & loop",
  },
  {
    key: "edit",
    href: "/progression",
    icon: LuPencil,
    label: "Progression Edit",
    shortLabel: "Edit",
    description: "Chord editing",
  },
] as const;

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [activePanel, setActivePanel] = useState<(typeof panelItems)[number]["key"] | null>(null);

  useEffect(() => {
    setActivePanel(pathname === "/progression" ? "edit" : null);
  }, [pathname]);

  useEffect(() => {
    const handlePanelClose = () => {
      setActivePanel(null);
    };

    window.addEventListener("shell:panel-close", handlePanelClose);
    return () => {
      window.removeEventListener("shell:panel-close", handlePanelClose);
    };
  }, []);

  const openEdit = () => {
    setActivePanel("edit");
    window.dispatchEvent(new CustomEvent("shell:open-edit"));
  };

  const openControls = () => {
    setActivePanel("controls");
    window.dispatchEvent(new CustomEvent("shell:open-controls"));
  };

  const openProgression = () => {
    setActivePanel("progression");
    window.dispatchEvent(new CustomEvent("shell:open-progression"));
  };

  const openMetronome = () => {
    setActivePanel("metronome");
    window.dispatchEvent(new CustomEvent("shell:open-metronome"));
  };

  const handlePanelOpen = (key: (typeof panelItems)[number]["key"]) => {
    if (key === "controls") {
      openControls();
      return;
    }

    if (key === "metronome") {
      openMetronome();
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
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive ? "sidebarNavItem active" : "sidebarNavItem"}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="sidebarItemIcon" aria-hidden="true">
                    <Icon />
                  </span>
                  <span className="sidebarItemBody">
                    <strong>
                      <span className="sidebarItemLabelFull">{item.label}</span>
                      <span className="sidebarItemLabelShort">{item.shortLabel}</span>
                    </strong>
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
            {panelItems.map((item) => {
              const Icon = item.icon;
              if (item.key === "edit") {
                const isActive = pathname === item.href && activePanel === "edit";
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={isActive ? "sidebarToolButton active" : "sidebarToolButton"}
                    aria-current={isActive ? "page" : undefined}
                    onClick={(event) => {
                      if (isActive) {
                        event.preventDefault();
                        openEdit();
                      }
                    }}
                  >
                    <span className="sidebarItemIcon" aria-hidden="true">
                      <Icon />
                    </span>
                    <span className="sidebarItemBody">
                      <strong>
                        <span className="sidebarItemLabelFull">{item.label}</span>
                        <span className="sidebarItemLabelShort">{item.shortLabel}</span>
                      </strong>
                      <span>{item.description}</span>
                    </span>
                  </Link>
                );
              }

              return (
                <button
                  key={item.key}
                  type="button"
                  className={activePanel === item.key ? "sidebarToolButton active" : "sidebarToolButton"}
                  aria-pressed={activePanel === item.key}
                  onClick={() => handlePanelOpen(item.key)}
                >
                  <span className="sidebarItemIcon" aria-hidden="true">
                    <Icon />
                  </span>
                  <span className="sidebarItemBody">
                    <strong>
                      <span className="sidebarItemLabelFull">{item.label}</span>
                      <span className="sidebarItemLabelShort">{item.shortLabel}</span>
                    </strong>
                    <span>{item.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <div className="shellContent">{children}</div>
    </div>
  );
}
