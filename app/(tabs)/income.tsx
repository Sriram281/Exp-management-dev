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
import { Plus, Search, Edit, Trash2, DollarSign, ArrowLeft } from 'lucide-react-native';
import Modal from 'react-native-modal';
import { Picker } from '@react-native-picker/picker';
import { getIncome, saveIncome, getSettings } from '@/utils/storage';
import { Income, INCOME_SOURCES } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';

export default function IncomeScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const [income, setIncome] = useState<Income[]>([]);
  const [settings, setSettings] = useState<any>({ currency: '₹' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    source: INCOME_SOURCES[0],
    description: '',
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
        recurring: incomeItem.recurring || false,
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

  const saveIncomeItem = async () => {
    if (!formData.amount || !formData.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const incomeData: Income = {
      id: editingIncome?.id || Date.now().toString(),
      amount: parseFloat(formData.amount),
      source: formData.source,
      description: formData.description,
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
            <View key={incomeItem.id} style={[styles.incomeCard, { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.income }]}>
              <View style={styles.incomeInfo}>
                <Text style={[styles.incomeDescription, { color: theme.colors.text.primary }]}>{incomeItem.description}</Text>
                <Text style={[styles.incomeSource, { color: theme.colors.text.muted }]}>{incomeItem.source}</Text>
                <Text style={[styles.incomeDate, { color: theme.colors.text.muted }]}>{formatDate(incomeItem.date)}</Text>
                {incomeItem.recurring && (
                  <View style={[styles.recurringBadge, { backgroundColor: isDark ? '#065f46' : '#d1fae5' }]}>
                    <Text style={[styles.recurringText, { color: theme.colors.success }]}>Recurring</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.incomeActions}>
                <Text style={[styles.incomeAmount, { color: theme.colors.income }]}>
                  +{settings.currency}{incomeItem.amount.toLocaleString()}
                </Text>
                
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.editButton, { backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' }]}
                    onPress={() => openModal(incomeItem)}
                  >
                    <Edit size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: isDark ? '#7f1d1d' : '#fef2f2' }]}
                    onPress={() => deleteIncome(incomeItem.id)}
                  >
                    <Trash2 size={16} color={theme.colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
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
            {editingIncome ? 'Edit Income' : 'Add New Income'}
          </Text>
          
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
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Description *</Text>
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
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Source</Text>
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

          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[styles.checkbox, { borderColor: theme.colors.border }, formData.recurring && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}
              onPress={() => setFormData({ ...formData, recurring: !formData.recurring })}
            >
              {formData.recurring && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <Text style={[styles.checkboxLabel, { color: theme.colors.text.secondary }]}>Recurring Income</Text>
          </View>

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
    fontSize: 14,
    color: '#6b7280',
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
    maxHeight: '80%',
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
    borderColor: '#d1d5db',
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
});