"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {createPortal} from "react-dom";

export type DashboardSelectOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

type DashboardSelectProps = {
  ariaLabel?: string;
  defaultValue?: string;
  name?: string;
  menuClassName?: string;
  onValueChange?: (value: string) => void;
  options: DashboardSelectOption[];
  placeholder?: string;
  portal?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  value?: string;
};

export default function DashboardSelect({
  ariaLabel,
  defaultValue = "",
  menuClassName = "",
  name,
  onValueChange,
  options,
  placeholder,
  portal = false,
  searchable = false,
  searchPlaceholder = "Search...",
  value
}: DashboardSelectProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [searchQuery, setSearchQuery] = useState("");
  const selectedValue = value ?? internalValue;
  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === selectedValue),
    [options, selectedValue],
  );
  const [activeIndex, setActiveIndex] = useState(selectedIndex >= 0 ? selectedIndex : 0);
  const [portalStyle, setPortalStyle] = useState<CSSProperties>({});
  const selectedOption = useMemo(
    () => (selectedIndex >= 0 ? options[selectedIndex] : undefined),
    [options, selectedIndex],
  );
  const visibleOptions = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!searchable || !query) return options;
    return options.filter((option) => option.label.toLocaleLowerCase().includes(query));
  }, [options, searchable, searchQuery]);

  function updatePortalPosition() {
    if (!portal || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = rect.width;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8));
    const desiredHeight = Math.min(320, options.length * 48 + (searchable ? 68 : 16));
    const spaceBelow = window.innerHeight - rect.bottom - 16;
    const spaceAbove = rect.top - 16;
    const openAbove = spaceBelow < desiredHeight && spaceAbove > spaceBelow;
    const availableHeight = Math.max(120, openAbove ? spaceAbove : spaceBelow);
    const menuHeight = Math.min(desiredHeight, availableHeight);
    setPortalStyle({
      position: "fixed",
      inset: "auto",
      top: openAbove ? Math.max(8, rect.top - menuHeight - 8) : rect.bottom + 8,
      right: "auto",
      bottom: "auto",
      left,
      width: menuWidth,
      minWidth: menuWidth,
      maxWidth: menuWidth,
      maxHeight: menuHeight,
      overflowY: "auto",
      transform: "none",
      zIndex: portal ? 2600 : 1000
    });
  }

  useEffect(() => {
    if (!isOpen) return;

    function closeOnOutsidePress(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node) && !menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePress);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePress);
  }, [isOpen]);

  useEffect(() => {
    if (!portal || !isOpen) return;
    updatePortalPosition();
    const reposition = () => updatePortalPosition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [isOpen, portal, options.length]);

  function openMenu() {
    setSearchQuery("");
    setActiveIndex(Math.max(0, visibleOptions.findIndex((option) => option.value === selectedValue)));
    updatePortalPosition();
    setIsOpen(true);
  }

  function chooseOption(option: DashboardSelectOption, index: number) {
    if (option.disabled) return;
    if (value === undefined) {
      setInternalValue(option.value);
    }
    onValueChange?.(option.value);
    setActiveIndex(index);
    setSearchQuery("");
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
        return visibleOptions.length ? (current + offset + visibleOptions.length) % visibleOptions.length : 0;
      });
      return;
    }

    if ((event.key === "Enter" || event.key === " ") && isOpen) {
      event.preventDefault();
        const option = visibleOptions[activeIndex];
        if (option && !option.disabled) chooseOption(option, activeIndex);
    }
  }

  const menu = isOpen ? (
    <div
      className={`dashboard-select-menu ${menuClassName}`.trim()}
      id={menuId}
      ref={menuRef}
      role="listbox"
      style={portal ? portalStyle : undefined}
    >
      {searchable ? (
        <div className="dashboard-select-search">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <circle cx="10.75" cy="10.75" r="6.25" />
            <path d="m15.5 15.5 4 4" />
          </svg>
          <input
            autoFocus
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => event.stopPropagation()}
            placeholder={searchPlaceholder}
            type="search"
            value={searchQuery}
          />
        </div>
      ) : null}
      {visibleOptions.map((option, index) => {
        const isSelected = option.value === selectedValue;
        const isActive = index === activeIndex;

        return (
          <button
            aria-disabled={option.disabled || undefined}
            aria-selected={isSelected}
            className={`dashboard-select-option ${isSelected ? "selected" : ""} ${isActive ? "active" : ""} ${option.disabled ? "disabled" : ""}`}
            disabled={option.disabled}
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
      {visibleOptions.length === 0 ? <p className="dashboard-select-empty">—</p> : null}
    </div>
  ) : null;

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

      {portal && typeof document !== "undefined" ? createPortal(menu, document.body) : menu}
    </div>
  );
}
