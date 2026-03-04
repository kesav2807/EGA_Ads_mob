import { Dimensions, Platform, StatusBar, PixelRatio } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Responsive Scaling Helper
const scale = (size) => (SCREEN_WIDTH / 375) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

export const COLORS = {
    // Premium Midnight & Electric Palette
    primary: "#0f172a", // Deep Slate/Midnight
    secondary: "#3b82f6", // Electric Blue
    accent: "#f43f5e", // Rose/Pink for CTA

    // UI Neutrals
    background: "#f8fafc", // Ultra Light Slate
    card: "#ffffff",
    glass: "rgba(255, 255, 255, 0.8)",

    // Text Hierarchy
    text: "#0f172a", // Midnight Sky
    textSecondary: "#475569", // Slate 600
    textLight: "#94a3b8", // Slate 400
    textDim: "#cbd5e1", // Slate 300

    // Status
    error: "#ef4444",
    success: "#10b981",
    warning: "#f59e0b",
    info: "#06b6d4",

    // Borders & Lines
    border: "#e2e8f0",
    borderLight: "#f1f5f9",

    white: "#ffffff",
    black: "#000000",
};

export const SIZES = {
    base: scale(8),
    small: scale(12),
    font: scale(14),
    medium: scale(16),
    large: scale(18),
    extraLarge: scale(24),
    xxl: scale(32),

    // Utility for universal scaling
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isSmallDevice: SCREEN_WIDTH < 375,
    isLargeDevice: SCREEN_WIDTH > 500, // For tablets
    scale: scale,
    mScale: moderateScale,
};

export const SPACING = {
    xs: scale(4),
    s: scale(8),
    m: scale(16),
    l: scale(24),
    xl: scale(32),
    pagePadding: scale(20),
    safeTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 10 : 50,
};

export const SHADOWS = {
    premium: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
    },
    glass: {
        shadowColor: "#3b82f6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    tabBar: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    }
};

export const LAYOUT = {
    borderRadius: scale(16),
    borderRadiusSmall: scale(8),
    borderRadiusLarge: scale(24),
    inputHeight: scale(54),
    buttonHeight: scale(56),
};
