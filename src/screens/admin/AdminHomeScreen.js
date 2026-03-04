import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  StatusBar,
  Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import {
  BarChart3,
  Zap,
  CheckCircle,
  Users,
  Plus,
  FileText,
  UserPlus,
  Activity,
  ArrowRight,
  Menu
} from 'lucide-react-native';

// ... (existing imports and components)
import { COLORS, SIZES, SPACING, SHADOWS } from '../../constants/theme';


// ... imports

import { getDashboardSummary } from '../../api/dashboardApi';

const StatCard = ({ title, value, icon: Icon, color, delay }) => (
  <Animated.View
    entering={FadeInDown.delay(delay).duration(600).springify()}
    style={styles.statCard}
  >
    <View style={[styles.statIconContainer, { backgroundColor: `${color}15`, padding: 8, borderRadius: 10, alignSelf: 'flex-start' }]}>
      <Icon size={20} color={color} />
    </View>
    <View>
      <Text style={styles.statTitle}>{title.toUpperCase()}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  </Animated.View>
);

const ActivityItem = ({ item, index, navigation }) => {
  const isCompleted = item.status === 'completed';
  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).springify()}
      style={styles.activityItem}
    >
      <View style={[styles.avatar, { backgroundColor: isCompleted ? '#22c55e' : '#f59e0b' }]}>
        <Text style={styles.avatarText}>
          {item.beforeEmployeeId?.name?.charAt(0) || 'U'}
        </Text>
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityUser}>{item.beforeEmployeeId?.name || "Unknown User"}</Text>
        <Text style={styles.activityAction} numberOfLines={1}>
          {item.before?.[0]?.workTitle || item.beforeData?.[0]?.workTitle || "Work Update"}
        </Text>
      </View>
      <View style={[styles.activityStatus, { backgroundColor: isCompleted ? '#22c55e15' : '#f59e0b15' }]}>
        <Text style={[styles.activityStatusText, { color: isCompleted ? '#22c55e' : '#f59e0b' }]}>
          {item.status === 'completed' ? 'DONE' : 'PENDING'}
        </Text>
      </View>
    </Animated.View>
  );
};

export default function AdminHomeScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = async () => {
    try {
      const res = await getDashboardSummary();
      // Handle various response structures
      if (res && res.success && res.data) {
        setData(res.data);
      } else if (res && (res.totalWorks !== undefined || res.totalEmployees !== undefined)) {
        // Direct data response
        setData(res);
      } else if (res && res.data) {
        // Fallback if success flag is missing but data exists
        setData(res.data);
      }
    } catch (error) {
      console.error("Dashboard Sync Failed", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSummary();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>ESTABLISHING UPLINK...</Text>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.openDrawer()}
        >
          <Menu size={20} color="#94a3b8" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text style={styles.headerWelcome}>COMMAND CENTER</Text>
          <Text style={styles.headerTitle}>Enterprise Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
          <Users size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchSummary(); }}
            tintColor="#0ea5e9"
          />
        }
      >
        <Text style={styles.sectionTitle}>REAL-TIME METRICS</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Works"
            value={data?.totalWorks || 0}
            icon={BarChart3}
            color="#0ea5e9"
            delay={100}
          />
          <StatCard
            title="Active"
            value={data?.pending || 0}
            icon={Zap}
            color="#f59e0b"
            delay={200}
          />
          <StatCard
            title="Completed"
            value={data?.completed || 0}
            icon={CheckCircle}
            color="#22c55e"
            delay={300}
          />
          <StatCard
            title="Employees"
            value={data?.totalEmployees || 0}
            icon={Users}
            color="#8b5cf6"
            delay={400}
          />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>QUICK ACTIONS</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("AddWork")}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#0ea5e920' }]}>
              <Plus size={24} color="#0ea5e9" />
            </View>
            <Text style={styles.actionLabel}>New Work</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("Works")}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#8b5cf620' }]}>
              <FileText size={24} color="#8b5cf6" />
            </View>
            <Text style={styles.actionLabel}>Registry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("Employees")}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#22c55e20' }]}>
              <UserPlus size={24} color="#22c55e" />
            </View>
            <Text style={styles.actionLabel}>Staff</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => navigation.navigate("Works")}
          >
            <Text style={styles.viewAll}>VIEW ALL</Text>
            <ArrowRight size={14} color="#0ea5e9" />
          </TouchableOpacity>
        </View>

        <View style={styles.activityContainer}>
          {data?.recentWorks?.length > 0 ? (
            data.recentWorks.map((item, index) => (
              <ActivityItem key={item._id} item={item} index={index} navigation={navigation} />
            ))
          ) : (
            <View style={styles.emptyActivity}>
              <Activity size={32} color="#334155" style={{ marginBottom: 10 }} />
              <Text style={styles.emptyText}>No recent job activity recorded.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SIZES.scale(20),
    color: COLORS.textSecondary,
    fontWeight: '900',
    fontSize: SIZES.scale(10),
    letterSpacing: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.pagePadding,
    paddingTop: SPACING.safeTop,
    paddingBottom: SIZES.scale(25),
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.glass,
  },
  headerWelcome: {
    fontSize: SIZES.scale(10),
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 3,
    marginBottom: SIZES.scale(4),
  },
  headerTitle: {
    fontSize: SIZES.scale(22),
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  profileBtn: {
    width: SIZES.scale(46),
    height: SIZES.scale(46),
    borderRadius: SIZES.scale(14),
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.pagePadding,
  },
  sectionTitle: {
    fontSize: SIZES.scale(11),
    fontWeight: '800',
    color: COLORS.textLight,
    letterSpacing: 2,
    marginTop: SIZES.scale(30),
    marginBottom: SIZES.scale(15),
    textTransform: 'uppercase',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: SIZES.isLargeDevice ? '23%' : '48%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.scale(24),
    padding: SIZES.scale(18),
    marginBottom: SIZES.scale(15),
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.premium,
  },
  statIconContainer: {
    marginBottom: SIZES.scale(12),
  },
  statTitle: {
    fontSize: SIZES.scale(9),
    fontWeight: '800',
    color: COLORS.textLight,
    letterSpacing: 1.5,
    marginBottom: SIZES.scale(4),
  },
  statValue: {
    fontSize: SIZES.scale(24),
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.scale(5),
  },
  actionBtn: {
    width: '31%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.scale(24),
    padding: SIZES.scale(16),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  actionIcon: {
    width: SIZES.scale(54),
    height: SIZES.scale(54),
    borderRadius: SIZES.scale(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.scale(10),
  },
  actionLabel: {
    fontSize: SIZES.scale(11),
    fontWeight: '900',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.scale(40),
    marginBottom: SIZES.scale(15),
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.scale(6),
  },
  viewAll: {
    color: COLORS.secondary,
    fontSize: SIZES.scale(11),
    fontWeight: '900',
    letterSpacing: 1,
  },
  activityContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.scale(28),
    padding: SIZES.scale(12),
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.scale(12),
    borderRadius: SIZES.scale(16),
    marginBottom: SIZES.scale(8),
    backgroundColor: COLORS.background,
  },
  avatar: {
    width: SIZES.scale(44),
    height: SIZES.scale(44),
    borderRadius: SIZES.scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.scale(15),
  },
  avatarText: {
    color: COLORS.white,
    fontSize: SIZES.scale(18),
    fontWeight: '900',
  },
  activityContent: {
    flex: 1,
  },
  activityUser: {
    fontSize: SIZES.scale(15),
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SIZES.scale(2),
  },
  activityAction: {
    fontSize: SIZES.scale(13),
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  activityStatus: {
    paddingHorizontal: SIZES.scale(10),
    paddingVertical: SIZES.scale(6),
    borderRadius: SIZES.scale(10),
  },
  activityStatusText: {
    fontSize: SIZES.scale(9),
    fontWeight: '900',
    letterSpacing: 1,
  },
  emptyActivity: {
    padding: SIZES.scale(40),
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textLight,
    fontSize: SIZES.scale(13),
    fontWeight: '800',
    textAlign: 'center',
  },
});
