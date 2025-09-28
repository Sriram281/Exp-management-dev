import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, Income, Budget, Account, UserProfile } from '@/types';

const KEYS = {
  EXPENSES: 'expenses',
  INCOME: 'income',
  BUDGETS: 'budgets',
  ACCOUNTS: 'accounts',
  SETTINGS: 'settings',
  USER_PROFILE: 'userProfile'
};

// Expenses
export const saveExpenses = async (expenses: Expense[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
  } catch (error) {
    console.error('Error saving expenses:', error);
  }
};

export const getExpenses = async (): Promise<Expense[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.EXPENSES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting expenses:', error);
    return [];
  }
};

// Income
export const saveIncome = async (income: Income[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.INCOME, JSON.stringify(income));
  } catch (error) {
    console.error('Error saving income:', error);
  }
};

export const getIncome = async (): Promise<Income[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.INCOME);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting income:', error);
    return [];
  }
};

// Budgets
export const saveBudgets = async (budgets: Budget[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.BUDGETS, JSON.stringify(budgets));
  } catch (error) {
    console.error('Error saving budgets:', error);
  }
};

export const getBudgets = async (): Promise<Budget[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.BUDGETS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting budgets:', error);
    return [];
  }
};

// Accounts
export const saveAccounts = async (accounts: Account[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
  } catch (error) {
    console.error('Error saving accounts:', error);
  }
};

export const getAccounts = async (): Promise<Account[]> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.ACCOUNTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting accounts:', error);
    return [];
  }
};

// Settings
export const saveSettings = async (settings: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

export const getSettings = async (): Promise<any> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : { darkMode: false, currency: '₹' };
  } catch (error) {
    console.error('Error getting settings:', error);
    return { darkMode: false, currency: '₹' };
  }
};

// User Profile
export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};