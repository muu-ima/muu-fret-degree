"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { PolyrhythmTraining } from "./PolyrhythmTraining";
import { RhythmTraining } from "./RhythmTraining";
import { TrainingPrintButton } from "./TrainingPrintButton";
import styles from "./TrainingTabs.module.css";

const tabs = [
  { id: "rhythm", label: "リズムトレーニング" },
  { id: "polyrhythm", label: "ポリリズム" },
  { id: "scale", label: "スケールドリル" },
] as const;
type Tab = typeof tabs[number]["id"];

export function TrainingTabs({ scaleDrill }: { scaleDrill: ReactNode }) {
  const [activeTab, setActiveTab] = useState<Tab>("rhythm");
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const id = useId();

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
    <>
      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist" aria-label="Trainingの練習メニュー">
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
        {activeTab === "scale" && <TrainingPrintButton />}
      </div>
      <div role="tabpanel" id={`${id}-panel-rhythm`} aria-labelledby={`${id}-tab-rhythm`}
        hidden={activeTab !== "rhythm"} tabIndex={0} className={styles.panel}>
        <RhythmTraining isActive={activeTab === "rhythm"} />
      </div>
      <div role="tabpanel" id={`${id}-panel-polyrhythm`} aria-labelledby={`${id}-tab-polyrhythm`}
        hidden={activeTab !== "polyrhythm"} tabIndex={0} className={styles.panel}>
        <PolyrhythmTraining isActive={activeTab === "polyrhythm"} />
      </div>
      <div role="tabpanel" id={`${id}-panel-scale`} aria-labelledby={`${id}-tab-scale`}
        hidden={activeTab !== "scale"} tabIndex={0} className={styles.panel}>
        {activeTab === "scale" && scaleDrill}
      </div>
    </>
  );
}
