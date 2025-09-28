import React, { useState, useEffect, useMemo } from 'react';
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
import { Plus, Target, AlertTriangle, Edit, Trash2, ArrowLeft } from 'lucide-react-native';
import Modal from 'react-native-modal';
import { Picker } from '@react-native-picker/picker';
import { getBudgets, saveBudgets, getExpenses, getSettings } from '@/utils/storage';
import { Budget, Expense, EXPENSE_CATEGORIES } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';

export default function BudgetScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<any>({ currency: '₹' });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    category: EXPENSE_CATEGORIES[0],
    amount: '',
    period: 'monthly' as 'weekly' | 'monthly',
    alerts: true,
  });

  const loadData = async () => {
    try {
      const [budgetsData, expensesData, settingsData] = await Promise.all([
        getBudgets(),
        getExpenses(),
        getSettings()
      ]);
      setBudgets(budgetsData);
      setExpenses(expensesData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading budget data:', error);
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

  // Calculate spent amounts for each budget
  const budgetsWithSpent = budgets.map(budget => {
    const currentDate = new Date();
    const categoryExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const isCurrentPeriod = budget.period === 'monthly'
        ? expenseDate.getMonth() === currentDate.getMonth() && 
          expenseDate.getFullYear() === currentDate.getFullYear()
        : true; // Simplified for demo
      
      return expense.category === budget.category && isCurrentPeriod;
    });

    const spent = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    return {
      ...budget,
      spent,
      percentage: budget.amount > 0 ? (spent / budget.amount) * 100 : 0,
      isOverBudget: spent > budget.amount,
      isNearLimit: spent > budget.amount * 0.8 && spent <= budget.amount,
    };
  });

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = budgetsWithSpent.reduce((sum, budget) => sum + budget.spent, 0);
  const overBudgetCount = budgetsWithSpent.filter(budget => budget.isOverBudget).length;

  const resetForm = () => {
    setFormData({
      category: EXPENSE_CATEGORIES[0],
      amount: '',
      period: 'monthly',
      alerts: true,
    });
    setEditingBudget(null);
  };

  const openModal = (budget?: Budget) => {
    if (budget) {
      setEditingBudget(budget);
      setFormData({
        category: budget.category,
        amount: budget.amount.toString(),
        period: budget.period,
        alerts: budget.alerts,
      });
    } else {
      resetForm();
    }
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    resetForm();
  };

  const saveBudget = async () => {
    if (!formData.amount || !formData.category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Check if budget already exists for this category
    const existingBudget = budgets.find(
      budget => budget.category === formData.category && budget.id !== editingBudget?.id
    );

    if (existingBudget) {
      Alert.alert('Error', 'Budget already exists for this category');
      return;
    }

    const budgetData: Budget = {
      id: editingBudget?.id || Date.now().toString(),
      category: formData.category,
      amount: parseFloat(formData.amount),
      period: formData.period,
      alerts: formData.alerts,
      spent: editingBudget?.spent || 0,
    };

    try {
      let updatedBudgets;
      if (editingBudget) {
        updatedBudgets = budgets.map(budget =>
          budget.id === editingBudget.id ? budgetData : budget
        );
      } else {
        updatedBudgets = [...budgets, budgetData];
      }

      await saveBudgets(updatedBudgets);
      setBudgets(updatedBudgets);
      closeModal();
      Alert.alert('Success', `Budget ${editingBudget ? 'updated' : 'created'} successfully`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save budget');
    }
  };

  const deleteBudget = async (budgetId: string) => {
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedBudgets = budgets.filter(budget => budget.id !== budgetId);
              await saveBudgets(updatedBudgets);
              setBudgets(updatedBudgets);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete budget');
            }
          },
        },
      ]
    );
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
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Budget</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]} onPress={() => openModal()}>
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <Target size={24} color={theme.colors.primary} />
          <Text style={[styles.summaryAmount, { color: theme.colors.text.primary }]}>
            {settings.currency}{totalBudget.toLocaleString()}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.muted }]}>Total Budget</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.summaryAmount, { color: theme.colors.text.primary }]}>
            {settings.currency}{totalSpent.toLocaleString()}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.muted }]}>Total Spent</Text>
          <Text style={[
            styles.summaryPercentage,
            { color: totalSpent > totalBudget ? theme.colors.danger : theme.colors.success }
          ]}>
            {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%
          </Text>
        </View>

        {overBudgetCount > 0 && (
          <View style={[styles.summaryCard, styles.alertCard, { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.danger }]}>
            <AlertTriangle size={24} color={theme.colors.danger} />
            <Text style={[styles.alertCount, { color: theme.colors.danger }]}>{overBudgetCount}</Text>
            <Text style={[styles.alertLabel, { color: theme.colors.danger }]}>Over Budget</Text>
          </View>
        )}
      </View>

      {/* Budget List */}
      <ScrollView 
        style={styles.budgetList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {budgetsWithSpent.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: theme.colors.text.secondary }]}>No budgets set</Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.text.muted }]}>
              Tap the + button to create your first budget
            </Text>
          </View>
        ) : (
          budgetsWithSpent.map((budget) => (
            <View key={budget.id} style={[styles.budgetCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.budgetHeader}>
                <View style={styles.budgetInfo}>
                  <Text style={[styles.budgetCategory, { color: theme.colors.text.primary }]}>{budget.category}</Text>
                  <Text style={[styles.budgetPeriod, { color: theme.colors.text.muted }]}>{budget.period}</Text>
                </View>
                
                <View style={styles.budgetActions}>
                  <TouchableOpacity
                    style={[styles.editButton, { backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' }]}
                    onPress={() => openModal(budget)}
                  >
                    <Edit size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: isDark ? '#7f1d1d' : '#fef2f2' }]}
                    onPress={() => deleteBudget(budget.id)}
                  >
                    <Trash2 size={16} color={theme.colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.budgetAmounts}>
                <Text style={[styles.spentAmount, { color: theme.colors.text.primary }]}>
                  {settings.currency}{budget.spent.toLocaleString()}
                </Text>
                <Text style={[styles.budgetTotal, { color: theme.colors.text.muted }]}>
                  / {settings.currency}{budget.amount.toLocaleString()}
                </Text>
              </View>

              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                  <View 
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(budget.percentage, 100)}%`,
                        backgroundColor: budget.isOverBudget 
                          ? theme.colors.danger
                          : budget.isNearLimit 
                            ? theme.colors.warning
                            : theme.colors.success
                      }
                    ]} 
                  />
                </View>
                <Text style={[
                  styles.progressText,
                  { color: budget.isOverBudget ? theme.colors.danger : theme.colors.text.muted }
                ]}>
                  {Math.round(budget.percentage)}%
                </Text>
              </View>

              {budget.isOverBudget && (
                <View style={[styles.warningContainer, { backgroundColor: isDark ? '#7f1d1d' : '#fef2f2' }]}>
                  <AlertTriangle size={16} color={theme.colors.danger} />
                  <Text style={[styles.warningText, { color: theme.colors.danger }]}>
                    Over budget by {settings.currency}{(budget.spent - budget.amount).toLocaleString()}
                  </Text>
                </View>
              )}

              {budget.isNearLimit && !budget.isOverBudget && (
                <View style={[styles.cautionContainer, { backgroundColor: isDark ? '#92400e' : '#fffbeb' }]}>
                  <AlertTriangle size={16} color={theme.colors.warning} />
                  <Text style={[styles.cautionText, { color: theme.colors.warning }]}>
                    Nearing budget limit
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={closeModal}
        avoidKeyboard
        style={styles.modal}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
            {editingBudget ? 'Edit Budget' : 'Create New Budget'}
          </Text>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Category</Text>
            <Picker
              selectedValue={formData.category}
              style={[styles.picker, { backgroundColor: theme.colors.background, color: theme.colors.text.primary }]}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              {EXPENSE_CATEGORIES.map(category => (
                <Picker.Item key={category} label={category} value={category} />
              ))}
            </Picker>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Budget Amount *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.background, 
                borderColor: theme.colors.border, 
                color: theme.colors.text.primary 
              }]}
              placeholder="Enter budget amount"
              placeholderTextColor={theme.colors.text.muted}
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Period</Text>
            <Picker
              selectedValue={formData.period}
              style={[styles.picker, { backgroundColor: theme.colors.background, color: theme.colors.text.primary }]}
              onValueChange={(value) => setFormData({ ...formData, period: value })}
            >
              <Picker.Item label="Weekly" value="weekly" />
              <Picker.Item label="Monthly" value="monthly" />
            </Picker>
          </View>

          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[styles.checkbox, { borderColor: theme.colors.border }, formData.alerts && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}
              onPress={() => setFormData({ ...formData, alerts: !formData.alerts })}
            >
              {formData.alerts && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <Text style={[styles.checkboxLabel, { color: theme.colors.text.secondary }]}>Enable Alerts</Text>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.cancelButton, { backgroundColor: theme.colors.border }]} onPress={closeModal}>
              <Text style={[styles.cancelButtonText, { color: theme.colors.text.muted }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={saveBudget}>
              <Text style={styles.saveButtonText}>
                {editingBudget ? 'Update' : 'Create'}
              </Text>
            </TouchableOpacity>
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  alertCard: {
    borderLeftWidth: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  summaryPercentage: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  alertCount: {
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 4,
  },
  alertLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  budgetList: {
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
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  budgetCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  budgetPeriod: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  budgetActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  budgetAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  spentAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  budgetTotal: {
    fontSize: 16,
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  cautionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  cautionText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  picker: {
    borderRadius: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});