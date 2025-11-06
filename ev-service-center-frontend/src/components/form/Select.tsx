import React from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({
  options,
  // placeholder = "",
  onChange,
  className = "",
  value,
  defaultValue = "",
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <select
      className={`h-12 w-full appearance-none rounded-lg border border-gray-300 px-4 py-3 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
        value || defaultValue
          ? "text-gray-800 dark:text-white/90"
          : "text-gray-400 dark:text-gray-400"
      } ${className}`}
      value={value || defaultValue}
      onChange={handleChange}
      disabled={disabled}
    >
      {/* Placeholder option */}
      {/* <option
        value=""
        disabled
        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
      >
        {placeholder}
      </option> */}
      {/* Map over options */}
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          className="text-gray-700 dark:bg-gray-900 dark:text-gray-400 py-3 px-2 min-h-[48px] leading-relaxed"
          style={{ padding: '12px 8px', minHeight: '48px', lineHeight: '1.5' }}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
