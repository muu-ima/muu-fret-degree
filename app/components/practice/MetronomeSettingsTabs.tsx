"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import styles from "./MetronomePanel.module.css";

const tabs = [
  { id: "mixer", label: "ミキサー" },
  { id: "sound", label: "全体音量・音色" },
  { id: "timing", label: "拍子・開始" },
] as const;
type Tab = typeof tabs[number]["id"];
type Props = Record<Tab, ReactNode>;

export function MetronomeSettingsTabs({ mixer, sound, timing }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("mixer");
  const id = useId();
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const panels = { mixer, sound, timing };

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    switch (event.key) {
      case "ArrowRight": next = (index + 1) % tabs.length; break;
      case "ArrowLeft": next = (index + tabs.length - 1) % tabs.length; break;
      case "Home": next = 0; break;
      case "End": next = tabs.length - 1; break;
      default: return;
    }
    event.preventDefault();
    setActiveTab(tabs[next].id);
    buttons.current[next]?.focus();
  }

  return (
    <div className={styles.tabSettings}>
      <div className={styles.tabs} role="tablist" aria-label="メトロノーム設定">
        {tabs.map((tab, index) => (
          <button key={tab.id} type="button" role="tab"
            id={`${id}-tab-${tab.id}`} aria-controls={`${id}-panel-${tab.id}`}
            aria-selected={activeTab === tab.id} tabIndex={activeTab === tab.id ? 0 : -1}
            ref={(node) => { buttons.current[index] = node; }}
            onClick={() => setActiveTab(tab.id)} onKeyDown={(event) => handleKeyDown(event, index)}>
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div key={tab.id} role="tabpanel" id={`${id}-panel-${tab.id}`}
          aria-labelledby={`${id}-tab-${tab.id}`} hidden={activeTab !== tab.id}
          tabIndex={0} className={styles.tabPanel}>
          {panels[tab.id]}
        </div>
      ))}
    </div>
  );
}
