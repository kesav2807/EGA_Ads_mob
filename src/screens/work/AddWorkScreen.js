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
    StatusBar,
    Linking
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
    Image as ImageIcon,
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
import { createWork, updateWork, getBetas } from "../../api/workApi";
import { getEmployees } from "../../api/employeeApi";
import { getImageUrl } from "../../utils/imageHelper";
import LocationPickerModal from "../../components/LocationPickerModal";
import MapPreview from "../../components/MapPreview";

export default function AddWorkScreen({ route, navigation }) {
    const editingWork = route.params?.work;
    const [employees, setEmployees] = useState([]);
    const [beforeEmployees, setBeforeEmployees] = useState([]);
    const [afterEmployees, setAfterEmployees] = useState([]);

    const [betasList, setBetasList] = useState([]);
    const [betaPickerVisible, setBetaPickerVisible] = useState(false);

    const [beta, setBeta] = useState(editingWork?.beta || "");
    const [distributed, setDistributed] = useState(editingWork?.distributed || "");
    const _extractId = (val) => val && typeof val === 'object' ? val._id : val;

    const [selectedEmp, setSelectedEmp] = useState(
        _extractId(editingWork?.beforeEmployeeId) || _extractId(editingWork?.assignEmployees?.before?.[0]) || null
    );
    const [afterEmp, setAfterEmp] = useState(
        _extractId(editingWork?.afterEmployeeId) || _extractId(editingWork?.assignEmployees?.after?.[0]) || null
    );
    const [status, setStatus] = useState(editingWork?.status || "pending");
    const [workItems, setWorkItems] = useState(editingWork?.before || []);
    const [afterWorkItems, setAfterWorkItems] = useState(editingWork?.after || []);
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [beforePickerVisible, setBeforePickerVisible] = useState(false);
    const [afterPickerVisible, setAfterPickerVisible] = useState(false);

    // Interactive Map Selector State
    const [mapModalVisible, setMapModalVisible] = useState(false);
    const [activeMapTarget, setActiveMapTarget] = useState(null);

    useEffect(() => {
        (async () => {
            const gallery = await ImagePicker.requestMediaLibraryPermissionsAsync();
            const camera = await ImagePicker.requestCameraPermissionsAsync();
            console.log("Permissions - Gallery:", gallery.status, "Camera:", camera.status);
        })();
    }, []);

    useEffect(() => {
        fetchEmployees();
        fetchBetas();
    }, []);

    const fetchBetas = async () => {
        try {
            const res = await getBetas();
            if (res && res.success && Array.isArray(res.betas)) {
                setBetasList(res.betas);
            }
        } catch (e) {
            console.error("Error fetching betas", e);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await getEmployees();
            const allEmps = res.employees || [];
            if (Array.isArray(allEmps)) {
                setEmployees(allEmps);
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

    const prefillAfterFromBefore = () => {
        setAfterWorkItems((prev) => {
            return workItems.map((bItem, i) => {
                if (prev[i]) return prev[i];
                return {
                    workTitle: bItem.workTitle || "",
                    heightFeet: bItem.heightFeet?.toString() || "",
                    widthFeet: bItem.widthFeet?.toString() || "",
                    totalSqFt: bItem.totalSqFt?.toString() || "0.00",
                    location: bItem.location || "",
                    latitude: bItem.latitude || null,
                    longitude: bItem.longitude || null,
                    image: null,
                    localImage: null
                };
            });
        });
    };

    useEffect(() => {
        if (status === "completed" && afterWorkItems.length !== workItems.length) {
            prefillAfterFromBefore();
        }
    }, [status, workItems.length]);

    const handleStatusChange = (newStatus) => {
        setStatus(newStatus);
        if (newStatus === "completed" && afterWorkItems.length === 0 && workItems.length > 0) {
            prefillAfterFromBefore();
        }
    };

    // ✅ FIX 2: Fixed processImageSelection with consistent mediaTypes
    const processImageSelection = async (type, index) => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert(
                    "Permission Required",
                    "Gallery access is needed to upload photos.",
                    [
                        { text: "Cancel", style: "cancel" },
                        { text: "Open Settings", onPress: () => Linking.openSettings() }
                    ]
                );
                return;
            }

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [3, 4], // ✅ Aligned with UI aspectRatio
                quality: 0.7,   // ✅ Compressed for faster upload ("No full image upload")
            });

            if (!result.canceled && result.assets?.length > 0) {
                updateItem(type, index, "localImage", result.assets[0]);
            }
        } catch (e) {
            console.error("Gallery error:", e);
            Alert.alert("Error", `Image picker failed: ${e.message}`);
        }
    };

    // ✅ NEW: Camera Support - Fixed for stability
    const captureFromCamera = async (type, index) => {
        try {
            // 1. Ensure permissions are solid
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Required", "Camera access is needed.");
                return;
            }

            // 2. CRITICAL: Add a small delay to allow the Alert dialog to fully close 
            // This prevents crashes on many Android/iOS devices when opening hardware camera
            await new Promise(resolve => setTimeout(resolve, 600));

            let result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true, // Keep crafting as requested
                aspect: [3, 4],
                quality: 0.6, // Slightly lower to prevent memory crashes
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                console.log("Camera result captured:", result.assets[0].uri);
                updateItem(type, index, "localImage", result.assets[0]);
            }
        } catch (e) {
            console.error("Camera error:", e);
            Alert.alert("Camera Error", `App might have crashed or camera failed. Try again.`);
        }
    };

    const pickItemImage = (type, index) => {
        Alert.alert(
            "Upload Photo",
            "Choose a source for your photo",
            [
                {
                    text: "Take Photo (Camera)",
                    onPress: () => captureFromCamera(type, index)
                },
                {
                    text: "Choose from Gallery",
                    onPress: () => processImageSelection(type, index)
                },
                {
                    text: "Cancel",
                    style: "cancel"
                }
            ]
        );
    };

    const handleGetLocation = async (type, index) => {
        console.log("Auto Locate Button Pressed (v2 Optimized)");

        try {
            setLocationLoading(true);

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission Required", "Please allow location access to use this feature.");
                setLocationLoading(false);
                return;
            }

            if (Platform.OS === "android") {
                try {
                    await Location.enableNetworkProviderAsync();
                } catch (e) {
                    console.warn(e);
                }
            }

            const lastKnown = await Location.getLastKnownPositionAsync({});
            if (lastKnown) {
                console.log("Fast Snap (LastKnown) applied");
                await processLocation(lastKnown, type, index, true);
            }

            const locationPromise = new Promise(async (resolve, reject) => {
                let bestLoc = null;
                let subscription = null;

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
                await processLocation(refinedLoc, type, index, false);
            } else if (!lastKnown) {
                throw new Error("Could not acquire location.");
            } else {
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

            addressText += `\nLat: ${latitude.toFixed(7)}, Lng: ${longitude.toFixed(7)}`;

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
        if (type === "before") {
            setWorkItems(prev => [...prev, newItem]);
        } else {
            setAfterWorkItems(prev => {
                const cloneIndex = prev.length;
                const beforeMatch = workItems[cloneIndex];

                if (beforeMatch) {
                    return [...prev, {
                        workTitle: beforeMatch.workTitle || "",
                        heightFeet: beforeMatch.heightFeet?.toString() || "",
                        widthFeet: beforeMatch.widthFeet?.toString() || "",
                        totalSqFt: beforeMatch.totalSqFt?.toString() || "0.00",
                        location: beforeMatch.location || "",
                        latitude: beforeMatch.latitude || null,
                        longitude: beforeMatch.longitude || null,
                        image: null,
                        localImage: null
                    }];
                } else {
                    return [...prev, newItem];
                }
            });
        }
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
        if (type === "before") setWorkItems(updater);
        else setAfterWorkItems(updater);
    };

    const removeItem = (type, index) => {
        if (type === "before") {
            setWorkItems((prev) => {
                const list = [...prev];
                list.splice(index, 1);
                return list;
            });
        } else {
            setAfterWorkItems((prev) => {
                const list = [...prev];
                list.splice(index, 1);
                return list;
            });
        }
    };

    // ✅ Standardized URI handling - Keep file:// as it is usually required for FormData
    const getUploadUri = (uri) => {
        if (!uri) return null;
        // Most modern Expo/RN versions work better with the full URI including file://
        return uri;
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const formData = new FormData();

            if (editingWork) {
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
                        formData.append(`beforeImages`, {
                            uri: getUploadUri(localUri), // ✅ Normalized URI
                            name: filename,
                            type
                        });
                    } else if (item.image) {
                        formData.append(`before[${i}][image]`, item.image);
                    }
                });

                afterWorkItems.forEach((item, i) => {
                    const beforeMatch = workItems[i] || {};
                    formData.append(`after[${i}][workTitle]`, beforeMatch.workTitle || item.workTitle || "");
                    formData.append(`after[${i}][heightFeet]`, beforeMatch.heightFeet || item.heightFeet || 0);
                    formData.append(`after[${i}][widthFeet]`, beforeMatch.widthFeet || item.widthFeet || 0);
                    formData.append(`after[${i}][totalSqFt]`, beforeMatch.totalSqFt || item.totalSqFt || 0);
                    formData.append(`after[${i}][location]`, beforeMatch.location || item.location || "");

                    const latitude = beforeMatch.latitude || item.latitude;
                    const longitude = beforeMatch.longitude || item.longitude;
                    if (latitude) formData.append(`after[${i}][latitude]`, latitude);
                    if (longitude) formData.append(`after[${i}][longitude]`, longitude);

                    if (item.localImage) {
                        const localUri = item.localImage.uri;
                        const filename = localUri.split('/').pop();
                        const match = /\.(\w+)$/.exec(filename);
                        const type = match ? `image/${match[1]}` : `image/jpeg`;
                        formData.append(`afterImages`, {
                            uri: getUploadUri(localUri), // ✅ Normalized URI
                            name: filename,
                            type
                        });
                    } else if (item.image) {
                        formData.append(`after[${i}][image]`, item.image);
                    }
                });

                await updateWork(formData);

            } else {
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

                const beforeData = workItems.map(item => ({
                    workTitle: item.workTitle,
                    heightFeet: item.heightFeet,
                    widthFeet: item.widthFeet,
                    totalSqFt: item.totalSqFt,
                    location: item.location,
                    latitude: item.latitude,
                    longitude: item.longitude
                }));

                const afterData = afterWorkItems.map((item, i) => {
                    const beforeMatch = workItems[i] || {};
                    return {
                        workTitle: beforeMatch.workTitle || item.workTitle,
                        heightFeet: beforeMatch.heightFeet || item.heightFeet,
                        widthFeet: beforeMatch.widthFeet || item.widthFeet,
                        totalSqFt: beforeMatch.totalSqFt || item.totalSqFt,
                        location: beforeMatch.location || item.location,
                        latitude: beforeMatch.latitude || item.latitude,
                        longitude: beforeMatch.longitude || item.longitude
                    };
                });

                formData.append("beforeData", JSON.stringify(beforeData));
                formData.append("afterData", JSON.stringify(afterData));

                workItems.forEach((item) => {
                    if (item.localImage) {
                        const localUri = item.localImage.uri;
                        const filename = localUri.split('/').pop();
                        const match = /\.(\w+)$/.exec(filename);
                        const type = match ? `image/${match[1]}` : `image/jpeg`;
                        formData.append("beforeImages", {
                            uri: getUploadUri(localUri), // ✅ Normalized URI
                            name: filename,
                            type
                        });
                    }
                });

                afterWorkItems.forEach((item) => {
                    if (item.localImage) {
                        const localUri = item.localImage.uri;
                        const filename = localUri.split('/').pop();
                        const match = /\.(\w+)$/.exec(filename);
                        const type = match ? `image/${match[1]}` : `image/jpeg`;
                        formData.append("afterImages", {
                            uri: getUploadUri(localUri), // ✅ Normalized URI
                            name: filename,
                            type
                        });
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

        const getOptimizedSource = (uri) => {
            if (typeof uri === 'string' && uri.includes('cloudinary.com') && !uri.includes('w_')) {
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
                                <ImageIcon size={24} color="#475569" style={{ marginBottom: 8 }} />
                                <Text style={styles.placeholderText}>UPLOAD PHOTO</Text>
                            </TouchableOpacity>
                        )}
                    </View>

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

    const renderAfterItemCard = (item, index) => {
        const displayImage = item.localImage?.uri || getImageUrl(item.image);

        const getOptimizedSource = (uri) => {
            if (typeof uri === 'string' && uri.includes('cloudinary.com') && !uri.includes('w_')) {
                return uri.replace('/upload/', '/upload/w_400,c_fit,q_auto,f_auto/');
            }
            return uri;
        };

        const optimizedImage = getOptimizedSource(displayImage);
        const beforeMatch = workItems[index] || {};

        return (
            <Animated.View
                key={index}
                entering={FadeInDown.delay(index * 100).springify()}
                style={styles.card}
            >
                <View style={styles.cardContent}>
                    <View style={styles.imageColumn}>
                        {displayImage ? (
                            <Image
                                source={{ uri: optimizedImage }}
                                style={styles.itemPreview}
                                resizeMode="cover"
                            />
                        ) : (
                            <TouchableOpacity
                                style={[styles.placeholderBox, { borderColor: '#fbbf24' }]}
                                onPress={() => pickItemImage("after", index)}
                            >
                                <ImageIcon size={24} color="#fbbf24" style={{ marginBottom: 8 }} />
                                <Text style={[styles.placeholderText, { color: '#fbbf24' }]}>UPLOAD AFTER PHOTO</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.inputColumn}>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.inputLabel}>SHOP NAME</Text>
                            <View style={styles.readonlyField}>
                                <Text style={styles.readonlyText}>{beforeMatch.workTitle || item.workTitle || '—'}</Text>
                                <Text style={styles.lockIcon}>🔒</Text>
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.inputLabel}>HEIGHT (FT)</Text>
                                <View style={styles.readonlyField}>
                                    <Text style={styles.readonlyText}>{beforeMatch.heightFeet?.toString() || item.heightFeet?.toString() || '0'}</Text>
                                    <Text style={styles.lockIcon}>🔒</Text>
                                </View>
                            </View>
                            <View style={[styles.fieldGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>WIDTH (FT)</Text>
                                <View style={styles.readonlyField}>
                                    <Text style={styles.readonlyText}>{beforeMatch.widthFeet?.toString() || item.widthFeet?.toString() || '0'}</Text>
                                    <Text style={styles.lockIcon}>🔒</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.inputLabel}>AREA (SQFT)</Text>
                            <View style={styles.areaBox}>
                                <Text style={styles.areaValue}>
                                    {beforeMatch.totalSqFt || item.totalSqFt || '0.00'} <Text style={styles.areaUnit}>sq.ft</Text>
                                </Text>
                            </View>
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.inputLabel}>SITE ADDRESS</Text>
                            <View style={styles.addressContainer}>
                                <View style={[styles.readonlyField, { minHeight: 80, alignItems: 'flex-start', flex: 1 }]}>
                                    <Text style={[styles.readonlyText, { flex: 1 }]}>{beforeMatch.location || item.location || '—'}</Text>
                                    <Text style={styles.lockIcon}>🔒</Text>
                                </View>
                                {(() => {
                                    const lat = item.latitude || workItems[index]?.latitude;
                                    const lng = item.longitude || workItems[index]?.longitude;
                                    if (lat && lng) {
                                        return (
                                            <TouchableOpacity
                                                style={styles.mapBtn}
                                                onPress={() => handleOpenMapPicker("after", index)}
                                            >
                                                <MapPreview
                                                    latitude={lat}
                                                    longitude={lng}
                                                    onPress={() => handleOpenMapPicker("after", index)}
                                                    isLoading={false}
                                                    readOnly={true}
                                                />
                                            </TouchableOpacity>
                                        );
                                    }
                                    return null;
                                })()}
                            </View>

                            <View style={styles.itemActions}>
                                <TouchableOpacity
                                    style={[styles.outlineBtn, { borderColor: '#fbbf24' }]}
                                    onPress={() => pickItemImage("after", index)}
                                >
                                    <Text style={[styles.outlineBtnText, { color: '#fbbf24' }]}>
                                        {displayImage ? 'REPLACE IMAGE' : 'SELECT IMAGE'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
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
                <View style={[styles.section, { zIndex: 60 }]}>
                    <Text style={styles.sectionHeading}>REGISTRATION INFO</Text>
                    <View style={[styles.row, { zIndex: 60 }]}>
                        <View style={[styles.fieldGroup, { flex: 1, marginRight: 10, position: 'relative', zIndex: 60 }]}>
                            <Text style={styles.inputLabel}>BETA TAG</Text>
                            <View style={styles.dropdownContainer}>
                                <View style={[styles.dropdownTrigger, betaPickerVisible && styles.dropdownTriggerActive, { paddingVertical: 0 }]}>
                                    <TextInput
                                        style={[styles.dropdownValue, { flex: 1, paddingVertical: 12 }]}
                                        placeholder="Select or Type Beta"
                                        placeholderTextColor="#94a3b8"
                                        value={beta}
                                        onChangeText={setBeta}
                                        onFocus={() => {
                                            setBetaPickerVisible(true);
                                            setBeforePickerVisible(false);
                                            setAfterPickerVisible(false);
                                        }}
                                    />
                                    <TouchableOpacity
                                        style={{ padding: 10 }}
                                        onPress={() => {
                                            setBetaPickerVisible(!betaPickerVisible);
                                            setBeforePickerVisible(false);
                                            setAfterPickerVisible(false);
                                        }}
                                    >
                                        <ChevronDown size={18} color={betaPickerVisible ? "#0ea5e9" : "#64748b"} />
                                    </TouchableOpacity>
                                </View>

                                {betaPickerVisible && (
                                    <Animated.View entering={FadeInDown.duration(200)} style={styles.dropdownMenu}>
                                        <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                                            {betasList.map(b => (
                                                <TouchableOpacity
                                                    key={b._id}
                                                    style={[styles.dropdownItem, beta === b.betaname && styles.dropdownItemActive]}
                                                    onPress={() => {
                                                        setBeta(b.betaname);
                                                        setBetaPickerVisible(false);
                                                    }}
                                                >
                                                    <Text style={[styles.dropdownItemText, beta === b.betaname && styles.dropdownItemTextActive]}>
                                                        {b.betaname}
                                                    </Text>
                                                    {beta === b.betaname && <Check size={16} color="#0ea5e9" />}
                                                </TouchableOpacity>
                                            ))}
                                            {betasList.length === 0 && (
                                                <View style={styles.dropdownItem}>
                                                    <Text style={styles.dropdownItemText}>No presets available</Text>
                                                </View>
                                            )}
                                        </ScrollView>
                                    </Animated.View>
                                )}
                            </View>
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
                                setBetaPickerVisible(false);
                            }}
                        >
                            <Text style={[styles.dropdownValue, !selectedEmp && { color: '#94a3b8' }]}>
                                {employees.find(e => e._id === selectedEmp)?.name || "Select Employee"}
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
                                setBetaPickerVisible(false);
                            }}
                        >
                            <Text style={[styles.dropdownValue, !afterEmp && { color: '#94a3b8' }]}>
                                {employees.find(e => e._id === afterEmp)?.name || "Select Partner"}
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

                {/* Status Switcher */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeading}>CURRENT WORK STATUS</Text>
                    <View style={styles.tabContainer}>
                        {["pending", "completed"].map(s => (
                            <TouchableOpacity
                                key={s}
                                style={[styles.tab, status === s && styles.tabActive]}
                                onPress={() => handleStatusChange(s)}
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
                        </View>

                        <View style={styles.prefillBanner}>
                            <Text style={styles.prefillBannerText}>
                                Details pre-filled from Before Work data. Upload the after-work photo for each item.
                            </Text>
                        </View>

                        {afterWorkItems.map((item, index) => renderAfterItemCard(item, index))}
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
                initialLocation={activeMapTarget ? {
                    ...workItems[activeMapTarget.index],
                    ...(activeMapTarget.type === 'after' ? afterWorkItems[activeMapTarget.index] : {}),
                    latitude: activeMapTarget.type === 'after'
                        ? (afterWorkItems[activeMapTarget.index]?.latitude || workItems[activeMapTarget.index]?.latitude)
                        : workItems[activeMapTarget.index]?.latitude,
                    longitude: activeMapTarget.type === 'after'
                        ? (afterWorkItems[activeMapTarget.index]?.longitude || workItems[activeMapTarget.index]?.longitude)
                        : workItems[activeMapTarget.index]?.longitude,
                    location: activeMapTarget.type === 'after'
                        ? (afterWorkItems[activeMapTarget.index]?.location || workItems[activeMapTarget.index]?.location)
                        : workItems[activeMapTarget.index]?.location
                } : null}
                readOnly={activeMapTarget?.type === 'after'}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    header: {
        backgroundColor: "#ffffff",
        paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 10,
        paddingBottom: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    headerTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 15,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f1f5f9",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "900",
        color: "#0f172a",
        flex: 1,
        textAlign: "center",
        marginRight: 40,
        letterSpacing: -0.5,
    },
    progressTrack: {
        height: 4,
        backgroundColor: '#f1f5f9',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#3b82f6',
        borderRadius: 2,
    },
    scroll: {
        padding: 16,
    },
    section: {
        marginBottom: 25,
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
        letterSpacing: 2,
        textTransform: "uppercase",
    },
    subLabel: {
        fontSize: 11,
        fontWeight: "800",
        color: "#94a3b8",
        marginBottom: 8,
        letterSpacing: 0.5,
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
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: "#0f172a",
        fontWeight: "500",
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
        color: "#0284c7",
    },
    dropdownContainer: {
        position: 'relative',
        zIndex: 50,
    },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    dropdownTriggerActive: {
        borderColor: "#3b82f6",
        backgroundColor: "#fff",
    },
    dropdownValue: {
        fontSize: 14,
        color: "#0f172a",
        fontWeight: "600",
    },
    dropdownMenu: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: "#ffffff",
        borderRadius: 12,
        marginTop: 5,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        overflow: 'hidden',
        zIndex: 1000,
        ...Platform.select({
            ios: {
                shadowColor: "#0f172a",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 15,
            },
            android: {
                elevation: 10,
            },
        }),
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
        padding: 5,
        borderRadius: 14,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 10,
    },
    tabActive: {
        backgroundColor: "#ffffff",
        ...Platform.select({
            ios: {
                shadowColor: "#0f172a",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    tabText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#64748b",
        letterSpacing: 0.5,
    },
    tabTextActive: {
        color: "#0f172a",
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#f1f5f9",
        ...Platform.select({
            ios: {
                shadowColor: "#0f172a",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.05,
                shadowRadius: 12,
            },
            android: {
                elevation: 4,
            },
        }),
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
        backgroundColor: "#eff6ff",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: "#dbeafe",
    },
    areaValue: {
        fontSize: 16,
        fontWeight: "900",
        color: "#1e40af",
    },
    areaUnit: {
        fontSize: 12,
        fontWeight: "600",
        color: "#3b82f6",
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
        backgroundColor: "#0f172a", // Deep Slate for Professional Look
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 14,
        minWidth: 170,
        alignItems: "center",
        ...Platform.select({
            ios: {
                shadowColor: "#0f172a",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    primaryBtnText: {
        color: "#fff",
        fontWeight: "900",
        fontSize: 14,
        letterSpacing: 0.5,
        textTransform: "uppercase",
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
    readonlyField: {
        backgroundColor: "#f8fafc",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 48,
    },
    readonlyText: {
        fontSize: 14,
        color: "#64748b",
        fontWeight: '500',
    },
    lockIcon: {
        fontSize: 12,
    },
    prefillBanner: {
        backgroundColor: '#fef3c7',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#fbbf24',
    },
    prefillBannerText: {
        color: '#b45309',
        fontSize: 12,
        fontWeight: '600',
    },
});
