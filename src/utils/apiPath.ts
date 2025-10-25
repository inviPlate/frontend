const API_BASE_URL = '';

export const API_PATHS = {
  // Budget Management
  BUDGET_HEADS: `get-heads`,
  BUDGET_HEAD: (id: string) => `${API_BASE_URL}/budget-heads/${id}`,
  CREATE_BUDGET: `/add-budget`,
  UPDATE_BUDGET: `/add-budget`,
  ADD_YEAR: `/add-year`,
  FISCAL_YEARS: `/get-years`,
  GET_BUDGET: (type: string, page: number = 1, limit: number = 20) => `get-budget?type=${type}&page=${page}&limit=${limit}`,
  
  // Budget Overview
  BUDGET_OVERVIEW: `${API_BASE_URL}/budget/overview`,
  BUDGET_YEAR: (year: string) => `${API_BASE_URL}/budget/year/${year}`,
  
  // Transactions
  TRANSACTIONS: `/get-transactions`,
  ADD_TRANSACTIONS: `${API_BASE_URL}/add-transaction`,
  UPDATE_TRANSACTION: `${API_BASE_URL}/add-transaction`,
  
  // Receipts
  RECEIPTS: `${API_BASE_URL}/get-receipts`,
  RECEIPT: (id: string) => `${API_BASE_URL}/receipts/${id}`,
  REGENERATE_RECEIPT: 'https://gen-receipt-618088374050.asia-south1.run.app/genReceipt',
  
  // Emails
  EMAILS: `${API_BASE_URL}/emails`,
  EMAIL: (id: string) => `${API_BASE_URL}/emails/${id}`,
  
  // User Management
  USER_PROFILE: `${API_BASE_URL}/user/profile`,
  USER_SETTINGS: `${API_BASE_URL}/user/settings`,
  
  // Notifications
  NOTIFICATIONS: `${API_BASE_URL}/notifications`,
  NOTIFICATION_READ: (notificationId: string) => `${API_BASE_URL}/notifications/${notificationId}/read`,
  
  // Offertory
  CREATE_OFFERTORY: `${API_BASE_URL}/add-offertory`,
  UPDATE_OFFERTORY: `${API_BASE_URL}/add-offertory`,
  GET_OFFERTORY: `${API_BASE_URL}/get-offertory`,
  GET_TITHE_NAMES: `${API_BASE_URL}/get-tithe`,
  
  // Members
  MEMBERS: `/get-members`,
  ADD_MEMBER: '/add-member',
  MEMBER: (id: string) => `${API_BASE_URL}/members/${id}`,
  
  // Add other budget-related paths as needed
} as const;

export const getApiPath = (path: keyof typeof API_PATHS) => {
  return API_PATHS[path];
};
