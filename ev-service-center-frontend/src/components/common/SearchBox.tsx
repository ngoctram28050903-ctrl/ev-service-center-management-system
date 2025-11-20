"use client";
import React, { useState, useCallback } from "react";

export interface SearchBoxProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
  disabled?: boolean;
  defaultValue?: string;
  searchButtonText?: string;
}

export default function SearchBox({
  placeholder = "Tìm kiếm...",
  onSearch,
  className = "",
  disabled = false,
  defaultValue = "",
  searchButtonText = "Tìm kiếm",
}: SearchBoxProps) {
  const [searchTerm, setSearchTerm] = useState(defaultValue);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      
      // Chỉ xử lý search khi có keyword
      if (searchTerm.trim()) {
        onSearch(searchTerm);
      }
    },
    [searchTerm, onSearch]
  );

  const handleClear = useCallback(() => {
    setSearchTerm("");
    onSearch("");
  }, [onSearch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  }, []);

  // Update local state when defaultValue changes (e.g., from parent)
  React.useEffect(() => {
    setSearchTerm(defaultValue);
  }, [defaultValue]);

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleInputChange}
            disabled={disabled}
            className="dark:bg-dark-900 h-12 w-full rounded-lg border border-gray-200 bg-transparent px-4 py-3 pl-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              title="Xóa tìm kiếm"
            >
              <svg
                className="w-4 h-4 text-gray-500 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Search Button - To, đẹp và rõ ràng */}
        <button
          type="submit"
          disabled={disabled || !searchTerm.trim()}
          className="h-12 px-6 py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center gap-2 min-w-[120px] justify-center"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span className="font-bold text-sm">{searchButtonText}</span>
        </button>
      </div>
    </form>
  );
}
