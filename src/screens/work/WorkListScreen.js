import React, { useState, useCallback, useMemo } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Image,
    TextInput,
    Dimensions,
    SafeAreaView,
    StatusBar
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import {
    Briefcase,
    Clock,
    CheckCircle,
    Search,
    MapPin,
    FileText,
    Trash2,
    Plus,
    Menu,
    Presentation
} from "lucide-react-native";

import { getWorks, deleteWork } from "../../api/workApi";
import { exportWorkToPDF } from "../../utils/pdfExport";
import { exportWorkToPPTX } from "../../utils/pptxExport";
import { COLORS, SHADOWS, SIZES, SPACING } from "../../constants/theme";

const StatCard = ({ title, value, icon: Icon, color, delay }) => (
    <Animated.View entering={FadeInDown.delay(delay).duration(600)} style={styles.statCard}>
        <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
            <Icon size={22} color={color} />
        </View>
        <View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{title}</Text>
        </View>
    </Animated.View>
);

import { getImageUrl } from "../../utils/imageHelper";

const isValidImage = (url) => {
    return url && typeof url === 'string' && url.length > 5;
};

const WorkCard = ({ item, navigation, onDelete }) => {
    const beforeItem = item.before?.[0] || item.beforeData?.[0];
    const afterItem = item.after?.[0] || item.afterData?.[0];
    const isCompleted = item.status === "completed";
    const itemImage = getImageUrl(isCompleted && afterItem?.image ? afterItem.image : beforeItem?.image);
    const progress = isCompleted ? "100%" : beforeItem ? "50%" : "10%";

    const [exporting, setExporting] = useState(null);

    const handleExport = async (type) => {
        setExporting(type);
        try {
            if (type === 'pdf') {
                await exportWorkToPDF(item);
            } else {
                await exportWorkToPPTX(item);
            }
            Alert.alert("Export Successful", "Document registry generated successfully.");
        } catch (e) {
            Alert.alert("Export Error", "Failed to generate document registry.");
        } finally {
            setExporting(null);
        }
    };

    return (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.card}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate("WorkDetail", { workData: item })}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.statusBadge, {
                        backgroundColor: isCompleted ? "#ecfdf5" : "#fff7ed",
                        borderColor: isCompleted ? "#10b981" : "#f59e0b"
                    }]}>
                        <Text style={[styles.statusText, { color: isCompleted ? "#10b981" : "#f59e0b" }]}>
                            {item.status?.toUpperCase() || "PENDING"}
                        </Text>
                    </View>
                    <View style={styles.cardActions}>
                        <TouchableOpacity onPress={() => handleExport('pdf')} disabled={!!exporting} style={styles.iconBtn}>
                            <FileText size={18} color={exporting === 'pdf' ? "#94a3b8" : "#6366f1"} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleExport('pptx')} disabled={!!exporting} style={[styles.iconBtn, { backgroundColor: '#f1f5f9' }]}>
                            <Presentation size={18} color={exporting === 'pptx' ? "#94a3b8" : "#0f172a"} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onDelete(item._id)} style={[styles.iconBtn, { backgroundColor: '#fef2f2' }]}>
                            <Trash2 size={18} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.imageBox}>
                        {isValidImage(itemImage) ? (
                            <Image
                                source={{ uri: itemImage }}
                                style={styles.cardImage}
                                resizeMode="cover"
                                onError={(e) => console.log("Image Load Error:", e.nativeEvent.error)}
                            />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Briefcase size={24} color="#e2e8f0" />
                            </View>
                        )}
                    </View>
                    <View style={styles.cardInfo}>
                        <Text style={styles.workTitle} numberOfLines={1}>
                            {beforeItem?.workTitle || "Executive Asset"}
                        </Text>
                        <Text style={[styles.clientName, { marginBottom: item.afterEmployeeId ? 2 : 10 }]} numberOfLines={1}>
                            RICHIE'S LEAD: {item.beforeEmployeeId?.name || "Verified Submitter"}
                        </Text>
                        {item.afterEmployeeId && (
                            <Text style={[styles.clientName, { color: '#0ea5e9' }]} numberOfLines={1}>
                                INSULATION: {item.afterEmployeeId?.name}
                            </Text>
                        )}
                        <View style={styles.locRow}>
                            <MapPin size={12} color="#94a3b8" />
                            <Text style={styles.locText} numberOfLines={1}>
                                {beforeItem?.location || "Site Location Unlogged"}
                            </Text>
                        </View>
                        <View style={[styles.locRow, { marginTop: 4 }]}>
                            {item.project && (
                                <View style={styles.miniBadge}>
                                    <Text style={styles.miniBadgeText}>{item.project}</Text>
                                </View>
                            )}
                            {item.beta && (
                                <View style={[styles.miniBadge, { backgroundColor: '#fdf2f8' }]}>
                                    <Text style={[styles.miniBadgeText, { color: '#db2777' }]}>{item.beta}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Phase Progress</Text>
                        <Text style={styles.progressValue}>{progress}</Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, {
                            width: progress,
                            backgroundColor: isCompleted ? "#10b981" : "#6366f1"
                        }]} />
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function WorkListScreen({ navigation }) {
    const [works, setWorks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    const loadWorks = async () => {
        try {
            const res = await getWorks();
            if (res && res.success && Array.isArray(res.works)) {
                setWorks(res.works);
            } else if (Array.isArray(res)) {
                setWorks(res);
            } else if (res && Array.isArray(res.works)) {
                setWorks(res.works);
            }
        } catch (error) {
            Alert.alert("Sync Error", "Could not refresh work list. Please check your connection.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadWorks();
        }, [])
    );

    const handleDelete = (id) => {
        Alert.alert("Retire Order", "Are you sure you want to retire this work order from the active registry?", [
            { text: "Keep Order", style: "cancel" },
            {
                text: "Retire Now",
                style: "destructive",
                onPress: async () => {
                    try {
                        const res = await deleteWork(id);
                        if (res.success || res.message) {
                            setWorks(prev => prev.filter(w => w._id !== id));
                            Alert.alert("System Update", "Work order has been retired successfully.");
                        }
                    } catch (e) {
                        const errorMsg = e.response?.data?.message || "Failed to process retirement request.";
                        console.error("Delete UI Error:", errorMsg);
                        Alert.alert("System Error", errorMsg);
                    }
                }
            }
        ]);
    };

    const stats = useMemo(() => ({
        total: works.length,
        pending: works.filter(w => w.status !== "completed").length,
        completed: works.filter(w => w.status === "completed").length
    }), [works]);

    const filteredWorks = works.filter(w => {
        const title = (w.before?.[0]?.workTitle || w.beforeData?.[0]?.workTitle || "").toLowerCase();
        const emp = (w.beforeEmployeeId?.name || "").toLowerCase();
        const project = (w.project || "").toLowerCase();
        const beta = (w.beta || "").toLowerCase();
        const search = searchTerm.toLowerCase();
        return title.includes(search) || emp.includes(search) || project.includes(search) || beta.includes(search);
    });

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Initializing Registry...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.menuBtn}
                    onPress={() => navigation.openDrawer()}
                >
                    <Menu size={20} color="#0f172a" />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.headerTitle}>Work Registry</Text>
                    <Text style={styles.headerSubtitle}>Official Monitoring HUB</Text>
                </View>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => navigation.navigate("AddWork")}
                >
                    <Plus size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredWorks}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={() => (
                    <View>
                        <View style={styles.statsRow}>
                            <StatCard title="TOTAL" value={stats.total} icon={Briefcase} color="#6366f1" delay={0} />
                            <StatCard title="ACTIVE" value={stats.pending} icon={Clock} color="#f59e0b" delay={100} />
                            <StatCard title="DONE" value={stats.completed} icon={CheckCircle} color="#10b981" delay={200} />
                        </View>

                        <View style={styles.searchSection}>
                            <View style={styles.searchBox}>
                                <Search size={18} color="#94a3b8" />
                                <TextInput
                                    placeholder="Search registry..."
                                    style={styles.searchInput}
                                    placeholderTextColor="#94a3b8"
                                    value={searchTerm}
                                    onChangeText={setSearchTerm}
                                />
                            </View>
                        </View>
                    </View>
                )}
                renderItem={({ item }) => (
                    <WorkCard
                        item={item}
                        navigation={navigation}
                        onDelete={handleDelete}
                    />
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => {
                        setRefreshing(true);
                        loadWorks();
                    }} />
                }
                ListEmptyComponent={() => (
                    !loading && (
                        <View style={styles.empty}>
                            <Briefcase size={64} color="#e2e8f0" />
                            <Text style={styles.emptyText}>Registry Isolated</Text>
                            <Text style={styles.emptySubText}>Try adjusting your search filters or sync the database.</Text>
                        </View>
                    )
                )}
            />
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
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.background,
    },
    loadingText: {
        marginTop: SPACING.m,
        fontSize: SIZES.small,
        fontWeight: "800",
        color: COLORS.textLight,
        letterSpacing: 1.5,
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
        ...SHADOWS.glass,
    },
    headerTitle: {
        fontSize: SIZES.extraLarge,
        fontWeight: "900",
        color: COLORS.primary,
        letterSpacing: -1,
    },
    headerSubtitle: {
        fontSize: SIZES.scale(10),
        fontWeight: "800",
        color: COLORS.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 2,
    },
    addBtn: {
        width: SIZES.scale(46),
        height: SIZES.scale(46),
        backgroundColor: COLORS.secondary,
        borderRadius: SIZES.scale(14),
        justifyContent: "center",
        alignItems: "center",
        ...SHADOWS.premium,
    },
    menuBtn: {
        width: SIZES.scale(46),
        height: SIZES.scale(46),
        backgroundColor: COLORS.white,
        borderRadius: SIZES.scale(14),
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    list: {
        paddingBottom: SIZES.scale(60),
    },
    statsRow: {
        flexDirection: "row",
        padding: SPACING.pagePadding,
        gap: SIZES.scale(12),
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: SIZES.scale(20),
        padding: SIZES.scale(14),
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...SHADOWS.small,
    },
    statIconContainer: {
        width: SIZES.scale(36),
        height: SIZES.scale(36),
        borderRadius: SIZES.scale(10),
        justifyContent: "center",
        alignItems: "center",
        marginBottom: SIZES.scale(10),
    },
    statValue: {
        fontSize: SIZES.scale(20),
        fontWeight: "900",
        color: COLORS.primary,
    },
    statLabel: {
        fontSize: SIZES.scale(9),
        fontWeight: "800",
        color: COLORS.textLight,
        letterSpacing: 0.5,
    },
    searchSection: {
        paddingHorizontal: SPACING.pagePadding,
        marginBottom: SPACING.m,
    },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.white,
        borderRadius: SIZES.scale(16),
        paddingHorizontal: SIZES.scale(16),
        height: SIZES.scale(54),
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: SIZES.scale(10),
        fontSize: SIZES.font,
        fontWeight: "600",
        color: COLORS.primary,
    },
    card: {
        backgroundColor: COLORS.white,
        marginHorizontal: SPACING.pagePadding,
        marginBottom: SPACING.m,
        borderRadius: SIZES.scale(28),
        padding: SIZES.scale(18),
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...SHADOWS.premium,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: SIZES.scale(18),
    },
    statusBadge: {
        paddingHorizontal: SIZES.scale(12),
        paddingVertical: SIZES.scale(6),
        borderRadius: SIZES.scale(10),
        borderWidth: 1,
    },
    statusText: {
        fontSize: SIZES.scale(10),
        fontWeight: "900",
        letterSpacing: 0.5,
    },
    cardActions: {
        flexDirection: "row",
        gap: SIZES.scale(10),
    },
    iconBtn: {
        width: SIZES.scale(38),
        height: SIZES.scale(38),
        backgroundColor: COLORS.background,
        borderRadius: SIZES.scale(12),
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    cardBody: {
        flexDirection: "row",
        gap: SIZES.scale(16),
        marginBottom: SIZES.scale(22),
    },
    imageBox: {
        width: SIZES.scale(84),
        height: SIZES.scale(84),
        borderRadius: SIZES.scale(18),
        backgroundColor: COLORS.background,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    cardImage: {
        width: "100%",
        height: "100%",
    },
    imagePlaceholder: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    cardInfo: {
        flex: 1,
        justifyContent: "center",
    },
    workTitle: {
        fontSize: SIZES.large,
        fontWeight: "900",
        color: COLORS.primary,
        marginBottom: SIZES.scale(4),
        letterSpacing: -0.5,
    },
    clientName: {
        fontSize: SIZES.scale(12),
        fontWeight: "700",
        color: COLORS.textSecondary,
        marginBottom: SIZES.scale(10),
    },
    locRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: SIZES.scale(6),
    },
    locText: {
        fontSize: SIZES.scale(11),
        fontWeight: "600",
        color: COLORS.textLight,
        flex: 1,
    },
    cardFooter: {
        paddingTop: SIZES.scale(16),
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
    },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: SIZES.scale(10),
    },
    progressLabel: {
        fontSize: SIZES.scale(11),
        fontWeight: "800",
        color: COLORS.textLight,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    progressValue: {
        fontSize: SIZES.scale(12),
        fontWeight: "900",
        color: COLORS.primary,
    },
    progressBar: {
        height: SIZES.scale(8),
        backgroundColor: COLORS.background,
        borderRadius: SIZES.scale(4),
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: SIZES.scale(4),
    },
    empty: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: SIZES.scale(80),
        paddingHorizontal: SPACING.xl,
    },
    emptyText: {
        fontSize: SIZES.extraLarge,
        fontWeight: "900",
        color: COLORS.primary,
        marginTop: SIZES.scale(24),
        marginBottom: SIZES.scale(10),
        letterSpacing: -0.5,
    },
    emptySubText: {
        fontSize: SIZES.font,
        color: COLORS.textSecondary,
        textAlign: "center",
        lineHeight: SIZES.scale(20),
    },
    miniBadge: {
        backgroundColor: COLORS.background,
        paddingHorizontal: SIZES.scale(8),
        paddingVertical: SIZES.scale(3),
        borderRadius: SIZES.scale(6),
        marginRight: SIZES.scale(8),
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    miniBadgeText: {
        fontSize: SIZES.scale(10),
        fontWeight: "800",
        color: COLORS.textSecondary,
        textTransform: "uppercase",
    }
});
