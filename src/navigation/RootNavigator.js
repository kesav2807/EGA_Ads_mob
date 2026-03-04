import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import StartScreen from "../screens/StartScreen";
import AdminLoginScreen from "../screens/admin/AdminLoginScreen";
import DrawerNavigator from "./DrawerNavigator";
import AddEmployeeScreen from "../screens/employee/AddEmployeeScreen";
import EditEmployeeScreen from "../screens/employee/EditEmployeeScreen";
import WorkListScreen from "../screens/work/WorkListScreen";
import AddWorkScreen from "../screens/work/AddWorkScreen";
import WorkDetailScreen from "../screens/work/WorkDetailScreen";
import { COLORS } from "../constants/theme";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
    const [initialRoute, setInitialRoute] = useState("Start");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await AsyncStorage.getItem("adminToken");
                if (token) {
                    setInitialRoute("AdminDrawer");
                }
            } catch (e) {
                console.error("Auth check failed", e);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    if (loading) {
        return (
            <View style={styles.splash}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName={initialRoute}
                screenOptions={{ headerShown: false }}
            >
                <Stack.Screen name="Start" component={StartScreen} />
                <Stack.Screen name="Login" component={AdminLoginScreen} options={{ title: 'Admin Login' }} />
                <Stack.Screen name="AdminDrawer" component={DrawerNavigator} options={{ title: 'Dashboard' }} />
                <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} options={{ title: 'Add Staff' }} />
                <Stack.Screen name="EditEmployee" component={EditEmployeeScreen} options={{ title: 'Edit Staff' }} />
                <Stack.Screen name="WorkList" component={WorkListScreen} options={{ title: 'Work Registry' }} />
                <Stack.Screen name="AddWork" component={AddWorkScreen} options={{ title: 'New Work Order' }} />
                <Stack.Screen name="WorkDetail" component={WorkDetailScreen} options={{ title: 'Work Details' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    splash: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: "center",
        alignItems: "center",
    },
});
