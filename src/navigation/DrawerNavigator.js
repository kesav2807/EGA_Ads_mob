import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from "react-native";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LayoutDashboard, Users, Briefcase, LogOut, ChevronRight } from "lucide-react-native";
import AdminHomeScreen from "../screens/admin/AdminHomeScreen";
import EmployeeListScreen from "../screens/employee/EmployeeListScreen";
import WorkListScreen from "../screens/work/WorkListScreen";
import { COLORS, SPACING } from "../constants/theme";

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem("adminToken");
            props.navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (e) {
            console.error("Logout failed", e);
        }
    };

    return (
        <View style={styles.container}>
            <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerScroll}>
                {/* Professional Header */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>AD</Text>
                        </View>
                        <View style={styles.badge}>
                            <View style={styles.badgeDot} />
                        </View>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>Administrator</Text>
                        <Text style={styles.userRole}>System Access</Text>
                    </View>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Navigation Items */}
                <View style={styles.drawerItems}>
                    <Text style={styles.sectionLabel}>MAIN MENU</Text>
                    <DrawerItemList {...props} />
                </View>
            </DrawerContentScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
                    <View style={styles.logoutContent}>
                        <View style={styles.logoutIconBox}>
                            <LogOut size={18} color="#EF4444" />
                        </View>
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </View>
                    <ChevronRight size={16} color="#EF4444" />
                </TouchableOpacity>
                <Text style={styles.versionText}>v1.0.0 • EGA ADS Systems</Text>
            </View>
        </View>
    );
}

export default function DrawerNavigator() {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerType: 'slide',
                drawerActiveBackgroundColor: '#EFF6FF', // Light Blue
                drawerActiveTintColor: '#1D4ED8', // Dark Blue
                drawerInactiveTintColor: '#64748B', // Slate
                drawerStyle: {
                    backgroundColor: '#FFFFFF',
                    width: 280,
                    borderRightWidth: 1,
                    borderRightColor: '#E2E8F0',
                },
                drawerLabelStyle: {
                    marginLeft: -10,
                    fontSize: 14,
                    fontWeight: '600',
                    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                },
                drawerItemStyle: {
                    borderRadius: 12,
                    marginHorizontal: 16,
                    marginVertical: 4,
                    paddingHorizontal: 12,
                },
                overlayColor: 'rgba(15, 23, 42, 0.4)', // Slate 900 with opacity
            }}
        >
            <Drawer.Screen
                name="Dashboard"
                component={AdminHomeScreen}
                options={{
                    title: "Overview",
                    drawerIcon: ({ color, size }) => (
                        <LayoutDashboard size={20} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Employees"
                component={EmployeeListScreen}
                options={{
                    title: "Staff Directory",
                    drawerIcon: ({ color, size }) => (
                        <Users size={20} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Works"
                component={WorkListScreen}
                options={{
                    title: "Work Registry",
                    drawerIcon: ({ color, size }) => (
                        <Briefcase size={20} color={color} />
                    ),
                }}
            />
        </Drawer.Navigator>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    drawerScroll: {
        paddingTop: 0,
    },
    header: {
        padding: 24,
        paddingTop: SPACING.safeTop + 10,
        backgroundColor: '#FFFFFF',
    },
    avatarContainer: {
        width: 56,
        height: 56,
        marginBottom: 16,
        position: 'relative',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 18,
        backgroundColor: '#1E3A8A', // Deep Blue
        justifyContent: "center",
        alignItems: "center",
        ...Platform.select({
            ios: {
                shadowColor: '#1E3A8A',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            }
        }),
    },
    avatarText: {
        color: "#FFFFFF",
        fontWeight: "bold",
        fontSize: 20,
    },
    badge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: '#FFFFFF',
        padding: 2,
        borderRadius: 10,
    },
    badgeDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10B981', // Emerald 500
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    userInfo: {
        marginBottom: 4,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F172A', // Slate 900
        letterSpacing: -0.5,
    },
    userRole: {
        fontSize: 13,
        color: '#64748B', // Slate 500
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9', // Slate 100
        marginHorizontal: 24,
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#94A3B8', // Slate 400
        marginLeft: 28,
        marginBottom: 8,
        letterSpacing: 1,
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    logoutBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: 'space-between',
        backgroundColor: '#FEF2F2', // Red 50
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FEE2E2', // Red 100
    },
    logoutContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoutIconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutText: {
        color: "#991B1B", // Red 800
        fontWeight: "700",
        fontSize: 14,
    },
    versionText: {
        textAlign: 'center',
        marginTop: 16,
        fontSize: 11,
        color: '#94A3B8',
    },
});
