import * as Location from 'expo-location';
import { Alert, Platform, Linking } from 'react-native';

/**
 * Request location permissions and enable services
 */
export const requestLocationPermission = async () => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                "Permission Required",
                "Please allow location access to use this feature.",
                [
                    { text: "Open Settings", onPress: () => Linking.openSettings() },
                    { text: "Cancel", style: "cancel" }
                ]
            );
            return false;
        }

        if (Platform.OS === 'android') {
            try {
                await Location.enableNetworkProviderAsync();
            } catch (e) {
                console.warn(e);
            }
        }
        return true;
    } catch (error) {
        console.error("Permission Error:", error);
        return false;
    }
};

/**
 * Get Last Known Location (Fast Snap)
 * Returns { latitude, longitude, accuracy } or null
 */
export const getFastLocation = async () => {
    try {
        const location = await Location.getLastKnownPositionAsync({});
        return location ? location.coords : null;
    } catch (error) {
        console.log("Fast location failed:", error);
        return null;
    }
};

/**
 * Get High Accuracy Location (Refined)
 * Uses a watcher to find the 'Sweet Spot' (<20m) or timeouts after 10s.
 * Returns { latitude, longitude, accuracy }
 */
export const getRefinedLocation = async (timeout = 10000) => {
    return new Promise(async (resolve, reject) => {
        let bestLoc = null;
        let subscription = null;
        let hasResolved = false;

        const timer = setTimeout(() => {
            if (hasResolved) return;
            if (subscription) subscription.remove();
            console.log("GPS Timeout - Resolving with best available");
            hasResolved = true;
            resolve(bestLoc ? bestLoc.coords : null);
        }, timeout);

        try {
            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 500,
                    distanceInterval: 0,
                },
                (loc) => {
                    if (hasResolved) return;

                    const acc = loc.coords.accuracy;
                    console.log(`GPS Pulse: ${acc}m`);

                    if (!bestLoc || acc < bestLoc.coords.accuracy) {
                        bestLoc = loc;
                    }

                    // Professional Threshold: accuracy <= 20m
                    if (acc <= 20) {
                        console.log("High Accuracy Lock Acquired!");
                        if (subscription) subscription.remove();
                        clearTimeout(timer);
                        hasResolved = true;
                        resolve(loc.coords);
                    }
                }
            );
        } catch (err) {
            clearTimeout(timer);
            console.error("Watcher Error:", err);
            // Try fallback if watcher fails
            try {
                const standardLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                resolve(standardLoc.coords);
            } catch (e) {
                reject(e);
            }
        }
    });
};

/**
 * Reverse Geocode Coordinates to Address
 * Handles deduplication of address components
 */
export const getAddressFromCoords = async (latitude, longitude) => {
    try {
        const result = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (result.length > 0) {
            const a = result[0];
            const parts = [
                a.name,
                a.street,
                a.subregion,
                a.district,
                a.city,
                a.region,
                a.postalCode
            ].filter(Boolean);

            if (parts.length > 0) {
                // Deduplicate components
                return [...new Set(parts)].join(", ");
            }
        }
    } catch (error) {
        console.log("Geocoding failed:", error);
    }
    return `${latitude}, ${longitude}`;
};

/**
 * Unified Helper (Simpler usage for generic cases)
 * Tries fast, then refined. Returns the best it gets.
 */
export const getCurrentCoords = async () => {
    // 1. Permission
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) throw new Error("Permission denied");

    // 2. Try Refined (it handles its own fallback/timeout)
    // We can't easily return 'fast' then 'refined' in a single promise function.
    // This function is for when you just want one final result.
    // For progressive updates, use getFastLocation + getRefinedLocation separately.

    // We'll skip fast here and go straight to refined because refined has a timeout fallback.
    // But for Speed, we check fast first? No, that's what the UI logic should do.

    const loc = await getRefinedLocation();
    if (!loc) throw new Error("Could not acquire location");
    return loc;
};
