import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";

import { SafeAreaView } from "react-native-safe-area-context";

import Svg, {
  Polygon,
  Line,
  LinearGradient,
  Stop,
  Defs,
  Circle,
} from "react-native-svg";

import { auth } from "../../firebase/config";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError("Preencha todos os campos.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);

      setError("");

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      await updateProfile(userCredential.user, {
        displayName: name,
      });

      // desloga automaticamente
      await signOut(auth);

      Alert.alert("Sucesso", "Cadastro feito com sucesso!", [
        {
          text: "OK",
          onPress: () => navigation.navigate("Login"),
        },
      ]);
    } catch (error) {
      setError("Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#050816" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Background Stars */}
          <View style={styles.stars}>
            <Circle cx="20" cy="40" r="1.5" fill="#fff" />
          </View>

          {/* Logo */}
          <View style={styles.logoWrap}>
            <Svg width={80} height={80} viewBox="0 0 60 60">
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

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Criar Conta</Text>

            <Text style={styles.subtitle}>
              Faça parte da central de monitoramento orbital
            </Text>
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Inputs */}
          <TextInput
            placeholder="Nome completo"
            placeholderTextColor="#7E8CA0"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />

          <TextInput
            placeholder="Email"
            placeholderTextColor="#7E8CA0"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            placeholder="Senha"
            placeholderTextColor="#7E8CA0"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <TextInput
            placeholder="Confirmar senha"
            placeholderTextColor="#7E8CA0"
            secureTextEntry
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          {/* Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>
              {loading ? "Criando conta..." : "Registrar"}
            </Text>
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>
              Já possui conta? <Text style={styles.linkBlue}>Fazer login</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#050816",
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 40,
  },

  stars: {
    position: "absolute",
  },

  logoWrap: {
    alignItems: "center",
    marginBottom: 40,
  },

  logoTitle: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 5,
    marginTop: 14,
  },

  logoSub: {
    color: "#7E8CA0",
    fontSize: 12,
    letterSpacing: 3,
    marginTop: 4,
    textTransform: "uppercase",
  },

  header: {
    alignItems: "center",
    marginBottom: 28,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },

  subtitle: {
    color: "#7E8CA0",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  errorBox: {
    backgroundColor: "rgba(255,90,90,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,90,90,0.35)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 18,
  },

  errorText: {
    color: "#FF5A5A",
    fontSize: 13,
    textAlign: "center",
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    color: "#FFFFFF",
    fontSize: 15,
  },

  button: {
    backgroundColor: "#1E6BFF",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#1E6BFF",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 1,
  },

  link: {
    marginTop: 28,
    textAlign: "center",
    color: "#7E8CA0",
    fontSize: 14,
  },

  linkBlue: {
    color: "#00D4FF",
    fontWeight: "700",
  },
});
