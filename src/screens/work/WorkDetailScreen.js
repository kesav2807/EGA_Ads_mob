import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StatusBar,
    Dimensions,
    Modal
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import {
    ChevronLeft,
    Edit3,
    FileText,
    User,
    MapPin,
    Maximize2,
    Calendar,
    ArrowRight,
    CheckCircle,
    Briefcase,
    X
} from "lucide-react-native";
import { exportWorkToPDF } from "../../utils/pdfExport";
import { exportWorkToPPTX } from "../../utils/pptxExport";
import { COLORS, SHADOWS, SIZES, SPACING } from "../../constants/theme";
import { getImageUrl } from "../../utils/imageHelper";

// Helper for image validation
const isValidImage = (url) => {
    return url && typeof url === 'string' && url.length > 5;
};


const { width } = Dimensions.get('window');

const DetailItem = ({ label, value, icon: Icon, color = "#6366f1" }) => (
    <View style={styles.detailItem}>
        <View style={[styles.detailIcon, { backgroundColor: `${color}10` }]}>
            <Icon size={16} color={color} />
        </View>
        <View>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
        </View>
    </View>
);

export default function WorkDetailScreen({ route, navigation }) {
    const { workData } = route.params;
    const [work] = useState(workData || null);
    const [exporting, setExporting] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        if (!workData) {
            Alert.alert("Sync error", "This job record is not locally available. Please refresh the work list.");
            navigation.goBack();
        }
    }, [workData]);

    const handleExport = async (type) => {
        if (!work) return;
        setExporting(type);
        try {
            if (type === 'pdf') {
                await exportWorkToPDF(work);
            } else {
                await exportWorkToPPTX(work);
            }
            Alert.alert("Success", `${type.toUpperCase()} registry export complete.`);
        } catch (e) {
            Alert.alert("Export Error", `Failed to generate ${type.toUpperCase()} presentation.`);
        } finally {
            setExporting(null);
        }
    };

    if (!work) return null;

    const isCompleted = work.status === "completed";
    const beforeItems = (work.before || work.beforeData || []);
    const afterItems = (work.after || work.afterData || []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Asset Registry</Text>
                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate("AddWork", { work })}
                >
                    <Edit3 size={20} color="#6366f1" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Status Hero */}
                <Animated.View entering={FadeInUp.duration(600)} style={styles.heroSection}>
                    <View style={styles.heroTop}>
                        <View style={[styles.statusBadge, {
                            backgroundColor: isCompleted ? "#ecfdf5" : "#fff7ed",
                            borderColor: isCompleted ? "#10b981" : "#f59e0b"
                        }]}>
                            <Text style={[styles.statusText, { color: isCompleted ? "#10b981" : "#f59e0b" }]}>
                                {work.status?.toUpperCase() || "PENDING"}
                            </Text>
                        </View>
                        <Text style={styles.dateText}>
                            {new Date(work.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                        </Text>
                    </View>
                    <Text style={styles.mainTitle}>{beforeItems[0]?.workTitle || "Executive Asset Registry"}</Text>
                    <View style={styles.idBox}>
                        <Text style={styles.idLabel}>TRANSACTION ID:</Text>
                        <Text style={styles.idValue}>#{work._id.slice(-8).toUpperCase()}</Text>
                    </View>
                </Animated.View>

                {/* Quick Actions */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.primaryAction, exporting === 'pdf' && { opacity: 0.7 }]}
                        onPress={() => handleExport('pdf')}
                        disabled={!!exporting}
                    >
                        <FileText size={20} color="#fff" />
                        <Text style={styles.primaryActionText}>
                            {exporting === 'pdf' ? 'GENERATING...' : 'PDF REGISTRY'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.primaryAction, { backgroundColor: '#0f172a' }, exporting === 'pptx' && { opacity: 0.7 }]}
                        onPress={() => handleExport('pptx')}
                        disabled={!!exporting}
                    >
                        <FileText size={20} color="#fff" />
                        <Text style={styles.primaryActionText}>
                            {exporting === 'pptx' ? 'GENERATING...' : 'PPT PRESENTATION'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Team Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>AUTHORIZATION TEAM</Text>
                    <View style={styles.glassCard}>
                        {work.project && (
                            <DetailItem
                                label="PROJECT ASSIGNMENT"
                                value={work.project}
                                icon={Briefcase}
                                color="#f59e0b"
                            />
                        )}
                        <View style={{ marginTop: work.project ? 15 : 0, paddingTop: work.project ? 15 : 0, borderTopWidth: work.project ? 1 : 0, borderTopColor: '#f1f5f9' }}>
                            <DetailItem
                                label="BETA TAG"
                                value={work.beta || "Standard"}
                                icon={CheckCircle}
                                color="#db2777"
                            />
                        </View>
                        <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                            <DetailItem
                                label="RICHIE'S LEAD"
                                value={work.beforeEmployeeId?.name || "Verified Submitter"}
                                icon={User}
                            />
                        </View>
                        {work.afterEmployeeId && (
                            <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                                <DetailItem
                                    label="INSULATION VERIFICATION LEAD"
                                    value={work.afterEmployeeId?.name || "Senior Auditor"}
                                    icon={User}
                                    color="#10b981"
                                />
                            </View>
                        )}
                    </View>
                </View>

                {/* Registry Items */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>PROJECT PHASES</Text>
                        <View style={styles.phaseIndicator}>
                            <Text style={styles.phaseIndicatorText}>
                                {isCompleted ? '2/2 PHASES' : '1/2 PHASES'}
                            </Text>
                        </View>
                    </View>


                    {/* Before Phase */}
                    <View style={styles.phaseCard}>
                        <View style={styles.phaseHeader}>
                            <View style={[styles.phaseTag, { backgroundColor: '#eef2ff' }]}>
                                <Text style={[styles.phaseTagText, { color: '#6366f1' }]}>PHASE: RICHIE'S</Text>
                            </View>
                            <Text style={styles.itemCount}>{beforeItems.length} ITEMS LOGGED</Text>
                        </View>

                        {beforeItems.map((item, idx) => (
                            <View key={idx} style={styles.loggedItem}>
                                <View style={styles.itemMeta}>
                                    <TouchableOpacity
                                        style={styles.imageBox}
                                        onPress={() => setSelectedImage(getImageUrl(item.image))}
                                    >
                                        {isValidImage(getImageUrl(item.image)) ? (
                                            <Image
                                                source={{ uri: getImageUrl(item.image) }}
                                                style={styles.itemImage}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={styles.imagePlaceholder}>
                                                <FileText size={24} color="#e2e8f0" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemTitle}>{item.workTitle || `Asset Log #${idx + 1}`}</Text>
                                        <View style={styles.specRow}>
                                            <Maximize2 size={12} color="#94a3b8" />
                                            <Text style={styles.specText}>{item.heightFeet}' &times; {item.widthFeet}' | {item.totalSqFt || (item.heightFeet * item.widthFeet)} SQFT</Text>
                                        </View>
                                        <View style={styles.locRow}>
                                            <MapPin size={12} color="#94a3b8" />
                                            <Text style={styles.locText} numberOfLines={1}>{item.location || "Default Site Location"}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* After Phase */}
                    {isCompleted && (
                        <View style={[styles.phaseCard, { marginTop: 20 }]}>
                            <View style={styles.phaseHeader}>
                                <View style={[styles.phaseTag, { backgroundColor: '#ecfdf5' }]}>
                                    <Text style={[styles.phaseTagText, { color: '#10b981' }]}>PHASE: INSULATION</Text>
                                </View>
                                <Text style={styles.itemCount}>{afterItems.length} ITEMS LOGGED</Text>
                            </View>

                            {afterItems.map((item, idx) => (
                                <View key={idx} style={styles.loggedItem}>
                                    <View style={styles.itemMeta}>
                                        <TouchableOpacity
                                            style={styles.imageBox}
                                            onPress={() => setSelectedImage(getImageUrl(item.image))}
                                        >
                                            {isValidImage(getImageUrl(item.image)) ? (
                                                <Image
                                                    source={{ uri: getImageUrl(item.image) }}
                                                    style={styles.itemImage}
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <View style={[styles.imagePlaceholder, { backgroundColor: '#f0fdf4' }]}>
                                                    <CheckCircle size={24} color="#bbf7d0" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                        <View style={styles.itemInfo}>
                                            <Text style={styles.itemTitle}>{item.workTitle || `Completion Log #${idx + 1}`}</Text>
                                            <View style={styles.specRow}>
                                                <Maximize2 size={12} color="#94a3b8" />
                                                <Text style={styles.specText}>FINAL VERIFIED AREA: {item.totalSqFt || (item.heightFeet * item.widthFeet)} SQFT</Text>
                                            </View>
                                            <View style={styles.locRow}>
                                                <MapPin size={12} color="#10b981" />
                                                <Text style={[styles.locText, { color: '#059669' }]} numberOfLines={1}>{item.location || "Verified Registry Site"}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                <View style={{ height: 60 }} />
            </ScrollView>

            {/* Image Viewer Modal */}
            <Modal
                visible={!!selectedImage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedImage(null)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalCloseBtn}
                        onPress={() => setSelectedImage(null)}
                    >
                        <X size={28} color="#fff" />
                    </TouchableOpacity>
                    <Image
                        source={{ uri: selectedImage }}
                        style={styles.fullImage}
                        resizeMode="contain"
                    />
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: SPACING.pagePadding,
        paddingTop: SPACING.safeTop,
        paddingBottom: SPACING.m,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    backBtn: {
        width: SIZES.scale(40),
        height: SIZES.scale(40),
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.background,
        borderRadius: SIZES.scale(12),
    },
    headerTitle: {
        fontSize: SIZES.medium,
        fontWeight: "800",
        color: COLORS.primary,
        letterSpacing: 0.5,
    },
    editBtn: {
        width: SIZES.scale(40),
        height: SIZES.scale(40),
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.background,
        borderRadius: SIZES.scale(12),
    },
    scrollContent: {
        paddingBottom: SIZES.scale(40),
    },
    heroSection: {
        padding: SIZES.scale(24),
        backgroundColor: COLORS.white,
    },
    heroTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: SIZES.scale(16),
    },
    statusBadge: {
        paddingHorizontal: SIZES.scale(12),
        paddingVertical: SIZES.scale(6),
        borderRadius: SIZES.scale(50),
        borderWidth: 1,
    },
    statusText: {
        fontSize: SIZES.scale(10),
        fontWeight: "900",
        letterSpacing: 0.5,
    },
    dateText: {
        fontSize: SIZES.scale(12),
        fontWeight: "700",
        color: COLORS.textLight,
    },
    mainTitle: {
        fontSize: SIZES.scale(32),
        fontWeight: "900",
        color: COLORS.primary,
        letterSpacing: -1,
        lineHeight: SIZES.scale(38),
        marginBottom: SIZES.scale(12),
    },
    idBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: SIZES.scale(6),
    },
    idLabel: {
        fontSize: SIZES.scale(11),
        fontWeight: "800",
        color: COLORS.textSecondary,
        letterSpacing: 1,
    },
    idValue: {
        fontSize: SIZES.scale(12),
        fontWeight: "900",
        color: COLORS.secondary,
    },
    actionRow: {
        flexDirection: "row",
        paddingHorizontal: SIZES.scale(24),
        marginBottom: SIZES.scale(30),
        gap: SIZES.scale(12),
    },
    primaryAction: {
        flex: 1,
        backgroundColor: COLORS.secondary,
        height: SIZES.scale(56),
        borderRadius: SIZES.scale(16),
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: SIZES.scale(12),
        ...SHADOWS.premium,
    },
    primaryActionText: {
        color: COLORS.white,
        fontSize: SIZES.scale(14),
        fontWeight: "900",
        letterSpacing: 1,
    },
    section: {
        paddingHorizontal: SIZES.scale(24),
        marginBottom: SIZES.scale(30),
    },
    sectionTitle: {
        fontSize: SIZES.scale(11),
        fontWeight: "800",
        color: COLORS.textLight,
        letterSpacing: 2,
        marginBottom: SIZES.scale(15),
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: SIZES.scale(15),
    },
    glassCard: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.scale(24),
        padding: SIZES.scale(20),
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...SHADOWS.small,
    },
    detailItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: SIZES.scale(14),
    },
    detailIcon: {
        width: SIZES.scale(36),
        height: SIZES.scale(36),
        borderRadius: SIZES.scale(10),
        justifyContent: "center",
        alignItems: "center",
    },
    detailLabel: {
        fontSize: SIZES.scale(10),
        fontWeight: "800",
        color: COLORS.textLight,
        letterSpacing: 0.5,
        marginBottom: SIZES.scale(2),
    },
    detailValue: {
        fontSize: SIZES.scale(15),
        fontWeight: "800",
        color: COLORS.primary,
    },
    phaseIndicator: {
        backgroundColor: COLORS.background,
        paddingHorizontal: SIZES.scale(8),
        paddingVertical: SIZES.scale(4),
        borderRadius: SIZES.scale(6),
    },
    phaseIndicatorText: {
        fontSize: SIZES.scale(9),
        fontWeight: "900",
        color: COLORS.textSecondary,
    },
    phaseCard: {
        backgroundColor: COLORS.white,
        borderRadius: SIZES.scale(28),
        padding: SIZES.scale(5),
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...SHADOWS.small,
    },
    phaseHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: SIZES.scale(15),
    },
    phaseTag: {
        paddingHorizontal: SIZES.scale(12),
        paddingVertical: SIZES.scale(6),
        borderRadius: SIZES.scale(10),
    },
    phaseTagText: {
        fontSize: SIZES.scale(10),
        fontWeight: "900",
        letterSpacing: 1,
    },
    itemCount: {
        fontSize: SIZES.scale(10),
        fontWeight: "800",
        color: COLORS.textLight,
    },
    loggedItem: {
        borderTopWidth: 1,
        borderTopColor: COLORS.background,
        padding: SIZES.scale(15),
    },
    itemMeta: {
        flexDirection: "row",
        gap: SIZES.scale(15),
    },
    imageBox: {
        width: SIZES.scale(80),
        height: SIZES.scale(80),
        borderRadius: SIZES.scale(16),
        overflow: "hidden",
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    itemImage: {
        width: "100%",
        height: "100%",
    },
    imagePlaceholder: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    itemInfo: {
        flex: 1,
        justifyContent: "center",
    },
    itemTitle: {
        fontSize: SIZES.scale(16),
        fontWeight: "800",
        color: COLORS.primary,
        marginBottom: SIZES.scale(6),
    },
    specRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: SIZES.scale(4),
        marginBottom: SIZES.scale(4),
    },
    specText: {
        fontSize: SIZES.scale(11),
        fontWeight: "700",
        color: COLORS.textSecondary,
    },
    locRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: SIZES.scale(4),
    },
    locText: {
        fontSize: SIZES.scale(11),
        fontWeight: "600",
        color: COLORS.textLight,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.9)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalCloseBtn: {
        position: "absolute",
        top: 40,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    fullImage: {
        width: "100%",
        height: "80%",
    },
});
