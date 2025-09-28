import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  RefreshControl
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Plus, Search, Filter, ArrowLeft, ShoppingCart, Car, Utensils, Home, Zap, Heart, GraduationCap, Plane, Coffee, Wallet, Briefcase, TrendingUp, Building, PiggyBank, DollarSign, Calendar, X, Menu, CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Modal from 'react-native-modal';
import { Picker } from '@react-native-picker/picker';
import { getExpenses, saveExpenses, getIncome, saveIncome, getSettings } from '@/utils/storage';
import { Expense, Income, EXPENSE_CATEGORIES, INCOME_SOURCES, PAYMENT_METHODS, ACCOUNT_TYPES } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';

type TransactionType = 'expense' | 'income';
type TransactionItem = (Expense | Income) & { type: TransactionType };

export default function StatsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [settings, setSettings] = useState<any>({ currency: '₹' });
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  
  // Get current month range
  const getCurrentMonthRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0]
    };
  };
  
  const currentMonth = getCurrentMonthRange();
  const [startDate, setStartDate] = useState(currentMonth.start);
  const [endDate, setEndDate] = useState(currentMonth.end);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isStartDatePickerVisible, setIsStartDatePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setIsEndDatePickerVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionItem | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<TransactionItem | null>(null);
  const [currentModalType, setCurrentModalType] = useState<TransactionType>('expense');
  const [refreshing, setRefreshing] = useState(false);
  
  // Calendar state for date picker
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [isSelectingStartDate, setIsSelectingStartDate] = useState(true);

  // Form state for expenses
  const [expenseFormData, setExpenseFormData] = useState({
    amount: '',
    category: EXPENSE_CATEGORIES[0],
    description: '',
    paymentMethod: PAYMENT_METHODS[0],
    account: ACCOUNT_TYPES[0],
    location: '',
    recurring: false,
  });

  // Form state for income
  const [incomeFormData, setIncomeFormData] = useState({
    amount: '',
    source: INCOME_SOURCES[0],
    description: '',
    account: ACCOUNT_TYPES[0],
    recurring: false,
  });

  const loadData = async () => {
    try {
      const [expensesData, incomeData, settingsData] = await Promise.all([
        getExpenses(),
        getIncome(),
        getSettings()
      ]);
      setExpenses(expensesData);
      setIncome(incomeData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Combine and filter transactions
  const allTransactions: TransactionItem[] = [
    ...expenses.map(expense => ({ ...expense, type: 'expense' as TransactionType })),
    ...income.map(incomeItem => ({ ...incomeItem, type: 'income' as TransactionType }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredTransactions = allTransactions.filter(transaction => {
    const matchesType = selectedType === 'all' || transaction.type === selectedType;
    
    // Date filter - default to current month
    const transactionDate = new Date(transaction.date);
    const matchesStartDate = transactionDate >= new Date(startDate);
    const matchesEndDate = transactionDate <= new Date(endDate);
    
    // Category/Source filter
    const matchesCategorySearch = selectedCategory === 'all' || 
      (transaction.type === 'expense' && (transaction as Expense).category === selectedCategory) ||
      (transaction.type === 'income' && (transaction as Income).source === selectedCategory);
    
    // Account filter
    const matchesAccount = selectedAccount === 'all' || transaction.account === selectedAccount;
    
    return matchesType && matchesStartDate && matchesEndDate && matchesCategorySearch && matchesAccount;
  });

  const clearFilters = () => {
    const currentMonth = getCurrentMonthRange();
    setStartDate(currentMonth.start);
    setEndDate(currentMonth.end);
    setSelectedCategory('all');
    setSelectedAccount('all');
    setSelectedType('all');
    setIsFilterModalVisible(false);
  };

  const formatDateForPicker = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const generateDateOptions = () => {
    const options = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Generate dates for current year and previous year
    for (let year = currentYear; year >= currentYear - 1; year--) {
      for (let month = 11; month >= 0; month--) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = daysInMonth; day >= 1; day--) {
          const date = new Date(year, month, day);
          if (date <= today) {
            options.push({
              label: date.toLocaleDateString('en-US', { 
                year: 'numeric',
                month: 'short', 
                day: 'numeric' 
              }),
              value: formatDateForPicker(date.toISOString())
            });
          }
        }
      }
    }
    return options;
  };

  const generateCalendarDays = () => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = currentDate.getMonth() === calendarMonth;
      const isToday = currentDate.toDateString() === today.toDateString();
      const isPastDate = currentDate <= today;
      const dateValue = formatDateForPicker(currentDate.toISOString());
      const isSelected = dateValue === (isSelectingStartDate ? startDate : endDate);
      
      days.push({
        date: currentDate.getDate(),
        value: dateValue,
        isCurrentMonth,
        isToday,
        isPastDate,
        isSelected,
        fullDate: currentDate
      });
    }
    
    return days;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (calendarMonth === 0) {
        setCalendarMonth(11);
        setCalendarYear(calendarYear - 1);
      } else {
        setCalendarMonth(calendarMonth - 1);
      }
    } else {
      if (calendarMonth === 11) {
        setCalendarMonth(0);
        setCalendarYear(calendarYear + 1);
      } else {
        setCalendarMonth(calendarMonth + 1);
      }
    }
  };

  const selectDate = (dateValue: string) => {
    if (isSelectingStartDate) {
      setStartDate(dateValue);
    } else {
      setEndDate(dateValue);
    }
    setIsStartDatePickerVisible(false);
    setIsEndDatePickerVisible(false);
  };

  const openDatePicker = (forStartDate: boolean) => {
    setIsSelectingStartDate(forStartDate);
    const selectedDate = forStartDate ? new Date(startDate) : new Date(endDate);
    setCalendarMonth(selectedDate.getMonth());
    setCalendarYear(selectedDate.getFullYear());
    
    if (forStartDate) {
      setIsStartDatePickerVisible(true);
    } else {
      setIsEndDatePickerVisible(true);
    }
  };

  const dateOptions = generateDateOptions();

  const resetExpenseForm = () => {
    setExpenseFormData({
      amount: '',
      category: EXPENSE_CATEGORIES[0],
      description: '',
      paymentMethod: PAYMENT_METHODS[0],
      account: ACCOUNT_TYPES[0],
      location: '',
      recurring: false,
    });
  };

  const resetIncomeForm = () => {
    setIncomeFormData({
      amount: '',
      source: INCOME_SOURCES[0],
      description: '',
      account: ACCOUNT_TYPES[0],
      recurring: false,
    });
  };

  const openModal = (defaultType: TransactionType = 'expense', transaction?: TransactionItem) => {
    if (transaction) {
      setCurrentModalType(transaction.type);
      setEditingTransaction(transaction);
      if (transaction.type === 'expense') {
        const expense = transaction as Expense;
        setExpenseFormData({
          amount: expense.amount.toString(),
          category: expense.category,
          description: expense.description,
          paymentMethod: expense.paymentMethod,
          account: expense.account || ACCOUNT_TYPES[0],
          location: expense.location || '',
          recurring: expense.recurring || false,
        });
      } else {
        const incomeItem = transaction as Income;
        setIncomeFormData({
          amount: incomeItem.amount.toString(),
          source: incomeItem.source,
          description: incomeItem.description,
          account: incomeItem.account || ACCOUNT_TYPES[0],
          recurring: incomeItem.recurring || false,
        });
      }
    } else {
      setCurrentModalType(defaultType);
      setEditingTransaction(null);
      resetExpenseForm();
      resetIncomeForm();
    }
    setIsModalVisible(true);
  };

  const openDetailModal = (transaction: TransactionItem) => {
    setSelectedTransaction(transaction);
    setIsDetailModalVisible(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalVisible(false);
    setSelectedTransaction(null);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingTransaction(null);
    resetExpenseForm();
    resetIncomeForm();
  };

  const saveTransaction = async () => {
    if (currentModalType === 'expense') {
      if (!expenseFormData.amount || !expenseFormData.category || !expenseFormData.account) {
        Alert.alert('Error', 'Please fill in all required fields (Amount, Category, and Account)');
        return;
      }

      const expenseData: Expense = {
        id: editingTransaction?.id || Date.now().toString(),
        amount: parseFloat(expenseFormData.amount),
        category: expenseFormData.category,
        description: expenseFormData.description,
        paymentMethod: expenseFormData.paymentMethod,
        account: expenseFormData.account,
        location: expenseFormData.location,
        recurring: expenseFormData.recurring,
        date: editingTransaction?.date || new Date().toISOString(),
      };

      try {
        let updatedExpenses;
        if (editingTransaction && editingTransaction.type === 'expense') {
          updatedExpenses = expenses.map(expense =>
            expense.id === editingTransaction.id ? expenseData : expense
          );
        } else {
          updatedExpenses = [...expenses, expenseData];
        }

        await saveExpenses(updatedExpenses);
        setExpenses(updatedExpenses);
        closeModal();
        Alert.alert('Success', `Expense ${editingTransaction ? 'updated' : 'added'} successfully`);
      } catch (error) {
        Alert.alert('Error', 'Failed to save expense');
      }
    } else {
      if (!incomeFormData.amount || !incomeFormData.source || !incomeFormData.account) {
        Alert.alert('Error', 'Please fill in all required fields (Amount, Source, and Account)');
        return;
      }

      const incomeData: Income = {
        id: editingTransaction?.id || Date.now().toString(),
        amount: parseFloat(incomeFormData.amount),
        source: incomeFormData.source,
        description: incomeFormData.description,
        account: incomeFormData.account,
        recurring: incomeFormData.recurring,
        date: editingTransaction?.date || new Date().toISOString(),
      };

      try {
        let updatedIncome;
        if (editingTransaction && editingTransaction.type === 'income') {
          updatedIncome = income.map(item =>
            item.id === editingTransaction.id ? incomeData : item
          );
        } else {
          updatedIncome = [...income, incomeData];
        }

        await saveIncome(updatedIncome);
        setIncome(updatedIncome);
        closeModal();
        Alert.alert('Success', `Income ${editingTransaction ? 'updated' : 'added'} successfully`);
      } catch (error) {
        Alert.alert('Error', 'Failed to save income');
      }
    }
  };

  const deleteTransaction = async (transactionId: string, type: TransactionType) => {
    Alert.alert(
      `Delete ${type === 'expense' ? 'Expense' : 'Income'}`,
      `Are you sure you want to delete this ${type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (type === 'expense') {
                const updatedExpenses = expenses.filter(expense => expense.id !== transactionId);
                await saveExpenses(updatedExpenses);
                setExpenses(updatedExpenses);
              } else {
                const updatedIncome = income.filter(item => item.id !== transactionId);
                await saveIncome(updatedIncome);
                setIncome(updatedIncome);
              }
            } catch (error) {
              Alert.alert('Error', `Failed to delete ${type}`);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCategoryIcon = (category: string) => {
    const iconProps = { size: 20, color: theme.colors.text.muted };
    
    switch (category.toLowerCase()) {
      case 'food & dining':
      case 'groceries':
        return <Utensils {...iconProps} />;
      case 'transportation':
        return <Car {...iconProps} />;
      case 'shopping':
        return <ShoppingCart {...iconProps} />;
      case 'bills & utilities':
        return <Zap {...iconProps} />;
      case 'healthcare':
        return <Heart {...iconProps} />;
      case 'education':
        return <GraduationCap {...iconProps} />;
      case 'travel':
        return <Plane {...iconProps} />;
      case 'entertainment':
        return <Coffee {...iconProps} />;
      default:
        return <Wallet {...iconProps} />;
    }
  };

  const getSourceIcon = (source: string) => {
    const iconProps = { size: 20, color: theme.colors.text.muted };
    
    switch (source.toLowerCase()) {
      case 'salary':
        return <Briefcase {...iconProps} />;
      case 'freelance':
        return <TrendingUp {...iconProps} />;
      case 'business':
        return <Building {...iconProps} />;
      case 'investments':
        return <PiggyBank {...iconProps} />;
      case 'rental':
        return <Home {...iconProps} />;
      default:
        return <Wallet {...iconProps} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: theme.colors.surface }]} 
          onPress={() => router.push('/')}
        >
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          {formatDateDisplay(startDate)} ~ {formatDateDisplay(endDate)}
        </Text>
        <TouchableOpacity 
          style={[styles.filterIconButton, { backgroundColor: theme.colors.surface }]} 
          onPress={() => setIsFilterModalVisible(true)}
        >
          <Menu size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.summaryAmount, { color: theme.colors.income }]}>
            +{settings.currency}{filteredTransactions.filter(t => t.type === 'income').reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.muted }]}>Total Income</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.summaryAmount, { color: theme.colors.success }]}>
            +{settings.currency}{filteredTransactions.filter(t => t.type === 'income' && (t as Income).recurring).reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.muted }]}>Recurring Income</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.summaryAmount, { color: theme.colors.expense }]}>
            -{settings.currency}{filteredTransactions.filter(t => t.type === 'expense').reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.muted }]}>Total Expense</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.summaryAmount, { color: 
            (filteredTransactions.filter(t => t.type === 'income').reduce((sum, item) => sum + item.amount, 0) - 
             filteredTransactions.filter(t => t.type === 'expense').reduce((sum, expense) => sum + expense.amount, 0)) >= 0 
            ? theme.colors.income : theme.colors.expense }]}>
            {settings.currency}{(filteredTransactions.filter(t => t.type === 'income').reduce((sum, item) => sum + item.amount, 0) - 
                                filteredTransactions.filter(t => t.type === 'expense').reduce((sum, expense) => sum + expense.amount, 0)).toLocaleString()}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.muted }]}>Wallet Balance</Text>
        </View>
      </View>

      {/* Transactions List */}
      <ScrollView 
        style={styles.transactionsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: theme.colors.text.secondary }]}>No transactions found</Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.text.muted }]}>
              Tap the + button to add your first transaction
            </Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => (
            <TouchableOpacity 
              key={transaction.id} 
              style={[
                styles.transactionCard, 
                { 
                  backgroundColor: theme.colors.surface,
                  borderLeftColor: transaction.type === 'expense' ? theme.colors.expense : theme.colors.income,
                  borderLeftWidth: 4
                }
              ]}
              onPress={() => openDetailModal(transaction)}
            >
              <View style={styles.transactionLeft}>
                <View style={styles.iconContainer}>
                  {transaction.type === 'expense' 
                    ? getCategoryIcon((transaction as Expense).category)
                    : getSourceIcon((transaction as Income).source)
                  }
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={[styles.transactionCategory, { color: theme.colors.text.primary }]}>
                    {transaction.type === 'expense' 
                      ? (transaction as Expense).category 
                      : (transaction as Income).source
                    }
                  </Text>
                  <Text style={[styles.transactionAccountDate, { color: theme.colors.text.muted }]}>
                    {transaction.account || 'Cash'} • {formatDate(transaction.date)}
                  </Text>
                  {/* <View style={[
                    styles.typeBadge, 
                    { backgroundColor: transaction.type === 'expense' 
                        ? (isDark ? '#7f1d1d' : '#fee2e2') 
                        : (isDark ? '#065f46' : '#d1fae5') 
                    }
                  ]}>
                    <Text style={[
                      styles.typeText, 
                      { color: transaction.type === 'expense' ? theme.colors.expense : theme.colors.income }
                    ]}>
                      {transaction.type === 'expense' ? 'Expense' : 'Income'}
                    </Text>
                  </View> */}
                </View>
              </View>
              
              <View style={styles.transactionActions}>
                <Text style={[
                  styles.transactionAmount, 
                  { color: transaction.type === 'expense' ? theme.colors.expense : theme.colors.income }
                ]}>
                  {transaction.type === 'expense' ? '-' : '+'}
                  {settings.currency}{transaction.amount.toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity 
        style={[styles.floatingAddButton, { backgroundColor: theme.colors.primary }]} 
        onPress={() => openModal('expense')}
      >
        <Plus size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={closeModal}
        avoidKeyboard
        style={styles.modal}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          {/* Toggle Buttons */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[
                styles.toggleButton,
                { backgroundColor: currentModalType === 'expense' ? theme.colors.expense : theme.colors.border }
              ]}
              onPress={() => setCurrentModalType('expense')}
            >
              <Text style={[
                styles.toggleText,
                { color: currentModalType === 'expense' ? '#fff' : theme.colors.text.muted }
              ]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.toggleButton,
                { backgroundColor: currentModalType === 'income' ? theme.colors.income : theme.colors.border }
              ]}
              onPress={() => setCurrentModalType('income')}
            >
              <Text style={[
                styles.toggleText,
                { color: currentModalType === 'income' ? '#fff' : theme.colors.text.muted }
              ]}>Income</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
            {editingTransaction 
              ? `Edit ${currentModalType === 'expense' ? 'Expense' : 'Income'}` 
              : `Add New ${currentModalType === 'expense' ? 'Expense' : 'Income'}`
            }
          </Text>
          
          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            {currentModalType === 'expense' ? (
              // Expense Form
              <>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Amount *</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme.colors.background, 
                      borderColor: theme.colors.border, 
                      color: theme.colors.text.primary 
                    }]}
                    placeholder="Enter amount"
                    placeholderTextColor={theme.colors.text.muted}
                    value={expenseFormData.amount}
                    onChangeText={(text) => setExpenseFormData({ ...expenseFormData, amount: text })}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Category *</Text>
                  <Picker
                    selectedValue={expenseFormData.category}
                    style={[styles.picker, { backgroundColor: theme.colors.background, color: theme.colors.text.primary }]}
                    onValueChange={(value) => setExpenseFormData({ ...expenseFormData, category: value })}
                  >
                    {EXPENSE_CATEGORIES.map(category => (
                      <Picker.Item key={category} label={category} value={category} />
                    ))}
                  </Picker>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Description</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme.colors.background, 
                      borderColor: theme.colors.border, 
                      color: theme.colors.text.primary 
                    }]}
                    placeholder="Enter description"
                    placeholderTextColor={theme.colors.text.muted}
                    value={expenseFormData.description}
                    onChangeText={(text) => setExpenseFormData({ ...expenseFormData, description: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Payment Method</Text>
                  <Picker
                    selectedValue={expenseFormData.paymentMethod}
                    style={[styles.picker, { backgroundColor: theme.colors.background, color: theme.colors.text.primary }]}
                    onValueChange={(value) => setExpenseFormData({ ...expenseFormData, paymentMethod: value })}
                  >
                    {PAYMENT_METHODS.map(method => (
                      <Picker.Item key={method} label={method} value={method} />
                    ))}
                  </Picker>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Account *</Text>
                  <Picker
                    selectedValue={expenseFormData.account}
                    style={[styles.picker, { backgroundColor: theme.colors.background, color: theme.colors.text.primary }]}
                    onValueChange={(value) => setExpenseFormData({ ...expenseFormData, account: value })}
                  >
                    {ACCOUNT_TYPES.map(account => (
                      <Picker.Item key={account} label={account} value={account} />
                    ))}
                  </Picker>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Location (Optional)</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme.colors.background, 
                      borderColor: theme.colors.border, 
                      color: theme.colors.text.primary 
                    }]}
                    placeholder="Enter location"
                    placeholderTextColor={theme.colors.text.muted}
                    value={expenseFormData.location}
                    onChangeText={(text) => setExpenseFormData({ ...expenseFormData, location: text })}
                  />
                </View>
              </>
            ) : (
              // Income Form
              <>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Amount *</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme.colors.background, 
                      borderColor: theme.colors.border, 
                      color: theme.colors.text.primary 
                    }]}
                    placeholder="Enter amount"
                    placeholderTextColor={theme.colors.text.muted}
                    value={incomeFormData.amount}
                    onChangeText={(text) => setIncomeFormData({ ...incomeFormData, amount: text })}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Source *</Text>
                  <Picker
                    selectedValue={incomeFormData.source}
                    style={[styles.picker, { backgroundColor: theme.colors.background, color: theme.colors.text.primary }]}
                    onValueChange={(value) => setIncomeFormData({ ...incomeFormData, source: value })}
                  >
                    {INCOME_SOURCES.map(source => (
                      <Picker.Item key={source} label={source} value={source} />
                    ))}
                  </Picker>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Description</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme.colors.background, 
                      borderColor: theme.colors.border, 
                      color: theme.colors.text.primary 
                    }]}
                    placeholder="Enter description"
                    placeholderTextColor={theme.colors.text.muted}
                    value={incomeFormData.description}
                    onChangeText={(text) => setIncomeFormData({ ...incomeFormData, description: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Account *</Text>
                  <Picker
                    selectedValue={incomeFormData.account}
                    style={[styles.picker, { backgroundColor: theme.colors.background, color: theme.colors.text.primary }]}
                    onValueChange={(value) => setIncomeFormData({ ...incomeFormData, account: value })}
                  >
                    {ACCOUNT_TYPES.map(account => (
                      <Picker.Item key={account} label={account} value={account} />
                    ))}
                  </Picker>
                </View>

                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={[styles.checkbox, { borderColor: theme.colors.border }, incomeFormData.recurring && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}
                    onPress={() => setIncomeFormData({ ...incomeFormData, recurring: !incomeFormData.recurring })}
                  >
                    {incomeFormData.recurring && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                  <Text style={[styles.checkboxLabel, { color: theme.colors.text.secondary }]}>Recurring Income</Text>
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.cancelButton, { backgroundColor: theme.colors.border }]} onPress={closeModal}>
              <Text style={[styles.cancelButtonText, { color: theme.colors.text.muted }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={saveTransaction}>
              <Text style={styles.saveButtonText}>
                {editingTransaction ? 'Update' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isVisible={isDetailModalVisible}
        onBackdropPress={closeDetailModal}
        style={styles.modal}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          {selectedTransaction && (
            <>
              <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                {selectedTransaction.type === 'expense' ? 'Expense' : 'Income'} Details
              </Text>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.muted }]}>Amount:</Text>
                <Text style={[styles.detailValue, { color: selectedTransaction.type === 'expense' ? theme.colors.expense : theme.colors.income }]}>
                  {selectedTransaction.type === 'expense' ? '-' : '+'}
                  {settings.currency}{selectedTransaction.amount.toLocaleString()}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.muted }]}>
                  {selectedTransaction.type === 'expense' ? 'Category:' : 'Source:'}
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>
                  {selectedTransaction.type === 'expense' 
                    ? (selectedTransaction as Expense).category 
                    : (selectedTransaction as Income).source
                  }
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.muted }]}>Account:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{selectedTransaction.account || 'Cash'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.muted }]}>Date:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{formatDate(selectedTransaction.date)}</Text>
              </View>
              
              {selectedTransaction.description && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.text.muted }]}>Description:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{selectedTransaction.description}</Text>
                </View>
              )}
              
              {selectedTransaction.type === 'expense' && (selectedTransaction as Expense).location && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.text.muted }]}>Location:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{(selectedTransaction as Expense).location}</Text>
                </View>
              )}
              
              <View style={styles.detailModalActions}>
                <TouchableOpacity 
                  style={[styles.detailButton, styles.deleteDetailButton, { backgroundColor: theme.colors.danger }]} 
                  onPress={() => {
                    closeDetailModal();
                    deleteTransaction(selectedTransaction.id, selectedTransaction.type);
                  }}
                >
                  <Text style={styles.detailButtonText}>Delete</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.detailButton, styles.editDetailButton, { backgroundColor: theme.colors.primary }]} 
                  onPress={() => {
                    closeDetailModal();
                    openModal(selectedTransaction.type, selectedTransaction);
                  }}
                >
                  <Text style={styles.detailButtonText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.detailButton, styles.cancelDetailButton, { backgroundColor: theme.colors.border }]} 
                  onPress={closeDetailModal}
                >
                  <Text style={[styles.detailButtonText, { color: theme.colors.text.muted }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        isVisible={isFilterModalVisible}
        onBackdropPress={() => setIsFilterModalVisible(false)}
        style={styles.modal}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.filterModalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>Advanced Filters</Text>
            <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
              <X size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            {/* Transaction Type Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: theme.colors.text.primary }]}>Transaction Type</Text>
              <View style={[styles.filterContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                <Picker
                  selectedValue={selectedType}
                  style={[styles.filterPicker, { color: theme.colors.text.primary }]}
                  onValueChange={setSelectedType}
                >
                  <Picker.Item label="All Transactions" value="all" />
                  <Picker.Item label="Expenses" value="expense" />
                  <Picker.Item label="Income" value="income" />
                </Picker>
              </View>
            </View>

            {/* Date Range Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: theme.colors.text.primary }]}>Date Range</Text>
              
              <View style={styles.dateRowContainer}>
                <View style={styles.dateInputContainer}>
                  <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Start Date</Text>
                  <TouchableOpacity 
                    style={[styles.datePickerButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                    onPress={() => openDatePicker(true)}
                  >
                    <Calendar size={20} color={theme.colors.text.muted} />
                    <Text style={[styles.datePickerText, { color: theme.colors.text.primary }]}>
                      {formatDateDisplay(startDate)}
                    </Text>
                    <ChevronDown size={20} color={theme.colors.text.muted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.dateInputContainer}>
                  <Text style={[styles.label, { color: theme.colors.text.secondary }]}>End Date</Text>
                  <TouchableOpacity 
                    style={[styles.datePickerButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                    onPress={() => openDatePicker(false)}
                  >
                    <Calendar size={20} color={theme.colors.text.muted} />
                    <Text style={[styles.datePickerText, { color: theme.colors.text.primary }]}>
                      {formatDateDisplay(endDate)}
                    </Text>
                    <ChevronDown size={20} color={theme.colors.text.muted} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Category/Source Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: theme.colors.text.primary }]}>Category/Source</Text>
              <View style={[styles.filterContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                <Picker
                  selectedValue={selectedCategory}
                  style={[styles.filterPicker, { color: theme.colors.text.primary }]}
                  onValueChange={setSelectedCategory}
                >
                  <Picker.Item label="All Categories/Sources" value="all" />
                  {EXPENSE_CATEGORIES.map(category => (
                    <Picker.Item key={`expense-${category}`} label={`${category} (Expense)`} value={category} />
                  ))}
                  {INCOME_SOURCES.map(source => (
                    <Picker.Item key={`income-${source}`} label={`${source} (Income)`} value={source} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Account Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: theme.colors.text.primary }]}>Account</Text>
              <View style={[styles.filterContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                <Picker
                  selectedValue={selectedAccount}
                  style={[styles.filterPicker, { color: theme.colors.text.primary }]}
                  onValueChange={setSelectedAccount}
                >
                  <Picker.Item label="All Accounts" value="all" />
                  {ACCOUNT_TYPES.map(account => (
                    <Picker.Item key={account} label={account} value={account} />
                  ))}
                </Picker>
              </View>
            </View>
          </ScrollView>

          <View style={styles.filterActions}>
            <TouchableOpacity style={[styles.clearButton, { backgroundColor: theme.colors.border }]} onPress={clearFilters}>
              <Text style={[styles.clearButtonText, { color: theme.colors.text.muted }]}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.applyButton, { backgroundColor: theme.colors.primary }]} onPress={() => setIsFilterModalVisible(false)}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        isVisible={isStartDatePickerVisible || isEndDatePickerVisible}
        onBackdropPress={() => {
          setIsStartDatePickerVisible(false);
          setIsEndDatePickerVisible(false);
        }}
        style={styles.modal}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.filterModalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
              Select {isSelectingStartDate ? 'Start' : 'End'} Date
            </Text>
            <TouchableOpacity onPress={() => {
              setIsStartDatePickerVisible(false);
              setIsEndDatePickerVisible(false);
            }}>
              <X size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          {/* Calendar Header */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.monthNavButton}>
              <ChevronLeft size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.monthYearText, { color: theme.colors.text.primary }]}>
              {monthNames[calendarMonth]} {calendarYear}
            </Text>
            <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.monthNavButton}>
              <ChevronRight size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          {/* Week Days Header */}
          <View style={styles.weekDaysContainer}>
            {weekDays.map((day) => (
              <Text key={day} style={[styles.weekDayText, { color: theme.colors.text.muted }]}>
                {day}
              </Text>
            ))}
          </View>
          
          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {generateCalendarDays().map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  {
                    backgroundColor: day.isSelected 
                      ? theme.colors.primary 
                      : day.isToday 
                        ? theme.colors.primary + '20'
                        : 'transparent'
                  }
                ]}
                onPress={() => day.isPastDate && day.isCurrentMonth ? selectDate(day.value) : null}
                disabled={!day.isPastDate || !day.isCurrentMonth}
              >
                <Text style={[
                  styles.calendarDayText,
                  {
                    color: day.isSelected
                      ? '#fff'
                      : !day.isCurrentMonth
                        ? theme.colors.text.muted + '50'
                        : !day.isPastDate
                          ? theme.colors.text.muted + '50'
                          : day.isToday
                            ? theme.colors.primary
                            : theme.colors.text.primary,
                    fontWeight: day.isToday || day.isSelected ? '600' : 'normal'
                  }
                ]}>
                  {day.date}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    gap: 8,
  },
  dateRangeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
    borderRadius: 25,
    padding: 4,
  },
  toggleButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 4,
    minWidth: 100,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingLeft: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterPicker: {
    flex: 1,
    height: 48,
  },
  transactionsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  transactionCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionAccountDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  transactionActions: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalScrollView: {
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  picker: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    minHeight: 48,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  detailModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  detailButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteDetailButton: {},
  editDetailButton: {},
  cancelDetailButton: {},
  detailButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  dateRowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateTextInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  datePickerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  filterSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  dateOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dateOptionText: {
    fontSize: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    marginBottom: 16,
  },
  monthNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginVertical: 2,
  },
  calendarDayText: {
    fontSize: 16,
    textAlign: 'center',
  },
});