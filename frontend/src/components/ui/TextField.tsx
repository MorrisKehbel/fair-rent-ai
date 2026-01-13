"use client";

import { ChangeEvent, FocusEvent, ReactNode } from "react";

interface TextFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  placeholder?: string;
  error?: string;
  inputMode?:
    | "text"
    | "numeric"
    | "decimal"
    | "tel"
    | "email"
    | "url"
    | "search";
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  labelAction?: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export const TextField = ({
  id,
  name,
  label,
  value,
  placeholder,
  error,
  inputMode = "text",
  onChange,
  onFocus,
  onBlur,
  labelAction,
  className = "",
  fullWidth = false,
}: TextFieldProps) => {
  const baseInputClasses =
    "mt-1 w-full rounded border border-gray-600/50 bg-gray-600/10 p-2 shadow-inner focus:outline focus:outline-blue-600 select-none";

  const errorInputClasses = error ? "outline outline-red-600/80" : "";

  return (
    <label
      htmlFor={id}
      className={`flex flex-col justify-between ${
        fullWidth ? "col-span-2" : "col-span-1"
      } ${className}`}
    >
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
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${baseInputClasses} ${errorInputClasses}`}
      />
    </label>
  );
};
