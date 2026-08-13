"use client";

import { useEffect, useState } from "react";

type UseProgressionWorkspaceActionsOptions = {
  onRedo: () => void;
  onReset: () => void;
  onUndo: () => void;
};

export function isProgressionShortcutInputTarget(target: EventTarget | null) {
  return (
    typeof HTMLElement !== "undefined" &&
    target instanceof HTMLElement &&
    Boolean(target.closest("input, select, textarea, [contenteditable='true']"))
  );
}

export function useProgressionWorkspaceActions({
  onRedo,
  onReset,
  onUndo,
}: UseProgressionWorkspaceActionsOptions) {
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  useEffect(() => {
    const handleHistoryShortcut = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      if (isProgressionShortcutInputTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "z" && event.shiftKey) {
        event.preventDefault();
        onRedo();
      } else if (key === "z") {
        event.preventDefault();
        onUndo();
      } else if (key === "y") {
        event.preventDefault();
        onRedo();
      }
    };

    window.addEventListener("keydown", handleHistoryShortcut);
    return () => window.removeEventListener("keydown", handleHistoryShortcut);
  }, [onRedo, onUndo]);

  useEffect(() => {
    if (!isResetDialogOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsResetDialogOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isResetDialogOpen]);

  const openResetDialog = () => setIsResetDialogOpen(true);
  const closeResetDialog = () => setIsResetDialogOpen(false);
  const confirmResetProgression = () => {
    onReset();
    closeResetDialog();
  };

  return {
    closeResetDialog,
    confirmResetProgression,
    isResetDialogOpen,
    openResetDialog,
  };
}
