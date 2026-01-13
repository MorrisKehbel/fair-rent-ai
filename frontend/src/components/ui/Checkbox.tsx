"use client";

import { ChangeEvent } from "react";

interface CheckboxProps {
  id: string;
  name: string;
  label: string;
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const Checkbox = ({
  id,
  name,
  label,
  checked,
  onChange,
}: CheckboxProps) => {
  return (
    <div className="flex w-full items-center justify-between">
      <label htmlFor={id} className="text-sm font-semibold md:text-base">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer size-5 cursor-pointer appearance-none rounded-md border border-gray-400 shadow-sm transition-all checked:border-blue-600 checked:bg-blue-600 hover:scale-105"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="pointer-events-none absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
};
