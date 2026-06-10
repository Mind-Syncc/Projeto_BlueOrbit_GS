import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Rect, Line, Circle, Path } from "react-native-svg";
import { Card, RiskBadge } from "../../components/UI";
import { colors } from "../../styles/theme";

const SatelliteIllustration = () => (
  <Svg width={180} height={100} viewBox="0 0 180 100">
    {/* Main body */}
    <Rect
      x="65"
      y="35"
      width="50"
      height="28"
      rx="3"
      fill="#0D1B35"
      stroke="#1E6BFF"
      strokeWidth="1.2"
    />
    {/* Left solar panel */}
    <Rect
      x="8"
      y="38"
      width="50"
      height="22"
      rx="2"
      fill="#0D1B35"
      stroke="#1E6BFF"
      strokeWidth="1.1"
    />
    {/* Right solar panel */}
    <Rect
      x="122"
      y="38"
      width="50"
      height="22"
      rx="2"
      fill="#0D1B35"
      stroke="#1E6BFF"
      strokeWidth="1.1"
    />
    {/* Left connector */}
    <Line x1="58" y1="49" x2="65" y2="49" stroke="#1E6BFF" strokeWidth="1.5" />
    {/* Right connector */}
    <Line
      x1="115"
      y1="49"
      x2="122"
      y2="49"
      stroke="#1E6BFF"
      strokeWidth="1.5"
    />
    {/* Solar panel grid lines left */}
    {[20, 30, 40].map((x) => (
      <Line
        key={x}
        x1={x}
        y1="38"
        x2={x}
        y2="60"
        stroke="#4A8FFF"
        strokeWidth="0.5"
        opacity="0.5"
      />
    ))}
    {/* Solar panel grid lines right */}
    {[132, 142, 152].map((x) => (
      <Line
        key={x}
        x1={x}
        y1="38"
        x2={x}
        y2="60"
        stroke="#4A8FFF"
        strokeWidth="0.5"
        opacity="0.5"
      />
    ))}
    {/* Antenna */}
    <Line x1="90" y1="35" x2="90" y2="22" stroke="#4A8FFF" strokeWidth="1.5" />
    <Circle
      cx="90"
      cy="20"
      r="3.5"
      fill="none"
      stroke="#00D4FF"
      strokeWidth="1.2"
    />
    {/* Body core glow */}
    <Circle cx="90" cy="49" r="5" fill="#00D4FF" opacity="0.3" />
    {/* Status light */}
    <Circle cx="90" cy="49" r="2" fill="#00D4FF" opacity="0.9" />
    {/* Small detail lines on body */}
    <Line
      x1="72"
      y1="42"
      x2="108"
      y2="42"
      stroke="#1E6BFF"
      strokeWidth="0.5"
      opacity="0.4"
    />
    <Line
      x1="72"
      y1="56"
      x2="108"
      y2="56"
      stroke="#1E6BFF"
      strokeWidth="0.5"
      opacity="0.4"
    />
  </Svg>
);

// Mini sparkline chart for risk trend
const RiskSparkline = ({ riskLevel }) => {
  const color =
    riskLevel === "critical"
      ? colors.critical
      : riskLevel === "elevated"
        ? colors.elevated
        : colors.moderate;
  const points =
    riskLevel === "critical"
      ? "0,25 40,20 80,18 120,12 160,8 200,4"
      : riskLevel === "elevated"
        ? "0,22 50,18 100,20 150,15 200,12"
        : "0,20 60,18 120,22 180,19 200,18";
  return (
    <Svg width="100%" height={32} viewBox="0 0 200 30">
      <Path
        d={`M${points
          .split(" ")
          .map((p, i) => `${i === 0 ? "" : "L"}${p}`)
          .join("")}`}
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        opacity="0.8"
      />
    </Svg>
  );
};

const SpaceObjectDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("info");
  const sat = route?.params?.object;

  if (!sat) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bgPrimary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: colors.textSecondary }}>
          Objeto não encontrado
        </Text>
      </View>
    );
  }

  const riskColor =
    sat.riskLevel === "critical"
      ? colors.critical
      : sat.riskLevel === "elevated"
        ? colors.elevated
        : sat.riskLevel === "moderate"
          ? colors.moderate
          : colors.accentGreen;

  const riskLabel =
    sat.riskLevel === "critical"
      ? "CRÍTICO"
      : sat.riskLevel === "elevated"
        ? "ELEVADO"
        : sat.riskLevel === "moderate"
          ? "MODERADO"
          : "BAIXO";

  const infoRows = [
  ["NORAD ID", sat.noradId],
  ["Operador", sat.operator],
  ["País", sat.country],
  ["Tipo", sat.satelliteType],
  ["Lançamento", sat.launch],
  ["Massa", sat.mass],
  ["Altitude", sat.altitude],
  ["Velocidade", sat.velocity],
  ["Inclinação", sat.inclination],
];

  const orbitRows = [
  ["Altitude média", sat.altitude],
  ["Velocidade orbital", sat.velocity],
  ["Inclinação", sat.inclination],
  ["Período orbital", sat.period],
  ["Excentricidade", sat.eccentricity],
  ["RAAN", sat.raan],
  ["Apogeu", sat.apoapsis],
  ["Perigeu", sat.periapsis],
];

  const goToAI = () => {
    navigation.navigate("AIAnalysis", { object: sat });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back + Title */}
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
          <View style={{ flex: 1 }}>
            <Text style={styles.satName} numberOfLines={1}>
              {sat.name}
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    sat.status === "DEBRIS"
                      ? "rgba(255,140,0,0.15)"
                      : "rgba(0,255,136,0.12)",
                  borderColor:
                    sat.status === "DEBRIS"
                      ? "rgba(255,140,0,0.4)"
                      : "rgba(0,255,136,0.4)",
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      sat.status === "DEBRIS"
                        ? colors.elevated
                        : colors.accentGreen,
                  },
                ]}
              >
                {sat.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Satellite Illustration */}
        <View style={styles.illustration}>
          <SatelliteIllustration />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {["info", "orbita"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab === "info" ? "Informações" : "Órbita"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "info" && (
          <>
            {/* Info table */}
            <Card style={{ marginBottom: 14 }}>
              {infoRows.map(([label, value], i) => (
                <View
                  key={label}
                  style={[
                    styles.row,
                    i < infoRows.length - 1 && styles.rowBorder,
                  ]}
                >
                  <Text style={styles.rowLabel}>{label}</Text>
                  <Text style={styles.rowValue}>{value}</Text>
                </View>
              ))}
            </Card>

            {/* Collision Risk Card */}
            <Card
              style={[
                styles.riskCard,
                {
                  borderColor: riskColor + "35",
                  backgroundColor: riskColor + "08",
                },
              ]}
            >
              <View style={styles.riskHeader}>
                <View>
                  <Text style={styles.riskLabel}>Risco de colisão</Text>
                  <Text style={[styles.riskValue, { color: riskColor }]}>
                    {sat.collisionRisk.toFixed(1)}%
                  </Text>
                  <Text style={styles.riskSub}>
                    Probabilidade nas próximas 24h
                  </Text>
                </View>
                <View
                  style={[
                    styles.riskBadgeBox,
                    {
                      backgroundColor: riskColor + "20",
                      borderColor: riskColor + "50",
                    },
                  ]}
                >
                  <Text style={[styles.riskBadgeText, { color: riskColor }]}>
                    {riskLabel}
                  </Text>
                </View>
              </View>
              <RiskSparkline riskLevel={sat.riskLevel} />
            </Card>

            {/* AI Analysis Button */}
            <TouchableOpacity
              style={styles.aiBtn}
              onPress={goToAI}
              activeOpacity={0.85}
            >
              <View style={styles.aiBtnIcon}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 2a5 5 0 015 5v1a5 5 0 01-10 0V7a5 5 0 015-5z"
                    stroke="#00D4FF"
                    strokeWidth="1.5"
                    fill="rgba(0,212,255,0.15)"
                  />
                  <Path
                    d="M9 15c-3.31 0-6 2.69-6 6h18c0-3.31-2.69-6-6-6H9z"
                    stroke="#00D4FF"
                    strokeWidth="1.5"
                    fill="rgba(0,212,255,0.1)"
                  />
                  <Circle cx="19" cy="5" r="3" fill="#00D4FF" opacity="0.8" />
                  <Circle cx="19" cy="5" r="1.5" fill="#fff" />
                </Svg>
              </View>
              <Text style={styles.aiBtnText}>Análise da IA</Text>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9 18l6-6-6-6"
                  stroke="#00D4FF"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </Svg>
            </TouchableOpacity>
          </>
        )}

        {activeTab === "orbita" && (
          <Card>
            <Text style={styles.orbitTitle}>Dados orbitais</Text>
            {orbitRows.map(([label, value], i) => (
              <View
                key={label}
                style={[
                  styles.row,
                  i < orbitRows.length - 1 && styles.rowBorder,
                ]}
              >
                <Text style={styles.rowLabel}>{label}</Text>
                <Text style={[styles.rowValue, { color: colors.accentCyan }]}>
                  {value}
                </Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingHorizontal: 20 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
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
  satName: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 15,
    color: colors.textPrimary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontFamily: "Orbitron_700Bold",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  illustration: {
    alignItems: "center",
    backgroundColor: "rgba(30,107,255,0.04)",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(30,107,255,0.1)",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderColor: "transparent",
  },
  tabActive: { borderColor: colors.accentBlue },
  tabText: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 14,
    color: colors.textMuted,
  },
  tabTextActive: { color: colors.accentBlue },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  rowBorder: { borderBottomWidth: 1, borderColor: "rgba(30,80,160,0.15)" },
  rowLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: "Rajdhani_500Medium",
  },
  rowValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  },
  riskCard: { marginBottom: 14, borderWidth: 1 },
  riskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  riskLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: "Rajdhani_500Medium",
    marginBottom: 2,
  },
  riskValue: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 32,
    fontWeight: "700",
  },
  riskSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  riskBadgeBox: {
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  riskBadgeText: {
    fontSize: 10,
    fontFamily: "Orbitron_700Bold",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  aiBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,212,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.3)",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  aiBtnIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(0,212,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  aiBtnText: {
    flex: 1,
    fontSize: 14,
    color: colors.accentCyan,
    fontFamily: "Rajdhani_600SemiBold",
    fontWeight: "600",
  },
  orbitTitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: "Rajdhani_500Medium",
    letterSpacing: 1,
    marginBottom: 12,
  },
});

export default SpaceObjectDetailScreen;
