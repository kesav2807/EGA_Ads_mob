import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { updateEmployee } from "../../api/employeeApi";
import { COLORS, SIZES, FONTS, SHADOWS, SPACING } from "../../constants/theme";

const ROLES = ["register", "initialization", "designer", "installer", "helper", "manager"];

export default function EditEmployeeScreen({ route, navigation }) {
    const { emp } = route.params;

    const [name, setName] = useState(emp.name || "");
    const [mobile, setMobile] = useState(emp.mobile || "");
    const [email, setEmail] = useState(emp.email || "");
    const [role, setRole] = useState(emp.role || "helper");
    const [address, setAddress] = useState(emp.address || "");
    const [loading, setLoading] = useState(false);

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validateMobile = (mobile) => {
        return /^[0-9]{10}$/.test(mobile);
    };

    const update = async () => {
        // Trim inputs
        const trimmedName = name.trim();
        const trimmedMobile = mobile.trim();
        const trimmedEmail = email.trim();

        if (!trimmedName) {
            Alert.alert("Validation Error", "Please enter the employee's full name.");
            return;
        }

        if (trimmedName.length < 3) {
            Alert.alert("Validation Error", "Name must be at least 3 characters long.");
            return;
        }

        if (!trimmedMobile && !trimmedEmail) {
            Alert.alert("Validation Error", "Either Mobile Number or Email Address is required.");
            return;
        }

        if (trimmedMobile && !validateMobile(trimmedMobile)) {
            Alert.alert("Validation Error", "Please enter a valid 10-digit mobile number.");
            return;
        }

        if (trimmedEmail && !validateEmail(trimmedEmail)) {
            Alert.alert("Validation Error", "Please enter a valid email address.");
            return;
        }

        setLoading(true);
        try {
            await updateEmployee(emp._id, {
                name: trimmedName,
                mobile: trimmedMobile,
                email: trimmedEmail,
                role,
                address: address.trim()
            });
            Alert.alert("Success", "Employee updated successfully", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", error.response?.data?.message || "Failed to update employee");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View entering={FadeInDown.duration(600).springify()}>
                    <Text style={styles.headerTitle}>Edit Employee</Text>
                    <Text style={styles.headerSubtitle}>Update details below</Text>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholderTextColor={COLORS.textSecondary}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Mobile Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholderTextColor={COLORS.textSecondary}
                            value={mobile}
                            onChangeText={setMobile}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholderTextColor={COLORS.textSecondary}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Role</Text>
                        <View style={styles.roleContainer}>
                            {ROLES.map((r) => (
                                <TouchableOpacity
                                    key={r}
                                    style={[styles.roleBadge, role === r && styles.roleBadgeActive]}
                                    onPress={() => setRole(r)}
                                >
                                    <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                                        {r.charAt(0).toUpperCase() + r.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Address</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Enter full address"
                            placeholderTextColor={COLORS.textSecondary}
                            value={address}
                            onChangeText={setAddress}
                            multiline
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={update}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.btnText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        padding: SPACING.pagePadding,
        paddingTop: SIZES.scale(40),
    },
    headerTitle: {
        fontSize: SIZES.scale(28),
        fontWeight: "900",
        color: COLORS.primary,
        marginBottom: SIZES.scale(4),
        letterSpacing: -1,
    },
    headerSubtitle: {
        fontSize: SIZES.scale(15),
        color: COLORS.textSecondary,
        marginBottom: SIZES.scale(32),
        fontWeight: '600',
    },
    formGroup: {
        marginBottom: SIZES.scale(20),
    },
    label: {
        color: COLORS.textSecondary,
        fontSize: SIZES.scale(11),
        marginBottom: SIZES.scale(10),
        fontWeight: "900",
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginLeft: SIZES.scale(4),
    },
    input: {
        backgroundColor: COLORS.white,
        color: COLORS.primary,
        padding: SIZES.scale(16),
        borderRadius: SIZES.scale(16),
        borderWidth: 1.5,
        borderColor: COLORS.border,
        fontSize: SIZES.font,
        fontWeight: '600',
        ...SHADOWS.small,
    },
    textArea: {
        height: SIZES.scale(100),
        textAlignVertical: "top",
    },
    roleContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: SIZES.scale(8),
    },
    roleBadge: {
        paddingVertical: SIZES.scale(10),
        paddingHorizontal: SIZES.scale(16),
        borderRadius: SIZES.scale(12),
        borderWidth: 1.5,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
    },
    roleBadgeActive: {
        backgroundColor: `${COLORS.secondary}15`,
        borderColor: COLORS.secondary,
    },
    roleText: {
        color: COLORS.textSecondary,
        fontWeight: "800",
        fontSize: SIZES.scale(11),
        letterSpacing: 0.5,
    },
    roleTextActive: {
        color: COLORS.secondary,
    },
    btn: {
        backgroundColor: COLORS.primary,
        padding: SIZES.scale(18),
        borderRadius: SIZES.scale(16),
        alignItems: "center",
        marginTop: SIZES.scale(10),
        ...SHADOWS.premium,
    },
    btnDisabled: {
        opacity: 0.7,
    },
    btnText: {
        color: COLORS.white,
        fontWeight: "900",
        fontSize: SIZES.scale(16),
        letterSpacing: 1,
    },
});
