import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { Calendar, TrendingDown, TrendingUp, Filter, ChevronDown, ArrowLeft } from 'lucide-react-native';
import { getExpenses, getIncome, getSettings } from '@/utils/storage';
import { Expense, Income } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';

const screenWidth = Dimensions.get('window').width;

export default function ReportsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [settings, setSettings] = useState<any>({ currency: '₹' });
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [refreshing, setRefreshing] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);

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
      console.error('Error loading reports data:', error);
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

  const filteredData = useMemo(() => {
    const currentDate = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(currentDate.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    }

    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= currentDate;
    });

    const filteredIncome = income.filter(incomeItem => {
      const incomeDate = new Date(incomeItem.date);
      return incomeDate >= startDate && incomeDate <= currentDate;
    });

    return { expenses: filteredExpenses, income: filteredIncome };
  }, [expenses, income, selectedPeriod]);

  const categoryData = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};
    
    filteredData.expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const categories = Object.keys(categoryTotals);
    const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

    if (totalExpenses === 0) return [];

    const colors = [
      '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
      '#EC4899', '#F97316', '#84CC16', '#06B6D4', '#6366F1'
    ];

    return categories.map((category, index) => ({
      name: category,
      population: categoryTotals[category],
      color: colors[index % colors.length],
      legendFontColor: theme.colors.text.secondary,
      legendFontSize: 12,
    }));
  }, [filteredData.expenses]);

  const monthlyTrend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    const monthlyData = months.map((month, index) => {
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === index && expenseDate.getFullYear() === currentYear;
      }).reduce((sum, expense) => sum + expense.amount, 0);

      const monthIncome = income.filter(incomeItem => {
        const incomeDate = new Date(incomeItem.date);
        return incomeDate.getMonth() === index && incomeDate.getFullYear() === currentYear;
      }).reduce((sum, incomeItem) => sum + incomeItem.amount, 0);

      return {
        month,
        expenses: monthExpenses,
        income: monthIncome,
      };
    });

    return {
      labels: months.slice(0, currentDate.getMonth() + 1),
      datasets: [
        {
          data: monthlyData.slice(0, currentDate.getMonth() + 1).map(d => d.expenses),
          color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
          strokeWidth: 2
        },
        {
          data: monthlyData.slice(0, currentDate.getMonth() + 1).map(d => d.income),
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };
  }, [expenses, income]);

  const stats = useMemo(() => {
    const totalExpenses = filteredData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalIncome = filteredData.income.reduce((sum, incomeItem) => sum + incomeItem.amount, 0);
    const balance = totalIncome - totalExpenses;
    
    const averageExpense = filteredData.expenses.length > 0 
      ? totalExpenses / filteredData.expenses.length 
      : 0;

    const topCategory = categoryData.length > 0 
      ? categoryData.reduce((max, category) => 
          category.population > max.population ? category : max, categoryData[0])
      : null;

    return {
      totalExpenses,
      totalIncome,
      balance,
      averageExpense,
      topCategory,
      transactionCount: filteredData.expenses.length + filteredData.income.length
    };
  }, [filteredData, categoryData]);

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${isDark ? '96, 165, 250' : '59, 130, 246'}, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.text.secondary,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 12,
    },
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
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Reports</Text>
        <View style={styles.periodSelector}>
          <Filter size={16} color={theme.colors.text.muted} />
        <TouchableOpacity 
          style={[styles.periodButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => setShowPeriodModal(true)}
        >
          <Text style={[styles.periodButtonText, { color: theme.colors.text.primary }]}>
            {selectedPeriod === 'week' ? 'This Week' : 
             selectedPeriod === 'month' ? 'This Month' : 'This Year'}
          </Text>
          <ChevronDown size={16} color={theme.colors.text.muted} />
        </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Key Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <TrendingDown size={20} color={theme.colors.expense} />
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
              {settings.currency}{stats.totalExpenses.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.muted }]}>Total Expenses</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <TrendingUp size={20} color={theme.colors.income} />
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
              {settings.currency}{stats.totalIncome.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.muted }]}>Total Income</Text>
          </View>

          <View style={[styles.statCard, styles.balanceCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[
              styles.statValue,
              { color: stats.balance >= 0 ? theme.colors.success : theme.colors.danger }
            ]}>
              {settings.currency}{Math.abs(stats.balance).toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.muted }]}>
              {stats.balance >= 0 ? 'Surplus' : 'Deficit'}
            </Text>
          </View>
        </View>

        {/* Additional Stats */}
        <View style={[styles.additionalStats, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.additionalStatRow}>
            <Text style={[styles.additionalStatLabel, { color: theme.colors.text.muted }]}>Transactions</Text>
            <Text style={[styles.additionalStatValue, { color: theme.colors.text.primary }]}>{stats.transactionCount}</Text>
          </View>
          <View style={styles.additionalStatRow}>
            <Text style={[styles.additionalStatLabel, { color: theme.colors.text.muted }]}>Average Expense</Text>
            <Text style={[styles.additionalStatValue, { color: theme.colors.text.primary }]}>
              {settings.currency}{Math.round(stats.averageExpense)}
            </Text>
          </View>
          {stats.topCategory && (
            <View style={styles.additionalStatRow}>
              <Text style={[styles.additionalStatLabel, { color: theme.colors.text.muted }]}>Top Category</Text>
              <Text style={[styles.additionalStatValue, { color: theme.colors.text.primary }]}>{stats.topCategory.name}</Text>
            </View>
          )}
        </View>

        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <View style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.chartTitle, { color: theme.colors.text.primary }]}>Expense Breakdown</Text>
            <PieChart
              data={categoryData}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 0]}
              absolute
            />
          </View>
        )}

        {/* Monthly Trend */}
        {monthlyTrend.labels.length > 1 && (
          <View style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.chartTitle, { color: theme.colors.text.primary }]}>Monthly Trend</Text>
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: theme.colors.expense }]} />
                <Text style={[styles.legendText, { color: theme.colors.text.muted }]}>Expenses</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: theme.colors.income }]} />
                <Text style={[styles.legendText, { color: theme.colors.text.muted }]}>Income</Text>
              </View>
            </View>
            <BarChart
              data={monthlyTrend}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              verticalLabelRotation={30}
              fromZero
              showBarTops={false}
              yAxisLabel=""
              yAxisSuffix=""
              style={styles.chart}
            />
          </View>
        )}

        {/* Top Expenses */}
        {filteredData.expenses.length > 0 && (
          <View style={[styles.topExpensesContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Top Expenses</Text>
            {filteredData.expenses
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 5)
              .map((expense, index) => (
                <View key={expense.id} style={[styles.topExpenseItem, { borderBottomColor: theme.colors.border }]}>
                  <View style={[styles.expenseRank, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.expenseDetails}>
                    <Text style={[styles.expenseDescription, { color: theme.colors.text.primary }]}>{expense.description}</Text>
                    <Text style={[styles.expenseCategory, { color: theme.colors.text.muted }]}>{expense.category}</Text>
                  </View>
                  <Text style={[styles.expenseAmount, { color: theme.colors.expense }]}>
                    {settings.currency}{expense.amount.toLocaleString()}
                  </Text>
                </View>
              ))
            }
          </View>
        )}

        {/* Empty State */}
        {filteredData.expenses.length === 0 && filteredData.income.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: theme.colors.text.secondary }]}>No data available</Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.text.muted }]}>
              Add some expenses or income to see reports
            </Text>
          </View>
        )}
      </ScrollView>
      
      {/* Period Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPeriodModal}
        onRequestClose={() => setShowPeriodModal(false)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}
          activeOpacity={1}
          onPress={() => setShowPeriodModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>Select Period</Text>
            {[
              { label: 'This Week', value: 'week' },
              { label: 'This Month', value: 'month' },
              { label: 'This Year', value: 'year' }
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.modalOption,
                  { backgroundColor: theme.colors.background },
                  selectedPeriod === option.value && { backgroundColor: theme.colors.primary }
                ]}
                onPress={() => {
                  setSelectedPeriod(option.value);
                  setShowPeriodModal(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  { color: theme.colors.text.primary },
                  selectedPeriod === option.value && { color: '#ffffff' }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    color: '#1f2937',
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
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  periodPicker: {
    width: 120,
    height: 40,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  additionalStats: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  additionalStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  additionalStatLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  additionalStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  chartContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  chart: {
    borderRadius: 16,
  },
  topExpensesContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  topExpenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  expenseRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  expenseDetails: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  expenseCategory: {
    fontSize: 12,
    color: '#6b7280',
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
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
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 120,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  selectedOption: {
    backgroundColor: '#3B82F6',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
});