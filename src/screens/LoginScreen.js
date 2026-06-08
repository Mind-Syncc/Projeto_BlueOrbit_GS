import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import { Ionicons } from "@expo/vector-icons";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import Svg, {
  Polygon,
  Line,
  LinearGradient,
  Stop,
  Defs,
} from "react-native-svg";

import { Input, Button } from "../components/UI";
import { colors } from "../styles/theme";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Preencha email e senha.");

      return;
    }

    try {
      setLoading(true);

      setError("");

      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError("Email ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoWrap}>
            <Svg width={60} height={60} viewBox="0 0 60 60">
              <Defs>
                <LinearGradient id="logoGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#00D4FF" />

                  <Stop offset="100%" stopColor="#1E6BFF" />
                </LinearGradient>
              </Defs>

              <Polygon
                points="30,4 54,50 6,50"
                fill="none"
                stroke="url(#logoGrad)"
                strokeWidth="2.5"
              />

              <Polygon
                points="30,16 46,46 14,46"
                fill="rgba(30,107,255,0.15)"
                stroke="rgba(0,212,255,0.5)"
                strokeWidth="1"
              />

              <Line
                x1="30"
                y1="4"
                x2="30"
                y2="28"
                stroke="url(#logoGrad)"
                strokeWidth="2.5"
              />
            </Svg>

            <Text style={styles.logoTitle}>BlueOrbit</Text>

            <Text style={styles.logoSub}>Space Safety Intelligence</Text>
          </View>

          <View style={styles.formHeader}>
            <Text style={styles.welcome}>Bem-vindo(a)</Text>

            <Text style={styles.loginSub}>Faça login para acessar</Text>
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChangeText={setEmail}
            placeholder="usuario@gmail.com"
          />

          <Input
            label="Senha"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••••"
            secureTextEntry={!showPass}
            extra={
              <TouchableOpacity
                onPress={() => setShowPass(!showPass)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPass ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            }
          />

          <TouchableOpacity style={styles.forgotWrap}>
            <Text style={styles.forgotText}>Esqueceu sua senha?</Text>
          </TouchableOpacity>

          <Button
            title={loading ? "Entrando..." : "Entrar"}
            onPress={handleLogin}
            disabled={loading}
            style={{ marginTop: 8 }}
          />

          <View style={styles.signupRow}>
            <Text style={styles.signupLabel}>Não tem uma conta? </Text>

            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.signupLink}>Criar conta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
    marginTop: -15,
  },

  logoWrap: {
    alignItems: "center",
    marginBottom: 40,
  },

  logoTitle: {
    fontFamily: "Orbitron_800ExtraBold",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 5,
    color: colors.textPrimary,
    marginTop: 12,
  },

  logoSub: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: 3,
    marginTop: 4,
  },

  formHeader: {
    alignItems: "center",
    marginBottom: 28,
  },

  welcome: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 22,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },

  loginSub: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },

  errorBox: {
    backgroundColor: colors.criticalBg,
    borderWidth: 1,
    borderColor: colors.critical,
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
  },

  errorText: {
    color: colors.critical,
    fontSize: 13,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },

  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  forgotWrap: {
    alignSelf: "flex-end",
    marginTop: -8,
    marginBottom: 24,
  },

  forgotText: {
    color: colors.accentBlue,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },

  signupLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },

  signupLink: {
    fontSize: 13,
    color: colors.accentBlue,
    fontFamily: "Inter_400Regular",
  },
});

export default LoginScreen;
