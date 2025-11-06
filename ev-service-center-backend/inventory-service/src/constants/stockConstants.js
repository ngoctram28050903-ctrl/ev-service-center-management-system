// Stock change types
export const STOCK_CHANGE_TYPES = {
  IN: "IN",
  OUT: "OUT"
};

// Stock change type values array for validation
export const STOCK_CHANGE_TYPE_VALUES = Object.values(STOCK_CHANGE_TYPES);

// Default values
export const DEFAULT_VALUES = {
  MIN_STOCK: 5,
  INITIAL_QUANTITY: 0
};

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  STOCK_HISTORY_LIMIT: 20
};
