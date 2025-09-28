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
import { Plus, Search, Edit, Trash2, DollarSign, ArrowLeft, Briefcase, TrendingUp, Building, PiggyBank, Home, Wallet } from 'lucide-react-native';
import Modal from 'react-native-modal';
import { Picker } from '@react-native-picker/picker';
import { getIncome, saveIncome, getSettings } from '@/utils/storage';
import { Income, INCOME_SOURCES, ACCOUNT_TYPES } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';

export default function IncomeScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const [income, setIncome] = useState<Income[]>([]);
  const [settings, setSettings] = useState<any>({ currency: '₹' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    source: INCOME_SOURCES[0],
    description: '',
    account: ACCOUNT_TYPES[0],
    recurring: false,
  });

  const loadData = async () => {
    try {
      const [incomeData, settingsData] = await Promise.all([
        getIncome(),
        getSettings()
      ]);
      setIncome(incomeData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading income:', error);
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

  const filteredIncome = income.filter(incomeItem => {
    return incomeItem.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
           incomeItem.source.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalIncome = income.reduce((sum, incomeItem) => sum + incomeItem.amount, 0);
  const monthlyRecurringIncome = income
    .filter(incomeItem => incomeItem.recurring)
    .reduce((sum, incomeItem) => sum + incomeItem.amount, 0);

  const resetForm = () => {
    setFormData({
      amount: '',
      source: INCOME_SOURCES[0],
      description: '',
      account: ACCOUNT_TYPES[0],
      recurring: false,
    });
    setEditingIncome(null);
  };

  const openModal = (incomeItem?: Income) => {
    if (incomeItem) {
      setEditingIncome(incomeItem);
      setFormData({
        amount: incomeItem.amount.toString(),
        source: incomeItem.source,
        description: incomeItem.description,
        account: incomeItem.account || ACCOUNT_TYPES[0],
        recurring: incomeItem.recurring || false,
      });
    } else {
      resetForm();
    }
    setIsModalVisible(true);
  };

  const openDetailModal = (incomeItem: Income) => {
    setSelectedIncome(incomeItem);
    setIsDetailModalVisible(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalVisible(false);
    setSelectedIncome(null);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    resetForm();
  };

  const saveIncomeItem = async () => {
    if (!formData.amount || !formData.source || !formData.account) {
      Alert.alert('Error', 'Please fill in all required fields (Amount, Source, and Account)');
      return;
    }

    const incomeData: Income = {
      id: editingIncome?.id || Date.now().toString(),
      amount: parseFloat(formData.amount),
      source: formData.source,
      description: formData.description,
      account: formData.account,
      recurring: formData.recurring,
      date: editingIncome?.date || new Date().toISOString(),
    };

    try {
      let updatedIncome;
      if (editingIncome) {
        updatedIncome = income.map(item =>
          item.id === editingIncome.id ? incomeData : item
        );
      } else {
        updatedIncome = [...income, incomeData];
      }

      await saveIncome(updatedIncome);
      setIncome(updatedIncome);
      closeModal();
      Alert.alert('Success', `Income ${editingIncome ? 'updated' : 'added'} successfully`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save income');
    }
  };

  const deleteIncome = async (incomeId: string) => {
    Alert.alert(
      'Delete Income',
      'Are you sure you want to delete this income record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedIncome = income.filter(item => item.id !== incomeId);
              await saveIncome(updatedIncome);
              setIncome(updatedIncome);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete income');
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
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Income</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]} onPress={() => openModal()}>
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <DollarSign size={24} color={theme.colors.income} />
          <Text style={[styles.summaryAmount, { color: theme.colors.text.primary }]}>
            {settings.currency}{totalIncome.toLocaleString()}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.muted }]}>Total Income</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
          <DollarSign size={24} color={theme.colors.success} />
          <Text style={[styles.summaryAmount, { color: theme.colors.text.primary }]}>
            {settings.currency}{monthlyRecurringIncome.toLocaleString()}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.text.muted }]}>Monthly Recurring</Text>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <Search size={20} color={theme.colors.text.muted} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text.primary }]}
          placeholder="Search income..."
          placeholderTextColor={theme.colors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Income List */}
      <ScrollView 
        style={styles.incomeList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredIncome.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: theme.colors.text.secondary }]}>No income records found</Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.text.muted }]}>
              {searchQuery 
                ? 'Try adjusting your search'
                : 'Tap the + button to add your first income record'
              }
            </Text>
          </View>
        ) : (
          filteredIncome.map((incomeItem) => (
            <TouchableOpacity 
              key={incomeItem.id} 
              style={[styles.incomeCard, { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.income }]}
              onPress={() => openDetailModal(incomeItem)}
            >
              <View style={styles.incomeLeft}>
                <View style={styles.iconContainer}>
                  {getSourceIcon(incomeItem.source)}
                </View>
                <View style={styles.incomeInfo}>
                  <Text style={[styles.incomeSource, { color: theme.colors.text.primary }]}>{incomeItem.source}</Text>
                  <Text style={[styles.incomeAccountDate, { color: theme.colors.text.muted }]}>
                    {incomeItem.account || 'Cash'} • {formatDate(incomeItem.date)}
                  </Text>
                  {incomeItem.recurring && (
                    <View style={[styles.recurringBadge, { backgroundColor: isDark ? '#065f46' : '#d1fae5' }]}>
                      <Text style={[styles.recurringText, { color: theme.colors.success }]}>Recurring</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.incomeActions}>
                <Text style={[styles.incomeAmount, { color: theme.colors.income }]}>
                  +{settings.currency}{incomeItem.amount.toLocaleString()}
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
            {editingIncome ? 'Edit Income' : 'Add New Income'}
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
              <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Source *</Text>
              <Picker
                selectedValue={formData.source}
                style={[styles.picker, { backgroundColor: theme.colors.background, color: theme.colors.text.primary }]}
                onValueChange={(value) => setFormData({ ...formData, source: value })}
                dropdownIconColor={theme.colors.text.muted}
              >
                {INCOME_SOURCES.map(source => (
                  <Picker.Item 
                    key={source} 
                    label={source} 
                    value={source} 
                    color={theme.colors.text.primary}
                  />
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

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={[
                  styles.checkbox, 
                  { 
                    borderColor: theme.colors.border, 
                    backgroundColor: theme.colors.background 
                  }, 
                  formData.recurring && { 
                    backgroundColor: theme.colors.primary, 
                    borderColor: theme.colors.primary 
                  }
                ]}
                onPress={() => setFormData({ ...formData, recurring: !formData.recurring })}
              >
                {formData.recurring && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              <Text style={[styles.checkboxLabel, { color: theme.colors.text.secondary }]}>Recurring Income</Text>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.cancelButton, { backgroundColor: theme.colors.border }]} onPress={closeModal}>
              <Text style={[styles.cancelButtonText, { color: theme.colors.text.muted }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={saveIncomeItem}>
              <Text style={styles.saveButtonText}>
                {editingIncome ? 'Update' : 'Save'}
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
          {selectedIncome && (
            <>
              <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>Income Details</Text>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.muted }]}>Amount:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.income }]}>
                  +{settings.currency}{selectedIncome.amount.toLocaleString()}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.muted }]}>Source:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{selectedIncome.source}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.muted }]}>Account:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{selectedIncome.account || 'Cash'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.muted }]}>Date:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{formatDate(selectedIncome.date)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.text.muted }]}>Recurring:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{selectedIncome.recurring ? 'Yes' : 'No'}</Text>
              </View>
              
              {selectedIncome.description && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.text.muted }]}>Description:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text.primary }]}>{selectedIncome.description}</Text>
                </View>
              )}
              
              <View style={styles.detailModalActions}>
                <TouchableOpacity 
                  style={[styles.detailButton, styles.deleteDetailButton, { backgroundColor: theme.colors.danger }]} 
                  onPress={() => {
                    closeDetailModal();
                    deleteIncome(selectedIncome.id);
                  }}
                >
                  <Text style={styles.detailButtonText}>Delete</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.detailButton, styles.editDetailButton, { backgroundColor: theme.colors.primary }]} 
                  onPress={() => {
                    closeDetailModal();
                    openModal(selectedIncome);
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
  addButton: {
    backgroundColor: '#10B981',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
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
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
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
  incomeList: {
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
  incomeCard: {
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
    borderLeftWidth: 4,
  },
  incomeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  incomeInfo: {
    flex: 1,
  },
  incomeDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  incomeSource: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  incomeAccount: {
    fontSize: 12,
    marginBottom: 4,
  },
  incomeAccountDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  incomeDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  recurringBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  recurringText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#15803d',
  },
  incomeActions: {
    alignItems: 'flex-end',
  },
  incomeAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
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
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
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
    backgroundColor: '#10B981',
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