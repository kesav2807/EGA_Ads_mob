import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MapPin } from 'lucide-react-native';

const MapPreview = ({ latitude, longitude, onPress, isLoading = false, readOnly = false }) => {

    // Fallback if no location
    if (!latitude || !longitude) {
        return (
            <TouchableOpacity style={styles.container} onPress={readOnly ? null : onPress} activeOpacity={readOnly ? 1 : 0.7}>
                <View style={styles.placeholder}>
                    <MapPin size={24} color="#94a3b8" />
                    <Text style={styles.placeholderText}>{readOnly ? "NO PIN" : "TAP TO SET"}</Text>
                </View>
            </TouchableOpacity>
        );
    }

    // Static Map URL
    const mapUrl = `https://staticmap.21-09.org/staticmap.php?center=${latitude},${longitude}&zoom=17&size=300x300&maptype=mapnik&markers=${latitude},${longitude},red-pushpin`;

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
            <Image
                source={{ uri: mapUrl }}
                style={styles.image}
                resizeMode="cover"
            />
            {isLoading && (
                <View style={styles.loaderOverlay}>
                    <ActivityIndicator size="small" color="#0ea5e9" />
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
    },
    placeholderText: {
        fontSize: 8,
        color: '#94a3b8',
        fontWeight: '800',
        marginTop: 4,
        textAlign: 'center',
    },
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default MapPreview;
