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
import { Plus, Search, Filter, Edit, Trash2, ArrowLeft, ShoppingCart, Car, Utensils, Home, Zap, Heart, GraduationCap, Plane, Coffee, Wallet } from 'lucide-react-native';
import Modal from 'react-native-modal';
import { Picker } from '@react-native-picker/picker';
import { getExpenses, saveExpenses, getSettings } from '@/utils/storage';
import { Expense, EXPENSE_CATEGORIES, PAYMENT_METHODS, ACCOUNT_TYPES } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';

export default function ExpensesScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<any>({ currency: '₹' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    category: EXPENSE_CATEGORIES[0],
    description: '',
    paymentMethod: PAYMENT_METHODS[0],
    account: ACCOUNT_TYPES[0],
    location: '',
    recurring: false,
  });

  const loadData = async () => {
    try {
      const [expensesData, settingsData] = await Promise.all([
        getExpenses(),
        getSettings()
      ]);
      setExpenses(expensesData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading expenses:', error);
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

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormData({
      amount: '',
      category: EXPENSE_CATEGORIES[0],
      description: '',
      paymentMethod: PAYMENT_METHODS[0],
      account: ACCOUNT_TYPES[0],
      location: '',
      recurring: false,
    });
    setEditingExpense(null);
  };

  const openModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        amount: expense.amount.toString(),
        category: expense.category,
        description: expense.description,
        paymentMethod: expense.paymentMethod,
        account: expense.account || ACCOUNT_TYPES[0],
        location: expense.location || '',
        recurring: expense.recurring || false,
      });
    } else {
      resetForm();
    }
    setIsModalVisible(true);
  };

  const openDetailModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDetailModalVisible(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalVisible(false);
    setSelectedExpense(null);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    resetForm();
  };

  const saveExpense = async () => {
    if (!formData.amount || !formData.category || !formData.account) {
      Alert.alert('Error', 'Please fill in all required fields (Amount, Category, and Account)');
      return;
    }

    const expenseData: Expense = {
      id: editingExpense?.id || Date.now().toString(),
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      paymentMethod: formData.paymentMethod,
      account: formData.account,
      location: formData.location,
      recurring: formData.recurring,
      date: editingExpense?.date || new Date().toISOString(),
    };

    try {
      let updatedExpenses;
      if (editingExpense) {
        updatedExpenses = expenses.map(expense =>
          expense.id === editingExpense.id ? expenseData : expense
        );
      } else {
        updatedExpenses = [...expenses, expenseData];
      }

      await saveExpenses(updatedExpenses);
      setExpenses(updatedExpenses);
      closeModal();
      Alert.alert('Success', `Expense ${editingExpense ? 'updated' : 'added'} successfully`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save expense');
    }
  };

  const deleteExpense = async (expenseId: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedExpenses = expenses.filter(expense => expense.id !== expenseId);
              await saveExpenses(updatedExpenses);
              setExpenses(updatedExpenses);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete expense');
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
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Expenses</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]} onPress={() => openModal()}>
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.surface }]}>
          <Search size={20} color={theme.colors.text.muted} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text.primary }]}
            placeholder="Search expenses..."
            placeholderTextColor={theme.colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={[styles.filterContainer, { backgroundColor: theme.colors.surface }]}>
          <Filter size={16} color={theme.colors.text.muted} />
          <Picker
            selectedValue={selectedCategory}
            style={[styles.filterPicker, { color: theme.colors.text.primary }]}
            onValueChange={setSelectedCategory}
          >
            <Picker.Item label="All Categories" value="all" />
            {EXPENSE_CATEGORIES.map(category => (
              <Picker.Item key={category} label={category} value={category} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Expenses List */}
      <ScrollView 
        style={styles.expensesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: theme.colors.text.secondary }]}>No expenses found</Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.text.muted }]}>
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter'
                : 'Tap the + button to add your first expense'
              }
            </Text>
          </View>
        ) : (
          filteredExpenses.map((expense) => (
            <TouchableOpacity 
              key={expense.id} 
              style={[styles.expenseCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => openDetailModal(expense)}
            >
              <View style={styles.expenseLeft}>
                <View style={styles.iconContainer}>
                  {getCategoryIcon(expense.category)}
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={[styles.expenseCategory, { color: theme.colors.text.primary }]}>{expense.category}</Text>
                  <Text style={[styles.expenseAccountDate, { color: theme.colors.text.muted }]}>
                    {expense.account || 'Cash'} • {formatDate(expense.date)}
                  </Text>
                  {expense.location && (
                    <Text style={[styles.expenseLocation, { color: theme.colors.text.muted }]}>📍 {expense.location}</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.expenseActions}>
                <Text style={[styles.expenseAmount, { color: theme.colors.expense }]}>
                  {settings.currency}{expense.amount.toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
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
            {editingExpense ? 'Edit Expense' : 'Add New Expense'}
          </Text>
          
          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
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
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Category *</Text>
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
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Description</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.background, 
                  borderColor: theme.colors.border, 
                  color: theme.colors.text.primary 
                }]}
                placeholder="Enter description"
                placeholderTextColor={theme.colors.text.muted}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Payment Method</Text>
              <Picker
                selectedValue={formData.paymentMethod}
                style={[styles.picker, { backgroundColor: theme.colors.background, color: theme.colors.text.primary }]}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              >
                {PAYMENT_METHODS.map(method => (
                  <Picker.Item key={method} label={method} value={method} />
                ))}
              </Picker>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Account *</Text>
              <Picker
                selectedValue={formData.account}
                style={[
                  styles.picker, 
                  { 
                    backgroundColor: theme.colors.background, 
                    color: theme.colors.text.primary,
                    borderWidth: 1,
                    borderColor: theme.colors.border
                  }
                ]}
                onValueChange={(value) => setFormData({ ...formData, account: value })}
                dropdownIconColor={theme.colors.text.muted}
              >
                {ACCOUNT_TYPES.map(account => (
                  <Picker.Item 
                    key={account} 
                    label={account} 
                    value={account}
                    color={theme.colors.text.primary}
                  />
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
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.cancelButton, { backgroundColor: theme.colors.border }]} onPress={closeModal}>
              <Text style={[styles.cancelButtonText, { color: theme.colors.text.muted }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={saveExpense}>
              <Text style={styles.saveButtonText}>
                {editingExpense ? 'Update' : 'Save'}
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
          {selectedExpense && (
            <>
              <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>Expense Details</Text>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.muted }]}>Amount:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.expense }]}>
                  {settings.currency}{selectedExpense.amount.toLocaleString()}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.muted }]}>Category:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{selectedExpense.category}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.muted }]}>Account:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{selectedExpense.account || 'Cash'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.muted }]}>Payment Method:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{selectedExpense.paymentMethod}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.muted }]}>Date:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{formatDate(selectedExpense.date)}</Text>
              </View>
              
              {selectedExpense.description && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.text.muted }]}>Description:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{selectedExpense.description}</Text>
                </View>
              )}
              
              {selectedExpense.location && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.text.muted }]}>Location:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{selectedExpense.location}</Text>
                </View>
              )}
              
              <View style={styles.detailModalActions}>
                <TouchableOpacity 
                  style={[styles.detailButton, styles.deleteDetailButton, { backgroundColor: theme.colors.danger }]} 
                  onPress={() => {
                    closeDetailModal();
                    deleteExpense(selectedExpense.id);
                  }}
                >
                  <Text style={styles.detailButtonText}>Delete</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.detailButton, styles.editDetailButton, { backgroundColor: theme.colors.primary }]} 
                  onPress={() => {
                    closeDetailModal();
                    openModal(selectedExpense);
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
  expensesList: {
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
  expenseCard: {
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
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  expenseAccount: {
    fontSize: 12,
    marginBottom: 4,
  },
  expenseAccountDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  expenseLocation: {
    fontSize: 12,
    color: '#6b7280',
  },
  expenseActions: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
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
    maxHeight: '100%',
  },
  modalScrollView: {
    maxHeight: '100%',
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
});