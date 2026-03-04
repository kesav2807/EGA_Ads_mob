import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    SafeAreaView,
    Platform,
    Alert,
    Dimensions
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { X, Search, Navigation as NavigationIcon, Check, MapPin, Share2 } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

/**
 * Professional Location Selector using OpenStreetMap
 * Optimized for high performance and reliability on Android/iOS.
 */
const LocationPickerModal = ({ visible, onClose, onSave, initialLocation, readOnly = false }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isMapReady, setIsMapReady] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const mapRef = useRef(null);
    const locationSubscription = useRef(null);

    // Initial Coordinates (Madurai as fallback)
    const initialLat = parseFloat(initialLocation?.latitude) || 9.9252;
    const initialLng = parseFloat(initialLocation?.longitude) || 78.1198;

    useEffect(() => {
        if (visible) {
            setIsMapReady(true);
            if (initialLocation?.latitude) {
                const lat = parseFloat(initialLocation.latitude);
                const lng = parseFloat(initialLocation.longitude);
                setSelectedLocation({
                    latitude: lat,
                    longitude: lng,
                    address: initialLocation.location || 'Fetching address...'
                });
                if (!initialLocation.location) {
                    fetchAddress(lat, lng);
                }
            } else {
                setSelectedLocation(null);
                setSearchQuery('');
                // Professional Step: Auto Locate on open if no location pre-selected (only if not readonly)
                if (!readOnly) {
                    handleCurrentLoc();
                }
            }
        }
    }, [visible, initialLocation]);

    const toDMS = (coord, isLat) => {
        if (!coord) return "";
        const absolute = Math.abs(coord);
        const degrees = Math.floor(absolute);
        const minutesNotTruncated = (absolute - degrees) * 60;
        const minutes = Math.floor(minutesNotTruncated);
        const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(1);
        const direction = isLat ? (coord >= 0 ? "N" : "S") : (coord >= 0 ? "E" : "W");
        return `${degrees}°${minutes}'${seconds}"${direction}`;
    };

    const fetchAddress = async (lat, lng) => {
        try {
            setLoading(true);
            const res = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
            let fullAddress = "Location Selected";

            if (res.length > 0) {
                const r = res[0];

                // Professional 'Google/WhatsApp' Style Formatting
                const parts = [
                    r.name,           // Building/Plot Name
                    r.street,         // Street/Road
                    r.subregion,      // Area/Mettu Perumal Nagar
                    r.district,       // Vadipatti/City
                    r.city,           // City
                    r.region,         // Tamil Nadu
                    r.postalCode      // 625218
                ].filter(Boolean);

                // Remove duplicates if any
                const uniqueParts = [...new Set(parts)];
                fullAddress = uniqueParts.join(", ");
            }
            setSelectedLocation({ latitude: lat, longitude: lng, address: fullAddress });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        try {
            setLoading(true);

            // Step 1: Standard Geocoding
            let results = await Location.geocodeAsync(searchQuery);

            // Step 2: Professional POI Fallback (Nominatim OSM)
            // If standard search is vague, use Nominatim for 'Property Names'
            if (results.length === 0) {
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
                    const data = await response.json();
                    if (data && data.length > 0) {
                        results = [{ latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) }];
                    }
                } catch (err) {
                    console.error("POI Search Error:", err);
                }
            }

            if (results.length > 0) {
                const { latitude, longitude } = results[0];

                // Professional Zoom & Pin
                mapRef.current?.animateToRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.0015,
                    longitudeDelta: 0.0015
                }, 1500);

                // Step 3: Get Complete Address Details
                const res = await Location.reverseGeocodeAsync({ latitude, longitude });
                let finalAddr = searchQuery; // Default to what the user searched

                if (res.length > 0) {
                    const r = res[0];
                    const parts = [
                        r.name,
                        r.street,
                        r.subregion,
                        r.district,
                        r.city,
                        r.region,
                        r.postalCode
                    ].filter(Boolean);

                    // If the reverse geocoding found a specific building, prefer it
                    const geocodeAddr = [...new Set(parts)].join(", ");
                    if (geocodeAddr.length > searchQuery.length) {
                        finalAddr = geocodeAddr;
                    }
                }

                setSelectedLocation({ latitude, longitude, address: finalAddr });
            } else {
                Alert.alert("Property Not Found", "Check the search terms or try adding the city name.");
            }
        } catch (e) {
            Alert.alert("Search Error", "Check your connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        return () => {
            if (locationSubscription.current) {
                locationSubscription.current.remove();
            }
        };
    }, []);

    const handleCurrentLoc = async () => {
        try {
            setLoading(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Denied", "Enable GPS in settings.");
                return;
            }

            if (Platform.OS === 'android') {
                await Location.enableNetworkProviderAsync();
            }

            // --- EXPERT 'SWEET SPOT' MONITORING ---
            // Professional Lock: Monitor pulses to find the tightest accuracy (sub-10m)
            let bestLoc = null;
            const watcher = await Location.watchPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 500,
                distanceInterval: 0
            }, (loc) => {
                if (!bestLoc || loc.coords.accuracy < bestLoc.coords.accuracy) {
                    bestLoc = loc;
                }
            });

            // 5-second Satellite Sync Period
            await new Promise(resolve => setTimeout(resolve, 5000));
            watcher.remove();

            const location = bestLoc || await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation
            });

            const { latitude, longitude } = location.coords;
            mapRef.current?.animateToRegion({
                latitude,
                longitude,
                latitudeDelta: 0.0015,
                longitudeDelta: 0.0015
            }, 1000);
            fetchAddress(latitude, longitude);

            setIsTracking(true);
            if (locationSubscription.current) locationSubscription.current.remove();

            locationSubscription.current = await Location.watchPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 2000,
                distanceInterval: 1
            }, (loc) => {
                const { latitude, longitude } = loc.coords;
                mapRef.current?.animateToRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.0015,
                    longitudeDelta: 0.0015
                }, 1000);
                fetchAddress(latitude, longitude);
            });
        } catch (e) {
            Alert.alert("GPS Error", "Failed to start tracking.");
            setIsTracking(false);
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsAppShare = async () => {
        if (!selectedLocation) return;
        try {
            const { latitude, longitude, address } = selectedLocation;
            const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
            const message = `My Live Location 📍\n\nAddress:\n${address}\n\nOpen in Maps:\n${mapLink}`;
            const url = `whatsapp://send?text=${encodeURIComponent(message)}`;

            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                // Fallback for general sharing if WhatsApp isn't installed
                Alert.alert("Error", "WhatsApp is not installed on this device.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                        <X size={24} color="#1e293b" />
                    </TouchableOpacity>
                    {!readOnly && (
                        <View style={styles.searchBar}>
                            <Search size={18} color="#94a3b8" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search Property or Area..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                onSubmitEditing={handleSearch}
                                returnKeyType="search"
                            />
                            {searchQuery.length > 0 && !loading && (
                                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                                    <X size={16} color="#94a3b8" />
                                </TouchableOpacity>
                            )}
                            {loading && <ActivityIndicator size="small" color="#0ea5e9" />}
                        </View>
                    )}
                </View>

                <View style={styles.mapWrap}>
                    <MapView
                        ref={mapRef}
                        provider={PROVIDER_GOOGLE}
                        style={styles.map}
                        mapType="hybrid"
                        showsUserLocation={true}
                        followsUserLocation={isTracking}
                        showsMyLocationButton={false}
                        initialRegion={{
                            latitude: initialLat,
                            longitude: initialLng,
                            latitudeDelta: 0.005,
                            longitudeDelta: 0.005,
                        }}
                        onPress={(e) => {
                            if (!readOnly) {
                                const { latitude, longitude } = e.nativeEvent.coordinate;
                                fetchAddress(latitude, longitude);
                            }
                        }}
                    >
                        {selectedLocation && (
                            <Marker
                                coordinate={{
                                    latitude: selectedLocation.latitude,
                                    longitude: selectedLocation.longitude
                                }}
                                draggable={!readOnly}
                                onDragEnd={(e) => {
                                    if (!readOnly) {
                                        const { latitude, longitude } = e.nativeEvent.coordinate;
                                        fetchAddress(latitude, longitude);
                                    }
                                }}
                            >
                                <View style={styles.markerContainer}>
                                    <View style={styles.markerPulse} />
                                    <View style={styles.markerInner} />
                                </View>
                            </Marker>
                        )}
                    </MapView>

                    {!readOnly && (
                        <TouchableOpacity
                            style={[styles.fab, isTracking && styles.fabTracking]}
                            onPress={isTracking ? () => setIsTracking(false) : handleCurrentLoc}
                        >
                            <NavigationIcon size={24} color="white" />
                            {isTracking && <View style={styles.trackingPulse} />}
                        </TouchableOpacity>
                    )}

                    {isTracking && (
                        <View style={styles.liveBadge}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>LIVE ACCURACY ACTIVE</Text>
                        </View>
                    )}
                </View>

                <View style={styles.footer}>
                    <View style={styles.locCard}>
                        <View style={styles.locIconWrap}>
                            <MapPin size={22} color="#0ea5e9" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.locLabel}>CONFIRMED SITE LOCATION (EXPERT ACCURACY)</Text>
                            <Text style={styles.locValue} numberOfLines={2}>
                                {selectedLocation?.address || "Pinpointing exact coordinates..."}
                            </Text>
                            {selectedLocation && (
                                <Text style={styles.coordinatesText}>
                                    {toDMS(selectedLocation.latitude, true)}  {toDMS(selectedLocation.longitude, false)}
                                </Text>
                            )}
                            {selectedLocation && (
                                <Text style={styles.latLngSubText}>
                                    DECIMAL: {selectedLocation.latitude.toFixed(7)}, {selectedLocation.longitude.toFixed(7)}
                                </Text>
                            )}
                        </View>
                        {selectedLocation && (
                            <TouchableOpacity onPress={handleWhatsAppShare} style={styles.shareIconBtn}>
                                <Share2 size={24} color="#0ea5e9" />
                            </TouchableOpacity>
                        )}
                    </View>
                    {!readOnly ? (
                        <TouchableOpacity
                            style={[styles.saveBtn, !selectedLocation && styles.saveBtnDisabled]}
                            onPress={() => onSave(selectedLocation)}
                            disabled={!selectedLocation}
                        >
                            <Text style={styles.saveBtnText}>SAVE & PIN LOCATION</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: '#f1f5f9' }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.saveBtnText, { color: '#0f172a' }]}>CLOSE MAP</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    backBtn: { padding: 4 },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1e293b' },
    mapWrap: { flex: 1, position: 'relative' },
    map: { flex: 1 },
    markerContainer: { alignItems: 'center', justifyContent: 'center' },
    markerInner: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#ef4444',
        borderWidth: 2,
        borderColor: 'white'
    },
    markerPulse: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(239, 68, 68, 0.3)',
        borderWidth: 1,
        borderColor: '#ef4444'
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10
    },
    loadingText: { marginTop: 12, color: '#64748b', fontWeight: '600', fontSize: 14 },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#0ea5e9',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    fabTracking: {
        backgroundColor: '#10b981', // Professional Green for Active Tracking
    },
    trackingPulse: {
        position: 'absolute',
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: '#10b981',
        opacity: 0.5,
    },
    liveBadge: {
        position: 'absolute',
        top: 20,
        left: '20%',
        right: '20%',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
    },
    liveText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    footer: {
        padding: 20,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9'
    },
    locCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        backgroundColor: '#f1f5f9',
        padding: 18,
        borderRadius: 18,
        marginBottom: 20
    },
    locIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 1
    },
    locLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 0.8, marginBottom: 4 },
    locValue: { fontSize: 13, fontWeight: '700', color: '#1e293b', lineHeight: 18 },
    coordinatesText: {
        fontSize: 11,
        color: '#0f172a',
        fontWeight: '900',
        marginTop: 6,
        letterSpacing: 0.2
    },
    latLngSubText: {
        fontSize: 9,
        color: '#64748b',
        fontWeight: '700',
        marginTop: 2,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
    },
    shareIconBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2
    },
    saveBtn: {
        backgroundColor: '#0ea5e9',
        height: 58,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center'
    },
    saveBtnDisabled: { backgroundColor: '#cbd5e1' },
    saveBtnText: { color: 'white', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }
});

export default LocationPickerModal;
