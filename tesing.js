import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StatusBar
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Linking } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
    Camera,
    MapPin,
    Trash2,
    Plus,
    ArrowLeft,
    Check,
    Briefcase,
    Calendar,
    Ruler,
    ChevronDown,
    LocateFixed,
    Navigation
} from "lucide-react-native";
import { COLORS, SHADOWS, SIZES, SPACING } from "../../constants/theme";
import { createWork, updateWork } from "../../api/workApi";
import { getEmployees } from "../../api/employeeApi";

import { getImageUrl } from "../../utils/imageHelper";
import LocationPickerModal from "../../components/LocationPickerModal";
import MapPreview from "../../components/MapPreview";

// ...

export default function AddWorkScreen({ route, navigation }) {
    const editingWork = route.params?.work;
    const [employees, setEmployees] = useState([]);
    const [beforeEmployees, setBeforeEmployees] = useState([]);
    const [afterEmployees, setAfterEmployees] = useState([]);

    const [beta, setBeta] = useState(editingWork?.beta || "");
    const [distributed, setDistributed] = useState(editingWork?.distributed || "");
    const [selectedEmp, setSelectedEmp] = useState(editingWork?.assignEmployees?.before?.[0] || null);
    const [afterEmp, setAfterEmp] = useState(editingWork?.assignEmployees?.after?.[0] || null);
    const [status, setStatus] = useState(editingWork?.status || "pending");
    const [workItems, setWorkItems] = useState(editingWork?.before || []);
    const [afterWorkItems, setAfterWorkItems] = useState(editingWork?.after || []);
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [beforePickerVisible, setBeforePickerVisible] = useState(false);
    const [afterPickerVisible, setAfterPickerVisible] = useState(false);

    // Interactive Map Selector State
    const [mapModalVisible, setMapModalVisible] = useState(false);
    const [activeMapTarget, setActiveMapTarget] = useState(null); // { type, index }

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await getEmployees();
            const allEmps = res.employees || [];
            if (Array.isArray(allEmps)) {
                setEmployees(allEmps);
                // Filter by roles as per new requirement
                setBeforeEmployees(allEmps.filter(e => e.role === 'register'));
                setAfterEmployees(allEmps.filter(e => e.role === 'initialization'));
            } else {
                setEmployees([]);
                setBeforeEmployees([]);
                setAfterEmployees([]);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const pickItemImage = async (type, index) => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            updateItem(type, index, 'localImage', result.assets[0]);
        }
    };

    const handleGetLocation = async (type, index) => {
        console.log("Auto Locate Button Pressed (v2 Optimized)");

        try {
            setLocationLoading(true);

            // 1️⃣ Permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission Required", "Please allow location access to use this feature.");
                setLocationLoading(false);
                return;
            }

            // 2️⃣ Android GPS Force
            if (Platform.OS === "android") {
                try {
                    await Location.enableNetworkProviderAsync();
                } catch (e) {
                    console.warn(e);
                }
            }

            // 3️⃣ FAST SNAP (Last Known)
            // Give immediate feedback if possible
            const lastKnown = await Location.getLastKnownPositionAsync({});
            if (lastKnown) {
                console.log("Fast Snap (LastKnown) applied");
                // Update UI immediately but keep loading for refinement
                await processLocation(lastKnown, type, index, true);
            }

            // 4️⃣ HIGH ACCURACY REFINEMENT
            const locationPromise = new Promise(async (resolve, reject) => {
                let bestLoc = null;
                let subscription = null;

                // Timeout after 10s
                const timer = setTimeout(() => {
                    if (subscription) subscription.remove();
                    console.log("GPS Timeout - Resolving with best available");
                    resolve(bestLoc);
                }, 10000);

                try {
                    subscription = await Location.watchPositionAsync(
                        {
                            accuracy: Location.Accuracy.BestForNavigation,
                            timeInterval: 500,
                            distanceInterval: 0,
                        },
                        (loc) => {
                            const acc = loc.coords.accuracy;
                            console.log(`GPS Pulse: ${acc}m`);

                            if (!bestLoc || acc < bestLoc.coords.accuracy) {
                                bestLoc = loc;
                            }

                            // Professional Threshold: 20m
                            if (acc <= 20) {
                                console.log("High Accuracy Lock Acquired!");
                                clearTimeout(timer);
                                subscription.remove();
                                resolve(loc);
                            }
                        }
                    );
                } catch (err) {
                    clearTimeout(timer);
                    reject(err);
                }
            });

            const refinedLoc = await locationPromise;

            if (refinedLoc) {
                // We got a better location (or timed out with something)
                await processLocation(refinedLoc, type, index, false);
            } else if (!lastKnown) {
                // If we didn't get refined AND didn't have lastKnown
                throw new Error("Could not acquire location.");
            } else {
                // We had lastKnown, and refined returned nothing new?
                setLocationLoading(false);
            }

        } catch (err) {
            console.error("LOCATION ERROR:", err);
            Alert.alert("Location Error", "Unable to detect location. Please check GPS settings.");
            setLocationLoading(false);
        }
    };

    const processLocation = async (location, type, index, keepLoading = false) => {
        try {
            const { latitude, longitude } = location.coords;
            console.log("Processing Location:", latitude, longitude);

            // Reverse Geocode
            let addressText = `${latitude}, ${longitude}`;
            try {
                const addr = await Location.reverseGeocodeAsync({ latitude, longitude });
                if (addr.length > 0) {
                    const a = addr[0];
                    const parts = [
                        a.name,
                        a.street,
                        a.subregion,
                        a.district,
                        a.city,
                        a.region,
                        a.postalCode
                    ].filter(Boolean);

                    if (parts.length > 0) addressText = [...new Set(parts)].join(", ");
                }
            } catch (e) {
                console.log("Geocode failed");
            }

            // Append Coordinates
            addressText += `\nLat: ${latitude.toFixed(7)}, Lng: ${longitude.toFixed(7)}`;

            // Update UI
            updateItem(type, index, "location", addressText);
            updateItem(type, index, "latitude", latitude);
            updateItem(type, index, "longitude", longitude);

        } catch (e) {
            console.error(e);
        } finally {
            if (!keepLoading) {
                setLocationLoading(false);
            }
        }
    };

    const handleOpenMapPicker = (type, index) => {
        setActiveMapTarget({ type, index });
        setMapModalVisible(true);
    };

    const handleLocationSelected = (locationData) => {
        if (!locationData || !activeMapTarget) return;
        const { type, index } = activeMapTarget;

        updateItem(type, index, 'latitude', locationData.latitude);
        updateItem(type, index, 'longitude', locationData.longitude);
        updateItem(type, index, 'location', locationData.address);

        setMapModalVisible(false);
        setActiveMapTarget(null);
    };

    const addItemSource = (type) => {
        const newItem = {
            workTitle: "",
            heightFeet: "",
            widthFeet: "",
            totalSqFt: "",
            location: "",
            latitude: null,
            longitude: null,
            image: null
        };
        if (type === "before") setWorkItems([...workItems, newItem]);
        else setAfterWorkItems([...afterWorkItems, newItem]);
    };

    const updateItem = (type, index, field, value) => {
        const updater = (prev) => {
            const list = [...prev];
            const item = { ...list[index], [field]: value };
            if (field === "heightFeet" || field === "widthFeet") {
                const h = parseFloat(item.heightFeet) || 0;
                const w = parseFloat(item.widthFeet) || 0;
                item.totalSqFt = (h * w).toFixed(2);
            }
            list[index] = item;
            return list;
        };
        if (type === "before") setWorkItems(updater(workItems));
        else setAfterWorkItems(updater(afterWorkItems));
    };
    const removeItem = (type, index) => {
        if (type === "before") {
            const list = [...workItems];
            list.splice(index, 1);
            setWorkItems(list);
        } else {
            const list = [...afterWorkItems];
            list.splice(index, 1);
            setAfterWorkItems(list);
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const formData = new FormData();

            if (editingWork) {
                // --- UPDATE FLOW (Legacy/Existing Logic) ---
                formData.append("beta", beta);
                formData.append("distributed", distributed);
                formData.append("status", status);
                formData.append("id", editingWork._id);

                if (selectedEmp) formData.append("assignEmployees[before][]", selectedEmp);
                if (afterEmp) formData.append("assignEmployees[after][]", afterEmp);

                workItems.forEach((item, i) => {
                    formData.append(`before[${i}][workTitle]`, item.workTitle || "");
                    formData.append(`before[${i}][heightFeet]`, item.heightFeet || 0);
                    formData.append(`before[${i}][widthFeet]`, item.widthFeet || 0);
                    formData.append(`before[${i}][totalSqFt]`, item.totalSqFt || 0);
                    formData.append(`before[${i}][location]`, item.location || "");
                    if (item.latitude) formData.append(`before[${i}][latitude]`, item.latitude);
                    if (item.longitude) formData.append(`before[${i}][longitude]`, item.longitude);
                    if (item.localImage) {
                        const localUri = item.localImage.uri;
                        const filename = localUri.split('/').pop();
                        const match = /\.(\w+)$/.exec(filename);
                        const type = match ? `image/${match[1]}` : `image/jpeg`;
                        formData.append(`beforeImages`, { uri: localUri, name: filename, type });
                    } else if (item.image) {
                        formData.append(`before[${i}][image]`, item.image);
                    }
                });

                afterWorkItems.forEach((item, i) => {
                    formData.append(`after[${i}][workTitle]`, item.workTitle || "");
                    formData.append(`after[${i}][heightFeet]`, item.heightFeet || 0);
                    formData.append(`after[${i}][widthFeet]`, item.widthFeet || 0);
                    formData.append(`after[${i}][totalSqFt]`, item.totalSqFt || 0);
                    formData.append(`after[${i}][location]`, item.location || "");
                    if (item.latitude) formData.append(`after[${i}][latitude]`, item.latitude);
                    if (item.longitude) formData.append(`after[${i}][longitude]`, item.longitude);
                    if (item.localImage) {
                        const localUri = item.localImage.uri;
                        const filename = localUri.split('/').pop();
                        const match = /\.(\w+)$/.exec(filename);
                        const type = match ? `image/${match[1]}` : `image/jpeg`;
                        formData.append(`afterImages`, { uri: localUri, name: filename, type });
                    } else if (item.image) {
                        formData.append(`after[${i}][image]`, item.image);
                    }
                });

                await updateWork(formData);

            } else {
                // --- CREATE FLOW (New API Spec) ---
                if (!selectedEmp) {
                    Alert.alert("Validation Error", "Please select an Execution Partner (Before Phase).");
                    setLoading(false);
                    return;
                }

                formData.append("beforeEmployeeId", selectedEmp);
                if (afterEmp) formData.append("afterEmployeeId", afterEmp);

                formData.append("status", status);
                if (beta) formData.append("beta", beta);
                if (distributed) formData.append("distributed", distributed);

                // Prepare Data Arrays (JSON Strings)
                const beforeData = workItems.map(item => ({
                    workTitle: item.workTitle,
                    heightFeet: item.heightFeet,
                    widthFeet: item.widthFeet,
                    totalSqFt: item.totalSqFt,
                    location: item.location,
                    latitude: item.latitude,
                    longitude: item.longitude
                }));

                const afterData = afterWorkItems.map(item => ({
                    workTitle: item.workTitle,
                    heightFeet: item.heightFeet,
                    widthFeet: item.widthFeet,
                    totalSqFt: item.totalSqFt,
                    location: item.location,
                    latitude: item.latitude,
                    longitude: item.longitude
                }));

                formData.append("beforeData", JSON.stringify(beforeData));
                formData.append("afterData", JSON.stringify(afterData));

                // Append Images (Files)
                workItems.forEach((item) => {
                    if (item.localImage) {
                        const localUri = item.localImage.uri;
                        const filename = localUri.split('/').pop();
                        const match = /\.(\w+)$/.exec(filename);
                        const type = match ? `image/${match[1]}` : `image/jpeg`;
                        formData.append("beforeImages", { uri: localUri, name: filename, type });
                    }
                });

                afterWorkItems.forEach((item) => {
                    if (item.localImage) {
                        const localUri = item.localImage.uri;
                        const filename = localUri.split('/').pop();
                        const match = /\.(\w+)$/.exec(filename);
                        const type = match ? `image/${match[1]}` : `image/jpeg`;
                        formData.append("afterImages", { uri: localUri, name: filename, type });
                    }
                });

                await createWork(formData);
            }

            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to save work order.");
        } finally {
            setLoading(false);
        }
    };

    const renderItemCard = (item, index, type) => {
        const displayImage = item.localImage?.uri || getImageUrl(item.image);

        // optimize cloudinary images for preview
        const getOptimizedSource = (uri) => {
            if (typeof uri === 'string' && uri.includes('cloudinary.com') && !uri.includes('w_')) {
                // Insert generic optimization params after 'upload/'
                return uri.replace('/upload/', '/upload/w_400,c_fit,q_auto,f_auto/');
            }
            return uri;
        };

        const optimizedImage = getOptimizedSource(displayImage);

        return (
            <Animated.View
                key={index}
                entering={FadeInDown.delay(index * 100).springify()}
                style={styles.card}
            >
                <View style={styles.cardContent}>
                    {/* Visual Preview Section */}
                    <View style={styles.imageColumn}>
                        {displayImage ? (
                            <Image
                                source={{ uri: optimizedImage }}
                                style={styles.itemPreview}
                                resizeMode="cover"
                            />
                        ) : (
                            <TouchableOpacity
                                style={styles.placeholderBox}
                                onPress={() => pickItemImage(type, index)}
                            >
                                <Camera size={24} color="#475569" style={{ marginBottom: 8 }} />
                                <Text style={styles.placeholderText}>ADD PHOTO</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* ... rest of card content */}

                    {/* Data Entry Section - REPEAT existing structure */}
                    <View style={styles.inputColumn}>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.inputLabel}>SHOP NAME</Text>
                            <TextInput
                                style={styles.glassInput}
                                placeholder="e.g. Apollo Pharmacy"
                                placeholderTextColor="#64748b"
                                value={item.workTitle}
                                onChangeText={(v) => updateItem(type, index, "workTitle", v)}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.inputLabel}>HEIGHT (FT)</Text>
                                <TextInput
                                    style={styles.glassInput}
                                    placeholder="0"
                                    placeholderTextColor="#64748b"
                                    value={item.heightFeet?.toString()}
                                    onChangeText={(v) => updateItem(type, index, "heightFeet", v)}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={[styles.fieldGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>WIDTH (FT)</Text>
                                <TextInput
                                    style={styles.glassInput}
                                    placeholder="0"
                                    placeholderTextColor="#64748b"
                                    value={item.widthFeet?.toString()}
                                    onChangeText={(v) => updateItem(type, index, "widthFeet", v)}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.inputLabel}>AREA (SQFT)</Text>
                            <View style={styles.areaBox}>
                                <Text style={styles.areaValue}>
                                    {item.totalSqFt || "0"} <Text style={styles.areaUnit}>sq.ft</Text>
                                </Text>
                            </View>
                        </View>

                        <View style={styles.fieldGroup}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <Text style={styles.inputLabel}>SITE ADDRESS *</Text>
                                <TouchableOpacity
                                    onPress={() => handleGetLocation(type, index)}
                                    style={styles.autoLocateBtn}
                                    disabled={locationLoading}
                                >
                                    {locationLoading ? (
                                        <ActivityIndicator size="small" color="#0ea5e9" />
                                    ) : (
                                        <>
                                            <Navigation size={12} color="#0ea5e9" style={{ marginRight: 4 }} />
                                            <Text style={styles.autoLocateText}>AUTO LOCATE</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                            <View style={styles.addressContainer}>
                                <TextInput
                                    style={[styles.glassInput, { height: 80, textAlignVertical: 'top', flex: 1 }]}
                                    placeholder="Enter address manually"
                                    placeholderTextColor="#64748b"
                                    multiline={true}
                                    value={item.location}
                                    onChangeText={(v) => updateItem(type, index, "location", v)}
                                />
                                <TouchableOpacity
                                    style={styles.mapBtn}
                                    onPress={() => handleOpenMapPicker(type, index)}
                                >
                                    <MapPreview
                                        latitude={item.latitude}
                                        longitude={item.longitude}
                                        onPress={() => handleOpenMapPicker(type, index)}
                                        isLoading={locationLoading}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.itemActions}>
                            <TouchableOpacity
                                style={styles.outlineBtn}
                                onPress={() => pickItemImage(type, index)}
                            >
                                <Text style={styles.outlineBtnText}>
                                    {displayImage ? "REPLACE IMAGE" : "SELECT IMAGE"}
                                </Text>
                            </TouchableOpacity>

                            {index > 0 && (
                                <TouchableOpacity
                                    style={styles.deleteCircle}
                                    onPress={() => removeItem(type, index)}
                                >
                                    <Trash2 size={16} color="#ef4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </Animated.View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            {/* ... Header and other sections remain same */}
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft size={24} color="#0f172a" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{editingWork ? "Update Registry" : "New Work Order"}</Text>
                </View>
                <View style={styles.progressTrack}>
                    <View style={[styles.progressBar, { width: status === 'completed' ? '100%' : '50%' }]} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Registration Metadata */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeading}>REGISTRATION INFO</Text>
                    <View style={styles.row}>
                        <View style={[styles.fieldGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.inputLabel}>BETA TAG</Text>
                            <TextInput
                                style={styles.glassInput}
                                placeholder="v1.0.0"
                                placeholderTextColor="#64748b"
                                value={beta}
                                onChangeText={setBeta}
                            />
                        </View>
                        <View style={[styles.fieldGroup, { flex: 1 }]}>
                            <Text style={styles.inputLabel}>DISTRIBUTION</Text>
                            <TextInput
                                style={styles.glassInput}
                                placeholder="Central"
                                placeholderTextColor="#64748b"
                                value={distributed}
                                onChangeText={setDistributed}
                            />
                        </View>
                    </View>
                </View>

                {/* Personnel Assignment */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeading}>PERSONNEL ASSIGNMENT</Text>

                    <Text style={styles.subLabel}>S/O EMPLOYEE (BEFORE) *</Text>
                    <View style={styles.dropdownContainer}>
                        <TouchableOpacity
                            style={[styles.dropdownTrigger, beforePickerVisible && styles.dropdownTriggerActive]}
                            onPress={() => {
                                setBeforePickerVisible(!beforePickerVisible);
                                setAfterPickerVisible(false);
                            }}
                        >
                            <Text style={[styles.dropdownValue, !selectedEmp && { color: '#94a3b8' }]}>
                                {beforeEmployees.find(e => e._id === selectedEmp)?.name || "Select Employee"}
                            </Text>
                            <ChevronDown size={18} color={beforePickerVisible ? "#0ea5e9" : "#64748b"} />
                        </TouchableOpacity>

                        {beforePickerVisible && (
                            <Animated.View entering={FadeInDown.duration(200)} style={styles.dropdownMenu}>
                                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
                                    {beforeEmployees.map(emp => (
                                        <TouchableOpacity
                                            key={emp._id}
                                            style={[styles.dropdownItem, selectedEmp === emp._id && styles.dropdownItemActive]}
                                            onPress={() => {
                                                setSelectedEmp(emp._id);
                                                setBeforePickerVisible(false);
                                            }}
                                        >
                                            <Text style={[styles.dropdownItemText, selectedEmp === emp._id && styles.dropdownItemTextActive]}>
                                                {emp.name}
                                            </Text>
                                            {selectedEmp === emp._id && <Check size={16} color="#0ea5e9" />}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </Animated.View>
                        )}
                    </View>

                    <Text style={[styles.subLabel, { marginTop: 15 }]}>EXECUTION PARTNER (AFTER)</Text>
                    <View style={styles.dropdownContainer}>
                        <TouchableOpacity
                            style={[styles.dropdownTrigger, afterPickerVisible && styles.dropdownTriggerActive]}
                            onPress={() => {
                                setAfterPickerVisible(!afterPickerVisible);
                                setBeforePickerVisible(false);
                            }}
                        >
                            <Text style={[styles.dropdownValue, !afterEmp && { color: '#94a3b8' }]}>
                                {afterEmployees.find(e => e._id === afterEmp)?.name || "Select Partner"}
                            </Text>
                            <ChevronDown size={18} color={afterPickerVisible ? "#0ea5e9" : "#64748b"} />
                        </TouchableOpacity>

                        {afterPickerVisible && (
                            <Animated.View entering={FadeInDown.duration(200)} style={styles.dropdownMenu}>
                                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
                                    {afterEmployees.map(emp => (
                                        <TouchableOpacity
                                            key={emp._id}
                                            style={[styles.dropdownItem, afterEmp === emp._id && styles.dropdownItemActive]}
                                            onPress={() => {
                                                setAfterEmp(emp._id);
                                                setAfterPickerVisible(false);
                                            }}
                                        >
                                            <Text style={[styles.dropdownItemText, afterEmp === emp._id && styles.dropdownItemTextActive]}>
                                                {emp.name}
                                            </Text>
                                            {afterEmp === emp._id && <Check size={16} color="#0ea5e9" />}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </Animated.View>
                        )}
                    </View>
                </View>
                {/* ... rest of the file */}

                {/* Status Switcher */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeading}>CURRENT WORK STATUS</Text>
                    <View style={styles.tabContainer}>
                        {["pending", "completed"].map(s => (
                            <TouchableOpacity
                                key={s}
                                style={[styles.tab, status === s && styles.tabActive]}
                                onPress={() => setStatus(s)}
                            >
                                <Text style={[styles.tabText, status === s && styles.tabTextActive]}>
                                    {s.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Dynamic Work Items */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionHeading}>BEFORE PHASE ITEMS</Text>
                        <TouchableOpacity onPress={() => addItemSource("before")}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Plus size={12} color="#0ea5e9" style={{ marginRight: 4 }} />
                                <Text style={styles.addLink}>ADD ITEM</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    {workItems.map((item, index) => renderItemCard(item, index, "before"))}
                </View>

                {/* Completion Section */}
                {(status === "completed" || editingWork?.after?.length > 0) && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionHeading, { color: '#fbbf24' }]}>AFTER PHASE (COMPLETION)</Text>
                            <TouchableOpacity onPress={() => addItemSource("after")}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Plus size={12} color="#fbbf24" style={{ marginRight: 4 }} />
                                    <Text style={[styles.addLink, { color: '#fbbf24' }]}>ADD ITEM</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        {afterWorkItems.map((item, index) => renderItemCard(item, index, "after"))}
                    </View>
                )}

                {/* Form Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.cancelBtnText}>DISCARD CHANGES</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.primaryBtnText}>{editingWork ? "UPDATE ORDER" : "CREATE ORDER"}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={{ height: 60 }} />
            </ScrollView>

            <LocationPickerModal
                visible={mapModalVisible}
                onClose={() => setMapModalVisible(false)}
                onSave={handleLocationSelected}
                initialLocation={activeMapTarget ? (activeMapTarget.type === 'before' ? workItems[activeMapTarget.index] : afterWorkItems[activeMapTarget.index]) : null}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc", // Note: Light Slate
    },
    header: {
        backgroundColor: "#ffffff",
        paddingTop: SPACING.safeTop,
        paddingBottom: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    headerTop: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
    },
    backBtn: {
        marginRight: 15,
        backgroundColor: '#f1f5f9',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#0f172a", // Slate 900
        letterSpacing: 0.5,
    },
    progressTrack: {
        height: 4,
        backgroundColor: '#f1f5f9',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#0ea5e9',
    },
    scroll: {
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionHeading: {
        fontSize: 12,
        fontWeight: "900",
        color: "#64748b",
        letterSpacing: 1.5,
    },
    subLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: "#475569",
        marginBottom: 8,
        textTransform: "uppercase",
    },
    fieldGroup: {
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: "800",
        color: "#475569",
        marginBottom: 6,
        marginLeft: 2,
    },
    glassInput: {
        backgroundColor: "#ffffff",
        color: "#0f172a",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        fontSize: 14,
        minHeight: 48,
    },
    inputWithAction: {
        flexDirection: 'row',
        gap: 8,
    },
    mapIconBtn: {
        backgroundColor: '#ffffff',
        width: 48,
        height: 48,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        justifyContent: 'center',
        alignItems: 'center',
    },
    row: {
        flexDirection: "row",
    },
    badgeList: {
        marginBottom: 5,
    },
    badge: {
        backgroundColor: "#ffffff",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 10,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    badgeActive: {
        backgroundColor: "#0ea5e920",
        borderColor: "#0ea5e9",
    },
    badgeText: {
        color: "#64748b",
        fontSize: 12,
        fontWeight: "600",
    },
    badgeTextActive: {
        color: "#0284c7", // Darker blue
    },
    dropdownContainer: {
        position: 'relative',
        zIndex: 50,
    },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        minHeight: 52,
    },
    dropdownTriggerActive: {
        borderColor: '#0ea5e9',
        backgroundColor: '#f0f9ff',
    },
    dropdownValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
    },
    dropdownMenu: {
        marginTop: 4,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
        overflow: 'hidden',
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    dropdownItemActive: {
        backgroundColor: '#f8fafc',
    },
    dropdownItemText: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '500',
    },
    dropdownItemTextActive: {
        color: '#0ea5e9',
        fontWeight: '700',
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "#f1f5f9",
        padding: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    tabActive: {
        backgroundColor: "#ffffff",
        shadowColor: "#64748b",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        fontSize: 11,
        fontWeight: "800",
        color: "#94a3b8",
        letterSpacing: 1,
    },
    tabTextActive: {
        color: "#0ea5e9",
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        // Soft outer glow
        shadowColor: "#64748b",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardContent: {
        flexDirection: "row",
        gap: 16,
    },
    imageColumn: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    inputColumn: {
        flex: 2.5,
    },
    areaBox: {
        backgroundColor: '#cbd5e180',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        height: 48,
        justifyContent: 'center',
    },
    areaValue: {
        color: '#0ea5e9',
        fontSize: 16,
        fontWeight: '700',
    },
    areaUnit: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    locationSection: {
        marginTop: 5,
    },
    locationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    autoLocateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    autoLocateText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#0ea5e9',
    },
    locationRow: {
        flexDirection: 'row',
        gap: 12,
    },
    locationInput: {
        flex: 1,
        minHeight: 80,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    locationInputWrapper: {
        flex: 1,
        position: 'relative',
        borderRadius: 12,
    },
    pinpointLoader: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#0ea5e980',
        zIndex: 10,
    },
    pinpointText: {
        fontSize: 9,
        color: '#0ea5e9',
        fontWeight: '900',
        marginTop: 6,
        letterSpacing: 1,
    },
    mapPreviewBox: {
        width: 80,
        height: 80,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
    },
    mapPreviewImage: {
        width: '100%',
        height: '100%',
    },
    mapPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
    },
    mapPlaceholderText: {
        fontSize: 8,
        color: '#94a3b8',
        fontWeight: '800',
        marginTop: 4,
        textAlign: 'center',
    },
    mapLoaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#ffffff80',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemPreview: {
        width: '100%',
        aspectRatio: 0.85,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
    },
    placeholderBox: {
        width: '100%',
        aspectRatio: 0.85,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderStyle: 'dashed',
    },
    placeholderEmoji: {
        fontSize: 24,
        marginBottom: 8,
    },
    placeholderText: {
        color: '#64748b',
        fontSize: 9,
        fontWeight: '900',
    },
    addLink: {
        color: "#0ea5e9",
        fontWeight: "800",
        fontSize: 12,
    },
    itemActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        gap: 12,
    },
    outlineBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#0ea5e9",
        alignItems: "center",
    },
    outlineBtnText: {
        color: "#0ea5e9",
        fontSize: 10,
        fontWeight: "900",
    },
    deleteCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#ef444410',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        marginTop: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },
    cancelBtn: {
        paddingVertical: 12,
    },
    cancelBtnText: {
        color: '#64748b',
        fontWeight: '800',
        fontSize: 12,
        letterSpacing: 1,
    },
    primaryBtn: {
        backgroundColor: "#0ea5e9",
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        minWidth: 160,
        alignItems: "center",
        shadowColor: "#0ea5e9",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryBtnText: {
        color: "#fff",
        fontWeight: "900",
        fontSize: 14,
        letterSpacing: 0.5,
    },
    addressContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    mapBtn: {
        width: 80,
        height: 80,
        borderRadius: 12,
        overflow: 'hidden',
    },
});
