import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SPACING, SHADOWS } from '../../constants/theme';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../../api/employeeApi';

const EmployeeManager = ({ navigation }) => {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'register',
    mobile: '',
    address: ''
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await getEmployees(searchQuery);
      setEmployees(res.employees || []);
    } catch (err) {
      console.error("Fetch Error:", err);
      if (employees.length === 0) {
        Alert.alert('Notice', 'Employee management might be restricted. Viewing data from summary.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEmployees();
    setRefreshing(false);
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'register',
      mobile: '',
      address: ''
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (emp) => {
    setEditingId(emp._id);
    setFormData({
      name: emp.name,
      email: emp.email,
      password: '',
      role: emp.role,
      mobile: emp.mobile || '',
      address: emp.address || ''
    });
    setIsModalOpen(true);
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateMobile = (mobile) => {
    return /^[0-9]{10}$/.test(mobile);
  };

  const handleSubmit = async () => {
    // Trim inputs
    const trimmedName = formData.name.trim();
    const trimmedMobile = formData.mobile.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedName) {
      Alert.alert('Validation Error', 'Please enter the employee\'s full name.');
      return;
    }

    if (trimmedName.length < 3) {
      Alert.alert('Validation Error', 'Name must be at least 3 characters long.');
      return;
    }

    if (!trimmedMobile && !trimmedEmail) {
      Alert.alert('Validation Error', 'Either Mobile Number or Email Address is required.');
      return;
    }

    if (trimmedMobile && !validateMobile(trimmedMobile)) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    if (trimmedEmail && !validateEmail(trimmedEmail)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      // Prepare the payload based on documented employee fields
      const submitData = {
        name: trimmedName,
        email: trimmedEmail,
        mobile: trimmedMobile,
        address: formData.address.trim(),
        role: formData.role,
        password: trimmedMobile || "Pass123" // Using mobile as initial password if available
      };

      if (editingId) {
        await updateEmployee(editingId, submitData);
        Alert.alert('Success', 'Employee profile updated');
      } else {
        await createEmployee(submitData);
        Alert.alert('Success', 'New member onboarded');
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err) {
      console.error('Submit Error:', err.message);
      Alert.alert('Error', err.response?.data?.message || 'An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Employee',
      'Are you sure you want to remove this employee?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await deleteEmployee(id);
              fetchEmployees();
              Alert.alert('Success', res.message || 'Employee removed');
            } catch (err) {
              const errorMsg = err.response?.data?.message || err.message || 'Error deleting employee';
              Alert.alert('Error', errorMsg);
            }
          }
        }
      ]
    );
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());

    const isBeforeRole = emp.role === 'register' || emp.role === 'designer' || emp.role === 'manager';
    const isAfterRole = emp.role === 'initialization' || emp.role === 'installer' || emp.role === 'helper';

    const matchesRole = filterRole === 'ALL' ||
      (filterRole === 'BEFORE' && isBeforeRole) ||
      (filterRole === 'AFTER' && isAfterRole);

    return matchesSearch && matchesRole;
  });

  const totalEmployees = employees.length;
  const beforeTeam = employees.filter(e => e.role === 'register' || e.role === 'designer' || e.role === 'manager').length;
  const afterTeam = employees.filter(e => e.role === 'initialization' || e.role === 'installer' || e.role === 'helper').length;

  const renderEmployeeCard = (emp) => (
    <View key={emp._id} style={styles.employeeCard}>
      {/* Avatar and Name */}
      <View style={styles.employeeHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {emp.name.substring(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{emp.name}</Text>
          <Text style={styles.employeeId}>ID: {emp._id.slice(-6)}</Text>
        </View>
        <View style={[
          styles.roleBadge,
          {
            backgroundColor: (emp.role === 'register' || emp.role === 'designer' || emp.role === 'manager') ? '#DBEAFE' : '#EDE9FE',
            borderColor: (emp.role === 'register' || emp.role === 'designer' || emp.role === 'manager') ? '#BFDBFE' : '#DDD6FE'
          }
        ]}>
          <View style={[
            styles.roleDot,
            { backgroundColor: (emp.role === 'register' || emp.role === 'designer' || emp.role === 'manager') ? '#3B82F6' : '#8B5CF6' }
          ]} />
          <Text style={[
            styles.roleText,
            { color: (emp.role === 'register' || emp.role === 'designer' || emp.role === 'manager') ? '#1E40AF' : '#6D28D9' }
          ]}>
            {emp.role.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Contact Info */}
      {(emp.email || emp.mobile || emp.address) ? (
        <View style={styles.contactInfo}>
          {emp.email ? (
            <View style={styles.contactRow}>
              <View style={styles.smallIconBox}>
                <Ionicons name="mail-outline" size={12} color="#4F46E5" />
              </View>
              <Text style={styles.contactText}>{emp.email}</Text>
            </View>
          ) : null}

          {emp.mobile ? (
            <View style={[styles.contactRow, { marginTop: emp.email ? 8 : 0 }]}>
              <View style={styles.smallIconBox}>
                <Ionicons name="call-outline" size={12} color="#10B981" />
              </View>
              <Text style={styles.contactText}>{emp.mobile}</Text>
            </View>
          ) : null}

          {emp.address ? (
            <View style={[styles.contactRow, { marginTop: (emp.email || emp.mobile) ? 8 : 0 }]}>
              <View style={styles.smallIconBox}>
                <Ionicons name="location-outline" size={12} color="#F59E0B" />
              </View>
              <Text style={styles.contactText} numberOfLines={2}>{emp.address}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.employeeActions}>
        <TouchableOpacity
          onPress={() => handleEdit(emp)}
          style={styles.actionButton}
        >
          <Ionicons name="create-outline" size={18} color="#3B82F6" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(emp._id)}
          style={[styles.actionButton, styles.deleteButton]}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <TouchableOpacity
              onPress={() => navigation?.openDrawer()}
              style={{
                marginRight: 16,
                padding: 10,
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E2E8F0'
              }}
            >
              <Ionicons name="menu" size={24} color="#1E293B" />
            </TouchableOpacity>
            <View>
              <Text style={styles.title}>Team</Text>
              <Text style={styles.subtitle}>
                Manage your field workforce
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { borderLeftColor: '#3B82F6' }]}>
            <Ionicons name="people-outline" size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{totalEmployees}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#6366F1' }]}>
            <Ionicons name="person-outline" size={24} color="#6366F1" />
            <Text style={styles.statValue}>{beforeTeam}</Text>
            <Text style={styles.statLabel}>Richie's Team</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#8B5CF6' }]}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#8B5CF6" />
            <Text style={styles.statValue}>{afterTeam}</Text>
            <Text style={styles.statLabel}>Insulation Team</Text>
          </View>
        </View>

        {/* Add Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={openCreateModal}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>ADD NEW MEMBER</Text>
        </TouchableOpacity>

        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search employees..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filterRole === 'ALL' && styles.filterButtonActive]}
            onPress={() => setFilterRole('ALL')}
          >
            <Text style={[styles.filterButtonText, filterRole === 'ALL' && styles.filterButtonTextActive]}>
              ALL
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterRole === 'BEFORE' && styles.filterButtonActive]}
            onPress={() => setFilterRole('BEFORE')}
          >
            <Text style={[styles.filterButtonText, filterRole === 'BEFORE' && styles.filterButtonTextActive]}>
              RICHIE'S TEAM
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterRole === 'AFTER' && styles.filterButtonActive]}
            onPress={() => setFilterRole('AFTER')}
          >
            <Text style={[styles.filterButtonText, filterRole === 'AFTER' && styles.filterButtonTextActive]}>
              INSULATION TEAM
            </Text>
          </TouchableOpacity>
        </View>

        {/* Employee List */}
        {loading && employees.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : filteredEmployees.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyStateTitle}>No Employees Found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'Try adjusting your search' : 'Add your first team member'}
            </Text>
          </View>
        ) : (
          <View style={styles.employeeList}>
            {filteredEmployees.map(renderEmployeeCard)}
          </View>
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {editingId ? 'Edit Profile' : 'New Member'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {editingId ? 'Update employee information' : 'Onboard a new team member'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setIsModalOpen(false)}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>FULL NAME *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#94A3B8"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>
            </View>

            {/* Mobile */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>MOBILE NUMBER *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#94A3B8"
                  value={formData.mobile}
                  onChangeText={(text) => setFormData({ ...formData, mobile: text })}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>EMAIL ADDRESS *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="john@example.com"
                  placeholderTextColor="#94A3B8"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Address */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>ADDRESS</Text>
              <View style={[styles.inputContainer, { height: 'auto', minHeight: SIZES.scale(80), alignItems: 'flex-start', paddingVertical: SIZES.scale(12) }]}>
                <Ionicons name="location-outline" size={18} color="#94A3B8" style={[styles.inputIcon, { marginTop: 4 }]} />
                <TextInput
                  style={[styles.input, { textAlignVertical: 'top' }]}
                  placeholder="Enter full address"
                  placeholderTextColor="#94A3B8"
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  multiline
                />
              </View>
            </View>

            {/* Role */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>ROLE *</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    formData.role === 'register' && styles.roleOptionActive
                  ]}
                  onPress={() => setFormData({ ...formData, role: 'register' })}
                >
                  <Ionicons
                    name={formData.role === 'register' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={formData.role === 'register' ? '#3B82F6' : '#94A3B8'}
                  />
                  <Text style={[
                    styles.roleOptionText,
                    formData.role === 'register' && styles.roleOptionTextActive
                  ]}>
                    Richie's Team (Register)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    formData.role === 'initialization' && styles.roleOptionActive
                  ]}
                  onPress={() => setFormData({ ...formData, role: 'initialization' })}
                >
                  <Ionicons
                    name={formData.role === 'initialization' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={formData.role === 'initialization' ? '#8B5CF6' : '#94A3B8'}
                  />
                  <Text style={[
                    styles.roleOptionText,
                    formData.role === 'initialization' && styles.roleOptionTextActive
                  ]}>
                    Insulation Team (Init)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
          {/* Submit Buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.footerButton, styles.cancelButton]}
              onPress={() => setIsModalOpen(false)}
            >
              <Text style={styles.cancelButtonText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {editingId ? 'SAVE CHANGES' : 'CREATE ACCOUNT'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {loading && employees.length > 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.pagePadding,
    paddingTop: SPACING.safeTop,
    paddingBottom: SPACING.m,
  },
  title: {
    fontSize: SIZES.xxl,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: SIZES.font,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: SIZES.scale(2),
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.pagePadding,
    gap: SIZES.scale(12),
    marginBottom: SIZES.scale(20),
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SIZES.scale(16),
    borderRadius: SIZES.scale(16),
    borderLeftWidth: 4,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  statValue: {
    fontSize: SIZES.scale(28),
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: SIZES.scale(8),
  },
  statLabel: {
    fontSize: SIZES.scale(10),
    color: COLORS.textSecondary,
    fontWeight: '800',
    marginTop: SIZES.scale(4),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addButton: {
    marginHorizontal: SPACING.pagePadding,
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.scale(16),
    paddingVertical: SIZES.scale(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.scale(8),
    marginBottom: SIZES.scale(20),
    ...SHADOWS.premium,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: SIZES.scale(14),
    fontWeight: '900',
    letterSpacing: 1,
  },
  searchContainer: {
    marginHorizontal: SPACING.pagePadding,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.scale(14),
    paddingHorizontal: SIZES.scale(16),
    height: SIZES.scale(50),
    marginBottom: SIZES.scale(16),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: SIZES.scale(12),
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.font,
    color: COLORS.primary,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.pagePadding,
    gap: SIZES.scale(8),
    marginBottom: SIZES.scale(20),
  },
  filterButton: {
    flex: 1,
    paddingVertical: SIZES.scale(12),
    paddingHorizontal: SIZES.scale(12),
    borderRadius: SIZES.scale(10),
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: `${COLORS.secondary}15`,
    borderColor: COLORS.secondary,
  },
  filterButtonText: {
    fontSize: SIZES.scale(10),
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  filterButtonTextActive: {
    color: COLORS.secondary,
  },
  loadingContainer: {
    paddingVertical: SIZES.scale(60),
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: SIZES.scale(80),
    alignItems: 'center',
    paddingHorizontal: SIZES.scale(40),
  },
  emptyStateTitle: {
    fontSize: SIZES.large,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: SIZES.scale(20),
    marginBottom: SIZES.scale(8),
  },
  emptyStateText: {
    fontSize: SIZES.font,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: SIZES.scale(20),
  },
  employeeList: {
    paddingHorizontal: SPACING.pagePadding,
    paddingBottom: SIZES.scale(40),
    gap: SIZES.scale(16),
  },
  employeeCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.scale(24),
    padding: SIZES.scale(18),
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.premium,
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.scale(16),
  },
  avatar: {
    width: SIZES.scale(54),
    height: SIZES.scale(54),
    borderRadius: SIZES.scale(16),
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  avatarText: {
    fontSize: SIZES.scale(20),
    fontWeight: '900',
    color: COLORS.secondary,
  },
  employeeInfo: {
    flex: 1,
    marginLeft: SIZES.scale(16),
  },
  employeeName: {
    fontSize: SIZES.scale(17),
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: SIZES.scale(4),
    letterSpacing: -0.5,
  },
  employeeId: {
    fontSize: SIZES.scale(11),
    color: COLORS.textLight,
    fontWeight: '800',
    letterSpacing: 1,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.scale(12),
    paddingVertical: SIZES.scale(6),
    borderRadius: SIZES.scale(10),
    borderWidth: 1,
    gap: SIZES.scale(6),
  },
  roleDot: {
    width: SIZES.scale(6),
    height: SIZES.scale(6),
    borderRadius: SIZES.scale(3),
  },
  roleText: {
    fontSize: SIZES.scale(10),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  smallIconBox: {
    width: SIZES.scale(28),
    height: SIZES.scale(28),
    backgroundColor: COLORS.background,
    borderRadius: SIZES.scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.scale(12),
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  contactInfo: {
    padding: SIZES.scale(16),
    backgroundColor: COLORS.background,
    borderRadius: SIZES.scale(16),
    marginBottom: SIZES.scale(16),
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: SIZES.scale(13),
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  employeeActions: {
    flexDirection: 'row',
    gap: SIZES.scale(12),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.scale(12),
    borderRadius: SIZES.scale(12),
    backgroundColor: COLORS.background,
    gap: SIZES.scale(8),
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  actionButtonText: {
    fontSize: SIZES.scale(13),
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  deleteButton: {
    backgroundColor: `${COLORS.error}10`,
    borderColor: `${COLORS.error}20`,
  },
  deleteButtonText: {
    color: COLORS.error,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.scale(24),
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: SIZES.scale(22),
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: SIZES.scale(13),
    color: COLORS.textSecondary,
    marginTop: SIZES.scale(2),
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: SIZES.scale(24),
  },
  formGroup: {
    marginBottom: SIZES.scale(20),
  },
  formLabel: {
    fontSize: SIZES.scale(11),
    fontWeight: '900',
    color: COLORS.textSecondary,
    marginBottom: SIZES.scale(10),
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SIZES.scale(14),
    paddingHorizontal: SIZES.scale(16),
    height: SIZES.scale(54),
  },
  inputIcon: {
    marginRight: SIZES.scale(12),
  },
  input: {
    flex: 1,
    fontSize: SIZES.scale(15),
    color: COLORS.primary,
    fontWeight: '600',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: SIZES.scale(12),
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SIZES.scale(14),
    padding: SIZES.scale(14),
    gap: SIZES.scale(10),
  },
  roleOptionActive: {
    borderColor: COLORS.secondary,
    backgroundColor: `${COLORS.secondary}10`,
  },
  roleOptionText: {
    fontSize: SIZES.scale(13),
    color: COLORS.textSecondary,
    fontWeight: '800',
  },
  roleOptionTextActive: {
    color: COLORS.secondary,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: SIZES.scale(24),
    paddingBottom: Platform.OS === 'ios' ? SIZES.scale(40) : SIZES.scale(24),
    gap: SIZES.scale(16),
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  footerButton: {
    flex: 1,
    height: SIZES.scale(56),
    borderRadius: SIZES.scale(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: SIZES.scale(15),
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.premium,
  },
  submitButtonText: {
    fontSize: SIZES.scale(15),
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  }
});

export default EmployeeManager;

