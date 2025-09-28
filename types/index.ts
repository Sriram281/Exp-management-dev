export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod: string;
  account: string;
  location?: string;
  receipt?: string;
  recurring?: boolean;
  recurringFreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface Income {
  id: string;
  amount: number;
  source: string;
  description: string;
  date: string;
  account: string;
  recurring?: boolean;
  recurringFreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'weekly' | 'monthly';
  spent: number;
  alerts: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'wallet' | 'upi';
  balance: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  profileImage?: string;
  phone?: string;
  dateJoined: string;
}

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Groceries',
  'Personal Care',
  'Other'
];

export const INCOME_SOURCES = [
  'Salary',
  'Freelance',
  'Business',
  'Investments',
  'Rental',
  'Other'
];

export const PAYMENT_METHODS = [
  'Cash',
  'Debit Card',
  'Credit Card',
  'UPI',
  'Net Banking',
  'Wallet'
];

export const ACCOUNT_TYPES = [
  'Cash',
  'Savings Account',
  'Current Account',
  'Credit Card',
  'Digital Wallet',
  'UPI Account',
  'Other'
];