const API_BASE_URL = '';

export const API_PATHS = {
  // Budget Management
  BUDGET_HEADS: `get-heads`,
  BUDGET_HEAD: (id: string) => `${API_BASE_URL}/budget-heads/${id}`,
  CREATE_BUDGET: `/add-budget`,
  FISCAL_YEARS: `/get-years`,
  GET_BUDGET: (type: string, page: number = 1, limit: number = 20) => `get-budget?type=${type}&page=${page}&limit=${limit}`,
  
  // Budget Overview
  BUDGET_OVERVIEW: `${API_BASE_URL}/budget/overview`,
  BUDGET_YEAR: (year: string) => `${API_BASE_URL}/budget/year/${year}`,
  
  // Transactions
  TRANSACTIONS: `${API_BASE_URL}/transactions`,
  TRANSACTION: (id: string) => `${API_BASE_URL}/transactions/${id}`,
  
  // Receipts
  RECEIPTS: `${API_BASE_URL}/receipts`,
  RECEIPT: (id: string) => `${API_BASE_URL}/receipts/${id}`,
  
  // Emails
  EMAILS: `${API_BASE_URL}/emails`,
  EMAIL: (id: string) => `${API_BASE_URL}/emails/${id}`,
  
  // User Management
  USER_PROFILE: `${API_BASE_URL}/user/profile`,
  USER_SETTINGS: `${API_BASE_URL}/user/settings`,
  
  // Notifications
  NOTIFICATIONS: `${API_BASE_URL}/notifications`,
  NOTIFICATION_READ: (notificationId: string) => `${API_BASE_URL}/notifications/${notificationId}/read`,
  
  // Add other budget-related paths as needed
} as const;

export const getApiPath = (path: keyof typeof API_PATHS) => {
  return API_PATHS[path];
};
