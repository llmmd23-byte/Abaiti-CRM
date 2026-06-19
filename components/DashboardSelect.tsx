"use client";

import {useEffect, useId, useRef, useState} from "react";

export type DashboardSelectOption = {
  label: string;
  value: string;
};

type DashboardSelectProps = {
  ariaLabel?: string;
  defaultValue?: string;
  name?: string;
  onValueChange?: (value: string) => void;
  options: DashboardSelectOption[];
  placeholder?: string;
  value?: string;
};

export default function DashboardSelect({
  ariaLabel,
  defaultValue = "",
  name,
  onValueChange,
  options,
  placeholder,
  value
}: DashboardSelectProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = value ?? internalValue;
  const selectedIndex = options.findIndex((option) => option.value === selectedValue);
  const [activeIndex, setActiveIndex] = useState(selectedIndex >= 0 ? selectedIndex : 0);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  useEffect(() => {
    function closeOnOutsidePress(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePress);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePress);
  }, []);

  function openMenu() {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  }

  function chooseOption(option: DashboardSelectOption, index: number) {
    if (value === undefined) {
      setInternalValue(option.value);
    }
    onValueChange?.(option.value);
    setActiveIndex(index);
    setIsOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
        return;
      }
      setActiveIndex((current) => {
        const offset = event.key === "ArrowDown" ? 1 : -1;
        return (current + offset + options.length) % options.length;
      });
      return;
    }

    if ((event.key === "Enter" || event.key === " ") && isOpen) {
      event.preventDefault();
      chooseOption(options[activeIndex], activeIndex);
    }
  }

  return (
    <div className="dashboard-select" ref={rootRef}>
      {name ? <input name={name} type="hidden" value={selectedValue} /> : null}
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={`dashboard-select-trigger ${isOpen ? "open" : ""}`}
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        onKeyDown={handleKeyDown}
        ref={triggerRef}
        type="button"
      >
        <span className={selectedOption ? "dashboard-select-value" : "dashboard-select-placeholder"}>
          {selectedOption?.label ?? placeholder ?? options[0]?.label}
        </span>
        <svg aria-hidden="true" className="dashboard-select-chevron" viewBox="0 0 20 20">
          <path d="m5.5 7.5 4.5 4.5 4.5-4.5" />
        </svg>
      </button>

      {isOpen ? (
        <div className="dashboard-select-menu" id={menuId} role="listbox">
          {options.map((option, index) => {
            const isSelected = option.value === selectedValue;
            const isActive = index === activeIndex;

            return (
              <button
                aria-selected={isSelected}
                className={`dashboard-select-option ${isSelected ? "selected" : ""} ${isActive ? "active" : ""}`}
                key={option.value}
                onClick={() => chooseOption(option, index)}
                onMouseEnter={() => setActiveIndex(index)}
                role="option"
                type="button"
              >
                <span>{option.label}</span>
                {isSelected ? (
                  <svg aria-hidden="true" className="dashboard-select-check" viewBox="0 0 20 20">
                    <path d="m4.5 10.2 3.3 3.3 7.7-7.7" />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
