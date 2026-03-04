import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
    User,
    Briefcase,
    Phone,
    Mail,
    Edit3,
    Trash2,
    ShieldCheck,
    ShieldBan,
    MapPin
} from "lucide-react-native";
import { COLORS, SHADOWS } from "../../constants/theme";

export default function EmployeeCard({ emp, onEdit, onDelete, onToggleStatus }) {
    const isActive = emp.isActive;

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.profileInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{emp.name?.charAt(0) || "U"}</Text>
                    </View>
                    <View>
                        <Text style={styles.name}>{emp.name}</Text>
                        <View style={styles.roleBadge}>
                            <Briefcase size={10} color={COLORS.secondary} style={{ marginRight: 4 }} />
                            <Text style={styles.role}>{emp.role ? emp.role.toUpperCase() : "STAFF"}</Text>
                        </View>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={onToggleStatus}
                    style={[styles.statusBadge, {
                        backgroundColor: isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        borderColor: isActive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                    }]}
                >
                    {isActive ? <ShieldCheck size={12} color={COLORS.success} /> : <ShieldBan size={12} color={COLORS.error} />}
                    <Text style={[styles.statusText, { color: isActive ? COLORS.success : COLORS.error }]}>
                        {isActive ? "ACTIVE" : "INACTIVE"}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Contact Details */}
            {(emp.mobile || emp.email || emp.address) ? (
                <View style={styles.detailsContainer}>
                    {emp.mobile ? (
                        <View style={styles.infoRow}>
                            <Phone size={14} color="#64748b" />
                            <Text style={styles.value}>{emp.mobile}</Text>
                        </View>
                    ) : null}

                    {emp.email ? (
                        <View style={styles.infoRow}>
                            <Mail size={14} color="#64748b" />
                            <Text style={styles.value}>{emp.email}</Text>
                        </View>
                    ) : null}

                    {emp.address ? (
                        <View style={styles.infoRow}>
                            <MapPin size={14} color="#64748b" />
                            <Text style={styles.value} numberOfLines={2}>{emp.address}</Text>
                        </View>
                    ) : null}
                </View>
            ) : null}

            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
                    <Edit3 size={14} color="#cbd5e1" />
                    <Text style={styles.editBtnText}>EDIT PROFILE</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
                    <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#0f172a",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#1e293b",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: "#1e293b", // Slate 800
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#334155",
    },
    avatarText: {
        color: "#f8fafc",
        fontSize: 18,
        fontWeight: "800",
    },
    name: {
        color: "#f8fafc",
        fontSize: 15,
        fontWeight: "800",
        marginBottom: 4,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    role: {
        color: COLORS.secondary,
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        backgroundColor: "#1e293b",
        marginBottom: 16,
    },
    detailsContainer: {
        gap: 12,
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 8,
    },
    value: {
        color: "#cbd5e1",
        fontSize: 13,
        fontWeight: "500",
        letterSpacing: 0.3,
    },
    actionRow: {
        flexDirection: "row",
        gap: 12,
    },
    editBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        backgroundColor: "#1e293b", // Slate 800
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#334155",
    },
    editBtnText: {
        color: "#cbd5e1",
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    deleteBtn: {
        width: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
});
