import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { 
  Moon, 
  Globe, 
  Bell, 
  Download, 
  Upload, 
  Trash2, 
  Info,
  ChevronRight,
  ArrowLeft
} from 'lucide-react-native';
import { getSettings, saveSettings, getExpenses, getIncome, saveExpenses, saveIncome } from '@/utils/storage';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { theme, toggleTheme, isDark } = useTheme();
  const router = useRouter();
  const [settings, setSettings] = useState({
    darkMode: false,
    currency: '₹',
    notifications: true,
    biometrics: false,
  });

  const loadSettings = async () => {
    try {
      const settingsData = await getSettings();
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Sync settings with theme context
  useEffect(() => {
    setSettings(prev => ({ ...prev, darkMode: isDark }));
  }, [isDark]);

  const updateSetting = async (key: string, value: any) => {
    try {
      if (key === 'darkMode') {
        // Use theme context for dark mode
        toggleTheme();
        return;
      }
      
      const updatedSettings = { ...settings, [key]: value };
      setSettings(updatedSettings);
      await saveSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const exportData = async () => {
    try {
      const [expenses, income] = await Promise.all([
        getExpenses(),
        getIncome()
      ]);

      const exportData = {
        expenses,
        income,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      // In a real app, you would use react-native-share or similar
      Alert.alert(
        'Export Data',
        `Ready to export ${expenses.length} expenses and ${income.length} income records.\n\nIn a real app, this would save to your device or share via email.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const importData = () => {
    Alert.alert(
      'Import Data',
      'This feature would allow you to import data from a backup file or another app.',
      [{ text: 'OK' }]
    );
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your expenses, income, and budgets. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all([
                saveExpenses([]),
                saveIncome([])
              ]);
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  const showAbout = () => {
    Alert.alert(
      'About Expense Manager',
      'Version 1.0.0\n\nA comprehensive expense tracking app built with React Native and Expo.\n\n• Track expenses and income\n• Set budgets and alerts\n• Generate detailed reports\n• Multiple payment methods\n• Data export/import',
      [{ text: 'OK' }]
    );
  };

  const currencies = [
    { label: 'Indian Rupee (₹)', value: '₹' },
    { label: 'US Dollar ($)', value: '$' },
    { label: 'Euro (€)', value: '€' },
    { label: 'British Pound (£)', value: '£' },
  ];

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
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Settings</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Appearance */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { 
            color: theme.colors.text.primary,
            borderBottomColor: theme.colors.border 
          }]}>Appearance</Text>
          
          <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.settingInfo}>
              <Moon size={20} color={theme.colors.text.muted} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>Dark Mode</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.text.muted }]}>
                  Switch to dark theme
                </Text>
              </View>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(value) => updateSetting('darkMode', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
          </View>

          <TouchableOpacity style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingInfo}>
              <Globe size={20} color={theme.colors.text.muted} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>Currency</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.text.muted }]}>
                  {currencies.find(c => c.value === settings.currency)?.label}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.colors.text.muted} />
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { 
            color: theme.colors.text.primary,
            borderBottomColor: theme.colors.border 
          }]}>Notifications</Text>
          
          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingInfo}>
              <Bell size={20} color={theme.colors.text.muted} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>Budget Alerts</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.text.muted }]}>
                  Get notified when approaching budget limits
                </Text>
              </View>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={(value) => updateSetting('notifications', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
          </View>
        </View>

        {/* Data Management */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { 
            color: theme.colors.text.primary,
            borderBottomColor: theme.colors.border 
          }]}>Data Management</Text>
          
          <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.colors.border }]} onPress={exportData}>
            <View style={styles.settingInfo}>
              <Download size={20} color={theme.colors.text.muted} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>Export Data</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.text.muted }]}>
                  Backup your expenses and income
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.colors.text.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.colors.border }]} onPress={importData}>
            <View style={styles.settingInfo}>
              <Upload size={20} color={theme.colors.text.muted} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>Import Data</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.text.muted }]}>
                  Restore from backup file
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.colors.text.muted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, styles.dangerItem]} 
            onPress={clearAllData}
          >
            <View style={styles.settingInfo}>
              <Trash2 size={20} color={theme.colors.danger} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.danger }]}>
                  Clear All Data
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.text.muted }]}>
                  Permanently delete all records
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionTitle, { 
            color: theme.colors.text.primary,
            borderBottomColor: theme.colors.border 
          }]}>About</Text>
          
          <TouchableOpacity style={[styles.settingItem, { borderBottomWidth: 0 }]} onPress={showAbout}>
            <View style={styles.settingInfo}>
              <Info size={20} color={theme.colors.text.muted} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>App Information</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.text.muted }]}>
                  Version, credits, and more
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.colors.text.muted} />
          </TouchableOpacity>
        </View>

        {/* App Stats */}
        <View style={[styles.statsContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statsTitle, { color: theme.colors.text.primary }]}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>---</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.muted }]}>Total Expenses</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>---</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.muted }]}>Total Income</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>---</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.muted }]}>Categories Used</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>---</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.muted }]}>Active Budgets</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
  },
  dangerItem: {
    borderBottomWidth: 0,
  },
  statsContainer: {
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
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});