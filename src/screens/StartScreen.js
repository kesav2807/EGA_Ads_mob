import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, StatusBar, ImageBackground } from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

export default function StartScreen({ navigation }) {

    const goToLogin = () => {
        navigation.navigate('Login');
    };

    // Subtle pulsing animation for the glow effect
    const glowOpacity = useSharedValue(0.5);

    useEffect(() => {
        glowOpacity.value = withRepeat(
            withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const glowStyle = useAnimatedStyle(() => {
        return {
            opacity: glowOpacity.value,
        };
    });

    return (
        <ImageBackground
            source={{ uri: 'https://res.cloudinary.com/dybqmcgdz/image/upload/v1771652669/efa37da5-03c6-4f28-9a2f-45d071cf49bd.png' }}
            style={styles.container}
            resizeMode="cover"
        >
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* LIGHTER OVERLAY FOR VIBRANT VIEW */}
            <View style={styles.overlay} />

            <View style={styles.content}>
                {/* Text Content - Positioned Lower */}
                <Animated.View entering={FadeInDown.delay(300).duration(800).springify()} style={styles.textContainer}>
                    <Text style={styles.brandText}>EGA ADS</Text>
                    <Text style={styles.subtitle}>
                        Premium Ads Management
                    </Text>
                </Animated.View>

                {/* Action Button */}
                <Animated.View entering={FadeInDown.delay(500).duration(800).springify()} style={styles.buttonWrapper}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={goToLogin}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#3b82f6', '#8b5cf6']} // Blue to Purple Gradient
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.buttonText}>Get Started</Text>
                            <ArrowRight color="#fff" size={22} strokeWidth={2.5} style={{ marginLeft: 8 }} />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Footer Decoration */}
            <View style={styles.footer}>
                <Text style={styles.versionText}>Protected by EGA ADS Security Systems</Text>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primary,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    content: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: SIZES.scale(24),
        paddingBottom: SIZES.scale(100),
        zIndex: 10,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: SIZES.scale(40),
    },
    brandText: {
        fontSize: SIZES.scale(48),
        fontWeight: '900',
        color: COLORS.white,
        marginBottom: SIZES.scale(10),
        letterSpacing: -2,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    subtitle: {
        fontSize: SIZES.scale(16),
        color: COLORS.white,
        fontWeight: '800',
        letterSpacing: 2,
        textTransform: 'uppercase',
        opacity: 0.9,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 5,
    },
    buttonWrapper: {
        width: '100%',
    },
    button: {
        borderRadius: SIZES.scale(20),
        overflow: 'hidden',
        ...SHADOWS.premium,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SIZES.scale(22),
    },
    buttonText: {
        color: COLORS.white,
        fontSize: SIZES.scale(18),
        fontWeight: '900',
        letterSpacing: 1,
    },
    footer: {
        marginTop: 'auto',
        alignItems: 'center',
        paddingBottom: SIZES.scale(40),
    },
    versionText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: SIZES.scale(11),
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    }
});
