import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle, Line } from "react-native-svg";
import { Card } from "../components/UI";
import { colors } from "../styles/theme";

const BrainIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9.5 2A2.5 2.5 0 007 4.5v.5A3 3 0 004 8c0 1.1.6 2.07 1.5 2.6V18a2 2 0 002 2h9a2 2 0 002-2v-7.4A3 3 0 0020 8a3 3 0 00-3-3v-.5A2.5 2.5 0 0014.5 2h-5z"
      stroke="#00D4FF"
      strokeWidth="1.4"
      fill="rgba(0,212,255,0.12)"
    />
    <Circle
      cx="12"
      cy="8"
      r="2"
      stroke="#00D4FF"
      strokeWidth="1.2"
      fill="rgba(0,212,255,0.2)"
    />
    <Line
      x1="12"
      y1="10"
      x2="12"
      y2="14"
      stroke="#00D4FF"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <Line
      x1="9"
      y1="13"
      x2="15"
      y2="13"
      stroke="#00D4FF"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </Svg>
);

const CheckIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17l-5-5"
      stroke={colors.accentGreen}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </Svg>
);

const generateAIAnalysis = (sat) => {
  const risk = sat.collisionRisk || 4.7;
  const name = sat.name || "Objeto";
  const alt = sat.altitude || "550 km";
  const inc = sat.inclination || "53°";

  if (risk >= 4) {
    return {
      suggestion: `Alterar órbita em ${(risk * 0.08).toFixed(1)}°`,
      detail: "para reduzir o risco de colisão.",
      riskReduction: Math.round(65 + risk * 2),
      impact: "Baixo consumo de combustível",
      confidence: Math.round(85 + Math.random() * 10),
      analysis: [
        `Objeto ${name} detectado em trajetória de risco em ${alt}.`,
        `Inclinação de ${inc} aumenta probabilidade de cruzamento com debris.`,
        `Manobra mínima de ${(risk * 0.08).toFixed(1)}° reduz risco em até ${Math.round(65 + risk * 2)}%.`,
      ],
    };
  } else if (risk >= 2.5) {
    return {
      suggestion: `Monitoramento contínuo + alerta em ${alt}`,
      detail: "aguardar janela de manobra ideal.",
      riskReduction: Math.round(40 + risk * 5),
      impact: "Sem consumo de combustível",
      confidence: Math.round(78 + Math.random() * 10),
      analysis: [
        `Objeto ${name} em zona de atenção elevada.`,
        `Risco de ${risk.toFixed(1)}% dentro do limiar de monitoramento.`,
        `Recomenda-se aumentar frequência de rastreamento.`,
      ],
    };
  } else {
    return {
      suggestion: "Manter trajetória atual",
      detail: "sem necessidade de manobra imediata.",
      riskReduction: Math.round(10 + risk * 5),
      impact: "Nenhum impacto operacional",
      confidence: Math.round(90 + Math.random() * 8),
      analysis: [
        `Objeto ${name} em trajetória estável em ${alt}.`,
        `Risco abaixo do limiar crítico (< 2%).`,
        `Manter rastreamento padrão e revisar em 24h.`,
      ],
    };
  }
};

const AIAnalysisScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const sat = route?.params?.object;
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((d) => (d % 3) + 1);
    }, 400);

    const timer = setTimeout(() => {
      clearInterval(dotInterval);
      setAnalysis(generateAIAnalysis(sat));
      setLoading(false);
    }, 2200);

    return () => {
      clearTimeout(timer);
      clearInterval(dotInterval);
    };
  }, [sat]);

  const riskColor =
    sat?.riskLevel === "critical"
      ? colors.critical
      : sat?.riskLevel === "elevated"
        ? colors.elevated
        : colors.moderate;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
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
          <Text style={styles.title}>Análise da IA</Text>
        </View>

        {/* Object reference */}
        <View style={styles.objectRef}>
          <Text style={styles.objectRefLabel}>Analisando</Text>
          <Text style={styles.objectRefName}>{sat?.name}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <View style={styles.loadingPulse}>
              <BrainIcon />
            </View>
            <Text style={styles.loadingTitle}>
              IA Processando{".".repeat(dots)}
            </Text>
            <Text style={styles.loadingDesc}>
              Calculando trajetórias e avaliando riscos orbitais...
            </Text>
            <ActivityIndicator
              color={colors.accentCyan}
              style={{ marginTop: 20 }}
            />
            <View style={styles.loadingSteps}>
              {[
                "Coletando dados TLE",
                "Simulando trajetórias",
                "Avaliando riscos",
              ].map((step, i) => (
                <View key={i} style={styles.loadingStep}>
                  <View style={styles.loadingDot} />
                  <Text style={styles.loadingStepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <>
            {/* Main suggestion card - matches design mockup */}
            <Card style={styles.suggestionCard}>
              <View style={styles.suggestionHeader}>
                <View>
                  <Text style={styles.suggestionLabel}>Sugestão de ação</Text>
                  <Text style={styles.suggestionAction}>
                    {analysis.suggestion}
                  </Text>
                  <Text style={styles.suggestionDetail}>{analysis.detail}</Text>
                </View>
                <View style={styles.brainIconBox}>
                  <BrainIcon />
                </View>
              </View>
            </Card>

            {/* Risk reduction */}
            <Card style={styles.metricCard}>
              <Text style={styles.metricLabel}>Redução de risco estimada</Text>
              <Text style={styles.metricValueGreen}>
                {analysis.riskReduction}%
              </Text>
            </Card>

            {/* Impact */}
            <Card style={styles.metricCard}>
              <Text style={styles.metricLabel}>Impacto estimado</Text>
              <Text style={styles.metricValueCyan}>{analysis.impact}</Text>
            </Card>

            {/* Confidence */}
            <Card style={styles.metricCard}>
              <Text style={styles.metricLabel}>Confiança da IA</Text>
              <Text style={styles.metricValueGreen}>
                {analysis.confidence}%
              </Text>
              {/* Confidence bar */}
              <View style={styles.confBar}>
                <View
                  style={[
                    styles.confFill,
                    { width: `${analysis.confidence}%` },
                  ]}
                />
              </View>
            </Card>

            {/* Detailed analysis */}
            <Card style={styles.analysisCard}>
              <Text style={styles.analysisTitle}>ANÁLISE DETALHADA</Text>
              {analysis.analysis.map((point, i) => (
                <View key={i} style={styles.analysisRow}>
                  <CheckIcon />
                  <Text style={styles.analysisText}>{point}</Text>
                </View>
              ))}
            </Card>

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                Esta é uma recomendação automática.{"\n"}A decisão final é do
                operador.
              </Text>
            </View>

            {/* Action button */}
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() =>
                navigation.navigate("AIChat", {
                  object: sat,
                  initialAnalysis: analysis,
                })
              }
              activeOpacity={0.85}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                  stroke="#fff"
                  strokeWidth="1.8"
                  fill="rgba(255,255,255,0.1)"
                />
              </Svg>
              <Text style={styles.chatBtnText}>Conversar com a IA</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
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
  title: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  objectRef: {
    backgroundColor: "rgba(0,212,255,0.06)",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.2)",
    marginBottom: 16,
  },
  objectRefLabel: {
    fontSize: 10,
    color: colors.accentCyan,
    fontFamily: "Orbitron_700Bold",
    letterSpacing: 1,
    marginBottom: 2,
  },
  objectRefName: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: "Rajdhani_600SemiBold",
    fontWeight: "600",
  },

  // Loading
  loadingBox: { alignItems: "center", paddingVertical: 40 },
  loadingPulse: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,212,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: "Rajdhani_600SemiBold",
    fontWeight: "600",
    marginBottom: 6,
  },
  loadingDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    maxWidth: 260,
  },
  loadingSteps: { marginTop: 24, width: "100%" },
  loadingStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentCyan,
  },
  loadingStepText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },

  // Suggestion card
  suggestionCard: {
    marginBottom: 12,
    borderColor: "rgba(0,212,255,0.25)",
    backgroundColor: "rgba(0,212,255,0.05)",
  },
  suggestionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  suggestionLabel: {
    fontSize: 11,
    color: colors.accentCyan,
    fontFamily: "Rajdhani_600SemiBold",
    letterSpacing: 1,
    marginBottom: 6,
  },
  suggestionAction: {
    fontSize: 20,
    color: colors.textPrimary,
    fontFamily: "Rajdhani_600SemiBold",
    fontWeight: "600",
    marginBottom: 2,
  },
  suggestionDetail: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  brainIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(0,212,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Metric cards
  metricCard: { marginBottom: 12 },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: "Rajdhani_500Medium",
    marginBottom: 4,
  },
  metricValueGreen: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 28,
    color: colors.accentGreen,
    fontWeight: "700",
  },
  metricValueCyan: {
    fontSize: 16,
    color: colors.accentCyan,
    fontFamily: "Rajdhani_600SemiBold",
    fontWeight: "600",
  },
  confBar: {
    height: 4,
    backgroundColor: "rgba(0,255,136,0.15)",
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden",
  },
  confFill: {
    height: "100%",
    backgroundColor: colors.accentGreen,
    borderRadius: 2,
  },

  // Analysis
  analysisCard: { marginBottom: 12, borderColor: "rgba(30,107,255,0.2)" },
  analysisTitle: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: "Orbitron_700Bold",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  analysisRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    alignItems: "flex-start",
  },
  analysisText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },

  // Disclaimer
  disclaimer: { alignItems: "center", paddingVertical: 12, marginBottom: 8 },
  disclaimerText: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
  },

  // Chat button
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.accentBlue,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  chatBtnText: {
    fontSize: 14,
    color: "#fff",
    fontFamily: "Rajdhani_600SemiBold",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

export default AIAnalysisScreen;
