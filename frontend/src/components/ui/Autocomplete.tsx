"use client";

import {
  ChangeEvent,
  FocusEvent,
  KeyboardEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

interface AutocompleteOption {
  value: string;
  label: string;
}

interface AutocompleteProps {
  id: string;
  name: string;
  label: string;
  value: string;
  options: AutocompleteOption[];
  placeholder?: string;
  error?: string;
  inputMode?: "text" | "numeric";
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSelect: (value: string, option: AutocompleteOption) => void;
  labelAction?: ReactNode;
  emptyMessage?: string;
  className?: string;
  fullWidth?: boolean;
}

export const Autocomplete = ({
  id,
  name,
  label,
  value,
  options,
  placeholder,
  error,
  inputMode = "text",
  onChange,
  onSelect,
  labelAction,
  emptyMessage = "Keine Ergebnisse gefunden",
  className = "",
  fullWidth = false,
}: AutocompleteProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeItem = listRef.current.children[activeIndex] as HTMLElement;
      activeItem?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && options[activeIndex]) {
          onSelect(options[activeIndex].value, options[activeIndex]);
          setIsOpen(false);
          setActiveIndex(-1);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    setIsOpen(true);
    // Reset active index when opening
    setActiveIndex(-1);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    setIsOpen(true);
    setActiveIndex(-1);
  };

  const handleOptionClick = (option: AutocompleteOption) => {
    onSelect(option.value, option);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const baseInputClasses =
    "mt-1 w-full rounded border border-gray-600/50 bg-gray-600/10 p-2 shadow-inner focus:outline focus:outline-blue-600 select-none";
  const errorInputClasses = error ? "outline outline-red-600/80" : "";

  const listboxId = `${id}-listbox`;

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full ${
        fullWidth ? "col-span-2" : "col-span-1"
      } ${className}`}
    >
      <label htmlFor={id} className="flex flex-col justify-between h-full">
        <div className="flex h-full flex-wrap items-baseline justify-between">
          <div className="flex flex-wrap items-baseline">
            <span className="mr-2 text-sm font-semibold md:mr-0 md:text-base">
              {label}
            </span>
            {labelAction}
          </div>
          {error && (
            <span
              id={`${id}-error`}
              className="mt-auto whitespace-nowrap text-[10px] text-red-600 md:text-xs"
              role="alert"
            >
              {error}
            </span>
          )}
        </div>
        <input
          id={id}
          name={name}
          type="text"
          inputMode={inputMode}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
          }
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete="off"
          className={`${baseInputClasses} ${errorInputClasses}`}
        />
      </label>

      {isOpen && options.length > 0 && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={`${label} Vorschläge`}
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border border-gray-200 bg-gray-100 text-black shadow-lg"
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={activeIndex === index}
              tabIndex={-1}
              onClick={() => handleOptionClick(option)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`cursor-pointer p-2 transition-colors ${
                activeIndex === index ? "bg-blue-100" : "hover:bg-blue-50"
              }`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}

      {/* {isOpen && options.length === 0 && value && (
        <div
          className="absolute z-10 mt-1 w-full rounded bg-white p-2 text-gray-500 shadow"
          role="status"
        >
          {emptyMessage}
        </div>
      )} */}
    </div>
  );
};
