import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle } from "react-native-svg";
import { colors } from "../styles/theme";

const SYSTEM_PROMPT = `Você é BlueOrbit, uma IA especializada em monitoramento de segurança orbital e análise de objetos espaciais. Você responde sempre em Português do Brasil de forma técnica mas clara.

Você tem acesso a dados de satélites e debris orbitais. Quando o usuário perguntar sobre um objeto específico, use os dados fornecidos no contexto.

Você pode:
- Analisar riscos de colisão entre objetos espaciais
- Explicar dados orbitais (TLE, inclinação, altitude, excentricidade, RAAN)
- Sugerir manobras de desvio e janelas de manobra
- Explicar constelações de satélites (Starlink, OneWeb, GPS, Galileo, etc)
- Discutir debris orbitais e o problema de lixo espacial
- Explicar leis espaciais internacionais (OST, Regulamento CQ da ITU)
- Calcular probabilidades de conjunção

Seja conciso mas preciso. Use termos técnicos quando necessário, mas explique-os. Nunca invente dados — se não souber algo, diga que precisa de mais dados do sistema.`;

const QUICK_ACTIONS = [
  "Qual o risco dessa órbita?",
  "Sugerir manobra de desvio",
  "Explicar os dados orbitais",
  "Histórico de incidentes similares",
];

const sendToAI = async (messages) => {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer SEU_GROQ_API_KEY",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1000,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.log("Erro Groq:", JSON.stringify(err));
    throw new Error(err.error?.message || "Erro na API");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Sem resposta";
};

const AIChatScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const sat = route?.params?.object;
  const initialAnalysis = route?.params?.initialAnalysis;

  const [messages, setMessages] = useState(() => {
    const initial = [];
    if (initialAnalysis) {
      initial.push({
        id: "ai-0",
        role: "assistant",
        content: `Olá! Sou a BlueOrbit, sua IA de segurança orbital.\n\nAnalisei o objeto **${sat?.name}** e identifiquei as seguintes informações:\n\n• Risco de colisão: **${sat?.collisionRisk?.toFixed(1)}%**\n• Sugestão: **${initialAnalysis.suggestion}** ${initialAnalysis.detail}\n• Redução de risco estimada: **${initialAnalysis.riskReduction}%**\n• Confiança: **${initialAnalysis.confidence}%**\n\nComo posso ajudar você?`,
        timestamp: new Date(),
      });
    } else {
      initial.push({
        id: "ai-0",
        role: "assistant",
        content: sat
          ? `Olá! Sou a BlueOrbit, sua IA de segurança orbital.\n\nEstou analisando o objeto **${sat.name}** (NORAD ${sat.noradId}) em altitude de ${sat.altitude}.\n\nComo posso ajudar você?`
          : `Olá! Sou a BlueOrbit, sua IA de monitoramento orbital. Faça-me perguntas sobre satélites, debris, riscos orbitais ou análise de trajetórias.`,
        timestamp: new Date(),
      });
    }
    return initial;
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const send = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");

    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
      timestamp: new Date(),
    };

    // Captura o estado atual sincronamente antes do setState
    const currentMessages = messages;
    const updatedMessages = [...currentMessages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Monta histórico apenas com mensagens user/assistant (excluindo a saudação inicial do assistente)
      // e garante que começa com uma mensagem do tipo 'user'
      const apiHistory = updatedMessages
        .filter((m) => !(m.id === "ai-0" && m.role === "assistant")) // remove greeting
        .map((m) => ({ role: m.role, content: m.content }));

      // Adiciona contexto do satélite apenas na primeira mensagem do user
      const firstUserIdx = apiHistory.findIndex((m) => m.role === "user");
      if (firstUserIdx !== -1 && sat) {
        apiHistory[firstUserIdx] = {
          ...apiHistory[firstUserIdx],
          content: `[Contexto: analisando ${sat.name}, NORAD ${sat.noradId}, altitude ${sat.altitude}, risco ${sat.collisionRisk}%]\n\n${apiHistory[firstUserIdx].content}`,
        };
      }

      const reply = await sendToAI(apiHistory, null);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_ai",
          role: "assistant",
          content: reply,
          timestamp: new Date(),
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_err",
          role: "assistant",
          content: `⚠ Erro de conexão: ${e.message}. Tente novamente.`,
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderBold = (text) => {
    // Simple bold rendering with **text**
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return (
      <Text>
        {parts.map((part, i) =>
          i % 2 === 1 ? (
            <Text
              key={i}
              style={{
                color: colors.textPrimary,
                fontFamily: "Rajdhani_600SemiBold",
              }}
            >
              {part}
            </Text>
          ) : (
            <Text key={i}>{part}</Text>
          ),
        )}
      </Text>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 12H5M12 5l-7 7 7 7"
                stroke={colors.textSecondary}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </Svg>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.aiAvatar}>
              <Text style={styles.aiAvatarText}>AI</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>BlueOrbit IA</Text>
              <View style={styles.onlineDot}>
                <View style={styles.onlineDotInner} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            </View>
          </View>
          {sat && (
            <View style={styles.satTag}>
              <Text style={styles.satTagText} numberOfLines={1}>
                {sat.name}
              </Text>
            </View>
          )}
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.msgRow, msg.role === "user" && styles.msgRowUser]}
            >
              {msg.role === "assistant" && (
                <View style={styles.msgAvatar}>
                  <Text style={styles.msgAvatarText}>AI</Text>
                </View>
              )}
              <View
                style={[
                  styles.msgBubble,
                  msg.role === "user"
                    ? styles.msgBubbleUser
                    : styles.msgBubbleAI,
                  msg.isError && {
                    borderColor: colors.critical + "50",
                    backgroundColor: colors.criticalBg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.msgText,
                    msg.role === "user" && styles.msgTextUser,
                  ]}
                >
                  {msg.role === "assistant"
                    ? renderBold(msg.content)
                    : msg.content}
                </Text>
                <Text style={styles.msgTime}>{formatTime(msg.timestamp)}</Text>
              </View>
            </View>
          ))}

          {loading && (
            <View style={styles.msgRow}>
              <View style={styles.msgAvatar}>
                <Text style={styles.msgAvatarText}>AI</Text>
              </View>
              <View
                style={[
                  styles.msgBubble,
                  styles.msgBubbleAI,
                  styles.typingBubble,
                ]}
              >
                <View style={styles.typingDots}>
                  {[0, 1, 2].map((i) => (
                    <View
                      key={i}
                      style={[styles.typingDot, { opacity: 0.4 + i * 0.2 }]}
                    />
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick actions */}
        {messages.length <= 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickActions}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
          >
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action}
                style={styles.quickBtn}
                onPress={() => send(action)}
              >
                <Text style={styles.quickBtnText}>{action}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input */}
        <View style={[styles.inputArea, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Pergunte sobre o objeto espacial..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            editable={!loading}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!input.trim() || loading) && styles.sendBtnDisabled,
            ]}
            onPress={() => send()}
            disabled={!input.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </Svg>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSecondary,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,212,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  aiAvatarText: {
    color: colors.accentCyan,
    fontSize: 12,
    fontFamily: "Orbitron_700Bold",
    fontWeight: "700",
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: "Rajdhani_600SemiBold",
    fontWeight: "600",
  },
  onlineDot: { flexDirection: "row", alignItems: "center", gap: 4 },
  onlineDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentGreen,
  },
  onlineText: {
    fontSize: 11,
    color: colors.accentGreen,
    fontFamily: "Inter_400Regular",
  },
  satTag: {
    backgroundColor: "rgba(30,107,255,0.1)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(30,107,255,0.3)",
    maxWidth: 100,
  },
  satTagText: {
    fontSize: 10,
    color: colors.accentBlue,
    fontFamily: "Orbitron_700Bold",
    letterSpacing: 0.3,
  },

  messages: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8 },

  msgRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
    gap: 8,
  },
  msgRowUser: { flexDirection: "row-reverse" },

  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,212,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  msgAvatarText: {
    color: colors.accentCyan,
    fontSize: 9,
    fontFamily: "Orbitron_700Bold",
  },

  msgBubble: {
    maxWidth: "78%",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  msgBubbleAI: {
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  msgBubbleUser: {
    backgroundColor: "rgba(30,107,255,0.15)",
    borderColor: "rgba(30,107,255,0.3)",
    borderBottomRightRadius: 4,
  },
  msgText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  msgTextUser: { color: colors.textPrimary },
  msgTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },

  typingBubble: { paddingVertical: 14 },
  typingDots: { flexDirection: "row", gap: 5, alignItems: "center" },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.accentCyan,
  },

  quickActions: { maxHeight: 48 },
  quickBtn: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.25)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  quickBtnText: {
    fontSize: 12,
    color: colors.accentCyan,
    fontFamily: "Rajdhani_500Medium",
  },

  inputArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSecondary,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accentBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "rgba(30,107,255,0.3)" },
});

export default AIChatScreen;
