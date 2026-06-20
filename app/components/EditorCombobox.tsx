"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { LuCheck, LuChevronsUpDown, LuSearch } from "react-icons/lu";

export type EditorComboboxOption = {
  description?: string;
  keywords?: string;
  label: string;
  value: string;
};

type EditorComboboxProps = {
  ariaLabel: string;
  emptyMessage?: string;
  onValueChange: (value: string) => void;
  options: readonly EditorComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  value: string;
};

export function EditorCombobox({
  ariaLabel,
  emptyMessage = "候補がありません",
  onValueChange,
  options,
  placeholder = "選択してください",
  searchPlaceholder = "検索…",
  value,
}: EditorComboboxProps) {
  const listboxId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) =>
      [option.label, option.description, option.keywords, option.value]
        .filter(Boolean)
        .some((candidate) => candidate?.toLocaleLowerCase().includes(normalizedQuery)),
    );
  }, [options, query]);
  const selectedFilteredIndex = Math.max(
    filteredOptions.findIndex((option) => option.value === value),
    0,
  );
  const [activeIndex, setActiveIndex] = useState(selectedFilteredIndex);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setQuery("");
    setActiveIndex(Math.max(options.findIndex((option) => option.value === value), 0));
    window.requestAnimationFrame(() => inputRef.current?.focus());

    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, options, value]);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(filteredOptions.length - 1, 0)));
  }, [filteredOptions.length]);

  const closeAndFocusTrigger = () => {
    setIsOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const selectOption = (option: EditorComboboxOption) => {
    onValueChange(option.value);
    closeAndFocusTrigger();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        Math.min(current + 1, Math.max(filteredOptions.length - 1, 0)),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      const option = filteredOptions[activeIndex];
      if (option) {
        event.preventDefault();
        selectOption(option);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeAndFocusTrigger();
    }
  };

  return (
    <div className="editorCombobox" ref={wrapperRef}>
      <button
        ref={triggerRef}
        type="button"
        className="editorComboboxTrigger"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
      >
        <span className="editorComboboxTriggerText">
          <strong>{selectedOption?.label ?? placeholder}</strong>
          {selectedOption?.description ? <small>{selectedOption.description}</small> : null}
        </span>
        <LuChevronsUpDown aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="editorComboboxPopover">
          <div className="editorComboboxSearch">
            <LuSearch aria-hidden="true" />
            <input
              ref={inputRef}
              role="combobox"
              aria-activedescendant={
                filteredOptions[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined
              }
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-expanded="true"
              aria-label={`${ariaLabel}を検索`}
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleInputKeyDown}
            />
          </div>
          <div id={listboxId} className="editorComboboxList" role="listbox">
            {filteredOptions.length === 0 ? (
              <p className="editorComboboxEmpty">{emptyMessage}</p>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = index === activeIndex;
                return (
                  <button
                    id={`${listboxId}-option-${index}`}
                    key={option.value}
                    type="button"
                    className={isActive ? "editorComboboxOption active" : "editorComboboxOption"}
                    aria-selected={isSelected}
                    role="option"
                    onClick={() => selectOption(option)}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <span>
                      <strong>{option.label}</strong>
                      {option.description ? <small>{option.description}</small> : null}
                    </span>
                    <LuCheck className={isSelected ? "selected" : ""} aria-hidden="true" />
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
