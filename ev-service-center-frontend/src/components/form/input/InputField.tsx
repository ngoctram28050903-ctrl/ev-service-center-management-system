import React, { FC } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Input: FC<InputProps> = ({
  // label,
  // error,
  className = "",
  ...props
}) => {
  return (
    <input
      className={`w-full px-4 py-3 text-sm font-normal text-gray-700 transition bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:focus:ring-brand-400 ${className}`}
      {...props}
    />
  );
};

export default Input;
