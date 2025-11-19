import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, CloseLineIcon } from "@/icons";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (values: string[]) => void;
  className?: string;
  value?: string[];
  defaultValue?: string[];
  disabled?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  placeholder = "Chọn...",
  onChange,
  className = "",
  value = [],
  defaultValue = [],
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>(value || defaultValue);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedValues(value || defaultValue);
  }, [value, defaultValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (optionValue: string) => {
    const newSelectedValues = selectedValues.includes(optionValue)
      ? selectedValues.filter(val => val !== optionValue)
      : [...selectedValues, optionValue];
    
    setSelectedValues(newSelectedValues);
    onChange(newSelectedValues);
  };

  const handleRemoveValue = (valueToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelectedValues = selectedValues.filter(val => val !== valueToRemove);
    setSelectedValues(newSelectedValues);
    onChange(newSelectedValues);
  };

  const getSelectedLabels = () => {
    return selectedValues.map(val => {
      const option = options.find(opt => opt.value === val);
      return option ? option.label : val;
    });
  };

  const selectedLabels = getSelectedLabels();

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className={`h-auto min-h-[44px] w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${
          disabled ? "cursor-not-allowed opacity-50" : ""
        }`}
        onClick={handleToggle}
      >
        <div className="flex flex-wrap gap-1">
          {selectedLabels.length > 0 ? (
            selectedLabels.map((label, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-md bg-brand-100 px-2 py-1 text-xs font-medium text-brand-800 dark:bg-brand-900 dark:text-brand-200"
              >
                {label}
                <button
                  type="button"
                  onClick={(e) => handleRemoveValue(selectedValues[index], e)}
                  className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-brand-400 hover:bg-brand-200 hover:text-brand-500 dark:hover:bg-brand-800 dark:hover:text-brand-300"
                >
                  <CloseLineIcon className="h-3 w-3" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-gray-400 dark:text-gray-400">{placeholder}</span>
          )}
        </div>
      </div>
      
      <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
        <ChevronDownIcon className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </span>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="max-h-60 overflow-y-auto p-1">
            {options.map((option) => (
              <div
                key={option.value}
                className={`flex cursor-pointer items-center rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  selectedValues.includes(option.value)
                    ? "bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200"
                    : "text-gray-700 dark:text-gray-300"
                }`}
                onClick={() => handleOptionClick(option.value)}
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => {}} // Controlled by onClick
                  className="mr-2 h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                />
                {option.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
