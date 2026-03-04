import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Image,
  StatusBar,
  ScrollView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { adminLogin } from "../../api/authApi";
import { COLORS, SIZES, SHADOWS } from "../../constants/theme";

export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Required", "Please enter both email and password.");
    }
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return Alert.alert("Invalid Email", "Please enter a valid email address.");
    }

    setLoading(true);
    try {
      const res = await adminLogin(email, password);

      if (res.token) {
        await AsyncStorage.setItem("adminToken", res.token);
        // Store admin info if available, or at least the email as name
        const adminData = res.user || { name: "Administrator", email: email };
        await AsyncStorage.setItem("adminData", JSON.stringify(adminData));
        navigation.replace("AdminDrawer");
      } else {
        throw new Error("No token received from server.");
      }

    } catch (err) {
      console.error("Login Error:", err);
      Alert.alert("Login Failed", err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Background Shapes */}
      <View style={styles.backgroundShapeTop} />
      <View style={styles.backgroundShapeBottom} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.innerContainer}>
              {/* Header Section */}
              <Animated.View
                entering={FadeInUp.delay(200).duration(800).springify()}
                style={styles.headerContainer}
              >
                <View style={styles.logoContainer}>
                  <Image
                    source={{ uri: 'https://res.cloudinary.com/dybqmcgdz/image/upload/v1769929993/ega_ads/shops/cdh0pogtm7c4yd6ggkt6.jpg' }}
                    style={styles.logo}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to your admin dashboard</Text>
              </Animated.View>

              {/* Form Section */}
              <Animated.View
                entering={FadeInDown.delay(400).duration(800).springify()}
                style={styles.formContainer}
              >
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <Mail size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      placeholder="admin@egaads.com"
                      placeholderTextColor="#94a3b8"
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Enter your password"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry={!showPassword}
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
                        <EyeOff size={20} color="#64748b" />
                      ) : (
                        <Eye size={20} color="#64748b" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.loginBtnContainer}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#3b82f6', '#8b5cf6']} // Blue to Purple Gradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.loginBtn}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Text style={styles.btnText}>Sign In</Text>
                        <ArrowRight color="#fff" size={20} style={{ marginLeft: 8 }} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Footer moved inside flow but pushed to bottom */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Protected by EGA ADS Security Systems</Text>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  backgroundShapeTop: {
    position: 'absolute',
    top: -SIZES.scale(100),
    right: -SIZES.scale(100),
    width: SIZES.scale(300),
    height: SIZES.scale(300),
    borderRadius: SIZES.scale(150),
    backgroundColor: `${COLORS.secondary}10`,
    opacity: 0.7,
  },
  backgroundShapeBottom: {
    position: 'absolute',
    bottom: -SIZES.scale(50),
    left: -SIZES.scale(50),
    width: SIZES.scale(300),
    height: SIZES.scale(300),
    borderRadius: SIZES.scale(150),
    backgroundColor: `${COLORS.accent}10`,
    opacity: 0.7,
  },
  innerContainer: {
    flex: 1,
    justifyContent: "center",
    padding: SIZES.scale(24),
    minHeight: SIZES.height * 0.8,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: SIZES.scale(40),
  },
  logoContainer: {
    width: SIZES.scale(100),
    height: SIZES.scale(100),
    borderRadius: SIZES.scale(50),
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.scale(24),
    borderWidth: SIZES.scale(4),
    borderColor: COLORS.background,
    overflow: 'hidden',
    ...SHADOWS.premium,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: SIZES.scale(28),
    color: COLORS.primary,
    fontWeight: "900",
    marginBottom: SIZES.scale(8),
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: SIZES.scale(15),
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  formContainer: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: SIZES.scale(20),
  },
  label: {
    color: COLORS.primary,
    marginBottom: SIZES.scale(8),
    fontSize: SIZES.scale(13),
    fontWeight: "800",
    marginLeft: SIZES.scale(4),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.scale(18),
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SIZES.scale(18),
    height: SIZES.scale(58),
    ...SHADOWS.small,
  },
  inputIcon: {
    marginRight: SIZES.scale(12),
  },
  input: {
    flex: 1,
    color: COLORS.primary,
    fontSize: SIZES.scale(15),
    fontWeight: '600',
    height: '100%',
  },
  loginBtnContainer: {
    marginTop: SIZES.scale(20),
    borderRadius: SIZES.scale(30),
    overflow: 'hidden',
    ...SHADOWS.premium,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.scale(18),
  },
  btnText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: SIZES.scale(16),
    letterSpacing: 1,
  },
  footer: {
    marginTop: SIZES.scale(40),
    alignItems: 'center',
    paddingBottom: SIZES.scale(20),
  },
  footerText: {
    color: COLORS.textLight,
    fontSize: SIZES.scale(11),
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: 'uppercase',
  }
});
