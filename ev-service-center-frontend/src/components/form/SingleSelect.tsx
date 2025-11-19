import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "@/icons";

interface Option {
  value: string;
  label: string;
}

interface SingleSelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
}

const SingleSelect: React.FC<SingleSelectProps> = ({
  options,
  placeholder = "Chọn...",
  onChange,
  className = "",
  value = "",
  defaultValue = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>(value || defaultValue);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedValue(value || defaultValue);
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
    setSelectedValue(optionValue);
    onChange(optionValue);
    setIsOpen(false);
  };

  const getSelectedLabel = () => {
    const option = options.find(opt => opt.value === selectedValue);
    return option ? option.label : selectedValue;
  };

  const selectedLabel = getSelectedLabel();

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className={`h-11 w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${
          disabled ? "cursor-not-allowed opacity-50" : ""
        }`}
        onClick={handleToggle}
      >
        <div className="flex items-center">
          {selectedLabel ? (
            <span className="text-gray-800 dark:text-white/90">{selectedLabel}</span>
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
                  selectedValue === option.value
                    ? "bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200"
                    : "text-gray-700 dark:text-gray-300"
                }`}
                onClick={() => handleOptionClick(option.value)}
              >
                <div className={`mr-2 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  selectedValue === option.value
                    ? "border-brand-600 bg-brand-600"
                    : "border-gray-300 dark:border-gray-600"
                }`}>
                  {selectedValue === option.value && (
                    <div className="h-2 w-2 rounded-full bg-white"></div>
                  )}
                </div>
                {option.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleSelect;
