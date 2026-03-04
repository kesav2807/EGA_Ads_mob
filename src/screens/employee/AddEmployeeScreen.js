import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
    User,
    Smartphone,
    Mail,
    MapPin,
    ArrowLeft,
    Check
} from "lucide-react-native";
import { createEmployee } from "../../api/employeeApi";
import { COLORS, SIZES, SPACING, SHADOWS } from "../../constants/theme";

const ROLES = ["designer", "installer", "helper", "manager"];

export default function AddEmployeeScreen({ navigation }) {
    const [name, setName] = useState("");
    const [mobile, setMobile] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("helper");
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validateMobile = (mobile) => {
        return /^[0-9]{10}$/.test(mobile);
    };

    const submit = async () => {
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
            const res = await createEmployee({ name, mobile, email, role, address });
            Alert.alert("Success", res.message || "Employee created successfully", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", error.response?.data?.message || "Failed to create employee");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Staff Profile</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View entering={FadeInDown.duration(600).springify()}>

                    <View style={styles.formCard}>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>FULL NAME *</Text>
                            <View style={styles.inputWrapper}>
                                <User size={18} color="#64748b" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. John Doe"
                                    placeholderTextColor="#475569"
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
                                <Text style={styles.label}>MOBILE *</Text>
                                <View style={styles.inputWrapper}>
                                    <Smartphone size={18} color="#64748b" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="9876543210"
                                        placeholderTextColor="#475569"
                                        value={mobile}
                                        onChangeText={setMobile}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>

                            <View style={[styles.formGroup, { flex: 1 }]}>
                                <Text style={styles.label}>EMAIL</Text>
                                <View style={styles.inputWrapper}>
                                    <Mail size={18} color="#64748b" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="john@ex.com"
                                        placeholderTextColor="#475569"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>ROLE ASSIGNMENT</Text>
                            <View style={styles.roleContainer}>
                                {ROLES.map((r) => (
                                    <TouchableOpacity
                                        key={r}
                                        style={[styles.roleBadge, role === r && styles.roleBadgeActive]}
                                        onPress={() => setRole(r)}
                                    >
                                        <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                                            {r.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>RESIDENTIAL ADDRESS</Text>
                            <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingVertical: 12 }]}>
                                <MapPin size={18} color="#64748b" style={[styles.inputIcon, { marginTop: 4 }]} />
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Enter full address"
                                    placeholderTextColor="#475569"
                                    value={address}
                                    onChangeText={setAddress}
                                    multiline
                                />
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={submit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Check size={18} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.btnText}>CREATE PROFILE</Text>
                            </View>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: SPACING.safeTop,
        paddingBottom: SPACING.m,
        paddingHorizontal: SPACING.pagePadding,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
        ...SHADOWS.glass,
    },
    backBtn: {
        width: SIZES.scale(40),
        height: SIZES.scale(40),
        borderRadius: SIZES.scale(12),
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: SIZES.scale(16),
    },
    headerTitle: {
        fontSize: SIZES.scale(18),
        fontWeight: "900",
        color: COLORS.primary,
        letterSpacing: 0.5,
    },
    scrollContent: {
        padding: SPACING.m,
    },
    formCard: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.scale(24),
        padding: SIZES.scale(20),
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        marginBottom: SIZES.scale(24),
        ...SHADOWS.premium,
    },
    formGroup: {
        marginBottom: SIZES.scale(18),
    },
    row: {
        flexDirection: 'row',
        gap: SIZES.scale(12),
    },
    label: {
        color: COLORS.textSecondary,
        fontSize: SIZES.scale(10),
        marginBottom: SIZES.scale(8),
        fontWeight: "900",
        letterSpacing: 1.5,
        marginLeft: SIZES.scale(4),
        textTransform: 'uppercase',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: SIZES.scale(14),
        borderWidth: 1.5,
        borderColor: COLORS.border,
        paddingHorizontal: SIZES.scale(12),
        height: SIZES.scale(54),
    },
    inputIcon: {
        marginRight: SIZES.scale(10),
    },
    input: {
        flex: 1,
        color: COLORS.primary,
        paddingVertical: SIZES.scale(12),
        fontSize: SIZES.font,
        fontWeight: "600",
    },
    textArea: {
        height: SIZES.scale(80),
        textAlignVertical: "top",
    },
    roleContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: SIZES.scale(8),
    },
    roleBadge: {
        paddingVertical: SIZES.scale(10),
        paddingHorizontal: SIZES.scale(14),
        borderRadius: SIZES.scale(10),
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
        fontSize: SIZES.scale(10),
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    roleTextActive: {
        color: COLORS.secondary,
    },
    btn: {
        backgroundColor: COLORS.secondary,
        paddingVertical: SIZES.scale(18),
        borderRadius: SIZES.scale(16),
        alignItems: "center",
        justifyContent: "center",
        ...SHADOWS.premium,
    },
    btnDisabled: {
        opacity: 0.7,
    },
    btnText: {
        color: COLORS.white,
        fontWeight: "900",
        fontSize: SIZES.scale(15),
        letterSpacing: 1,
    },
});
