import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { TrendingUp, TrendingDown, Wallet, AlertTriangle, User, Bell, ShoppingCart, Car, Utensils, Home, Zap, Heart, GraduationCap, Plane, Coffee } from 'lucide-react-native';
import { getExpenses, getIncome, getBudgets, getSettings, getUserProfile } from '@/utils/storage';
import { Expense, Income, Budget, UserProfile } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

export default function Dashboard() {
  const { theme, isDark } = useTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [settings, setSettings] = useState<any>({ currency: '₹' });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [expensesData, incomeData, budgetsData, settingsData, profileData] = await Promise.all([
        getExpenses(),
        getIncome(),
        getBudgets(),
        getSettings(),
        getUserProfile()
      ]);
      
      setExpenses(expensesData);
      setIncome(incomeData);
      setBudgets(budgetsData);
      setSettings(settingsData);
      
      // If no profile exists, create a default one
      if (!profileData) {
        const defaultProfile: UserProfile = {
          id: 'user_' + Date.now(),
          name: 'User',
          email: '',
          dateJoined: new Date().toISOString()
        };
        setUserProfile(defaultProfile);
      } else {
        setUserProfile(profileData);
      }
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  const getCurrentMonthYear = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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

  const stats = useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Calculate monthly totals
    const monthlyExpenses = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })
      .reduce((sum, expense) => sum + expense.amount, 0);

    const monthlyIncome = income
      .filter(incomeItem => {
        const incomeDate = new Date(incomeItem.date);
        return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear;
      })
      .reduce((sum, incomeItem) => sum + incomeItem.amount, 0);

    const balance = monthlyIncome - monthlyExpenses;

    // Budget alerts
    const budgetAlerts = budgets.filter(budget => {
      const categoryExpenses = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date);
          const isCurrentPeriod = budget.period === 'monthly' 
            ? expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
            : true; // Simplified for demo
          return expense.category === budget.category && isCurrentPeriod;
        })
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      return categoryExpenses > budget.amount * 0.8; // Alert at 80% of budget
    });

    return {
      monthlyExpenses,
      monthlyIncome,
      balance,
      budgetAlerts: budgetAlerts.length
    };
  }, [expenses, income, budgets]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with Profile */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              {userProfile?.profileImage ? (
                <Image source={{ uri: userProfile.profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.defaultProfileImage}>
                  <User size={24} color="#6b7280" />
                </View>
              )}
            </View>
            <View style={styles.greetingSection}>
              <Text style={[styles.greetingText, { color: theme.colors.text.muted }]}>{getGreeting()}</Text>
              <Text style={[styles.userName, { color: theme.colors.text.primary }]}>{userProfile?.name || 'User'}!</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.settingsButton, { backgroundColor: theme.colors.surface }]}>
            <Bell size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, styles.incomeCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.cardHeader}>
              <TrendingUp size={24} color={theme.colors.income} />
              <Text style={[styles.cardTitle, { color: theme.colors.text.muted }]}>Income</Text>
            </View>
            <Text style={[styles.cardAmount, { color: theme.colors.text.primary }]}>
              {settings.currency}{stats.monthlyIncome.toLocaleString()}
            </Text>
            <Text style={[styles.cardPeriod, { color: theme.colors.text.muted }]}>This month</Text>
          </View>

          <View style={[styles.summaryCard, styles.expenseCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.cardHeader}>
              <TrendingDown size={24} color={theme.colors.expense} />
              <Text style={[styles.cardTitle, { color: theme.colors.text.muted }]}>Expenses</Text>
            </View>
            <Text style={[styles.cardAmount, { color: theme.colors.text.primary }]}>
              {settings.currency}{stats.monthlyExpenses.toLocaleString()}
            </Text>
            <Text style={[styles.cardPeriod, { color: theme.colors.text.muted }]}>This month</Text>
          </View>
        </View>

        {/* Balance Card */}
        <View style={[styles.balanceCard, stats.balance >= 0 ? styles.positiveBalance : styles.negativeBalance]}>
          <View style={styles.cardHeader}>
            <Wallet size={24} color="#fff" />
            <Text style={styles.balanceTitle}>Current Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>
            {settings.currency}{Math.abs(stats.balance).toLocaleString()}
          </Text>
          <Text style={styles.balanceStatus}>
            {stats.balance >= 0 ? 'Surplus' : 'Deficit'} this month
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={[styles.quickStats, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Quick Stats</Text>
            <Text style={[styles.monthYear, { color: theme.colors.text.muted }]}>{getCurrentMonthYear()}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.colors.text.muted }]}>Total Transactions</Text>
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>{expenses.length + income.length}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.colors.text.muted }]}>Budget Alerts</Text>
            <View style={[styles.alertBadge, { backgroundColor: isDark ? '#7f1d1d' : '#fef2f2' }]}>
              <AlertTriangle size={16} color={theme.colors.danger} />
              <Text style={[styles.alertText, { color: theme.colors.danger }]}>{stats.budgetAlerts}</Text>
            </View>
          </View>
          
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.colors.text.muted }]}>Avg Daily Spend</Text>
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
              {settings.currency}{Math.round(stats.monthlyExpenses / new Date().getDate())}
            </Text>
          </View>
        </View>

        {/* Recent Activity Preview */}
        <View style={[styles.recentActivity, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Recent Activity</Text>
            <Text style={[styles.monthYear, { color: theme.colors.text.muted }]}>{getCurrentMonthYear()}</Text>
          </View>
          {expenses.slice(0, 3).map((expense) => (
            <View key={expense.id} style={[styles.activityItem, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.activityLeft}>
                <View style={styles.iconContainer}>
                  {getCategoryIcon(expense.category)}
                </View>
                <View style={styles.activityInfo}>
                  <Text style={[styles.activityCategory, { color: theme.colors.text.primary }]}>{expense.category}</Text>
                  <Text style={[styles.activityAccount, { color: theme.colors.text.muted }]}>{expense.account || 'Cash'}</Text>
                </View>
              </View>
              <View style={styles.activityRight}>
                <Text style={[styles.activityAmount, { color: theme.colors.expense }]}>-{settings.currency}{expense.amount}</Text>
                <View style={[styles.expenseIndicator, { backgroundColor: "white" }]} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImageContainer: {
    marginRight: 12,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultProfileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingSection: {
    flex: 1,
  },
  greetingText: {
    fontSize: 16,
    marginBottom: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
  },
  settingsButton: {
    padding: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  cardAmount: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardPeriod: {
    fontSize: 12,
  },
  balanceCard: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  positiveBalance: {
    backgroundColor: '#059669',
  },
  negativeBalance: {
    backgroundColor: '#DC2626',
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginVertical: 8,
  },
  balanceStatus: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  quickStats: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  monthYear: {
    fontSize: 14,
    fontWeight: '500',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  recentActivity: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  activityLeft: {
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
  activityInfo: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityCategory: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityAccount: {
    fontSize: 12,
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  expenseIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});