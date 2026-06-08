import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Rect, Line, Circle } from "react-native-svg";
import { Card, RiskBadge } from "../components/UI";
import { mockSatellite } from "../utils/mockData";
import { colors } from "../styles/theme";

const SatelliteScreen = ({ setScreen }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("info");
  const sat = mockSatellite;

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
    ["Período orbital", "95,6 min"],
    ["Excentricidade", "0.0001"],
    ["RAAN", "247,3°"],
    ["Arg. do perigeu", "83,7°"],
  ];

  return (
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
        <TouchableOpacity onPress={() => setScreen("alertDetail")}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.satName}>{sat.name}</Text>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>SATÉLITE ATIVO</Text>
          </View>
        </View>
      </View>

      {/* SVG Satellite Illustration */}
      <View style={styles.illustration}>
        <Svg width={160} height={90} viewBox="0 0 160 90">
          {/* Main body */}
          <Rect
            x="55"
            y="32"
            width="50"
            height="26"
            rx="3"
            fill="#1a3a6a"
            stroke="#1E6BFF"
            strokeWidth="1"
          />
          {/* Solar panels */}
          <Rect
            x="5"
            y="35"
            width="44"
            height="20"
            rx="2"
            fill="#1a3a6a"
            stroke="#1E6BFF"
            strokeWidth="1"
          />
          <Rect
            x="111"
            y="35"
            width="44"
            height="20"
            rx="2"
            fill="#1a3a6a"
            stroke="#1E6BFF"
            strokeWidth="1"
          />
          {/* Connectors */}
          <Line
            x1="49"
            y1="45"
            x2="55"
            y2="45"
            stroke="#1E6BFF"
            strokeWidth="1.5"
          />
          <Line
            x1="105"
            y1="45"
            x2="111"
            y2="45"
            stroke="#1E6BFF"
            strokeWidth="1.5"
          />
          {/* Grid lines on panels */}
          {[16, 24, 32].map((x) => (
            <Line
              key={x}
              x1={x}
              y1="35"
              x2={x}
              y2="55"
              stroke="#4A8FFF"
              strokeWidth="0.5"
              opacity="0.5"
            />
          ))}
          {[16, 24, 32].map((x) => (
            <Line
              key={x + 110}
              x1={x + 110}
              y1="35"
              x2={x + 110}
              y2="55"
              stroke="#4A8FFF"
              strokeWidth="0.5"
              opacity="0.5"
            />
          ))}
          {/* Antenna */}
          <Line
            x1="80"
            y1="32"
            x2="80"
            y2="20"
            stroke="#4A8FFF"
            strokeWidth="1.5"
          />
          <Circle
            cx="80"
            cy="18"
            r="3.5"
            fill="none"
            stroke="#00D4FF"
            strokeWidth="1"
          />
          {/* Core light */}
          <Circle cx="80" cy="45" r="4" fill="#00D4FF" opacity="0.5" />
        </Svg>
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
          <Card style={{ marginBottom: 16 }}>
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

          <Card
            style={{
              borderColor: "rgba(255,59,59,0.2)",
              backgroundColor: "rgba(255,59,59,0.04)",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <View>
                <Text style={styles.riskLabel}>Risco de colisão</Text>
                <Text style={styles.riskValue}>{sat.collisionRisk}%</Text>
                <Text style={styles.riskSub}>
                  Probabilidade nas próximas 24h
                </Text>
              </View>
              <RiskBadge level="critical" />
            </View>
            {/* Sparkline */}
            <Svg width="100%" height={30} viewBox="0 0 200 30">
              <Line
                x1="0"
                y1="25"
                x2="200"
                y2="8"
                stroke={colors.critical}
                strokeWidth="1.5"
                opacity="0.6"
              />
            </Svg>
          </Card>
        </>
      )}

      {activeTab === "orbita" && (
        <Card>
          <Text style={styles.orbitTitle}>Dados orbitais (TLE)</Text>
          {orbitRows.map(([label, value], i) => (
            <View
              key={label}
              style={[styles.row, i < orbitRows.length - 1 && styles.rowBorder]}
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
  back: {
    color: colors.textSecondary,
    fontSize: 28,
    fontFamily: "Rajdhani_500Medium",
  },
  satName: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  activeBadge: {
    backgroundColor: "rgba(0,255,136,0.12)",
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  activeBadgeText: {
    fontSize: 9,
    fontFamily: "Orbitron_700Bold",
    color: colors.accentGreen,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  illustration: {
    alignItems: "center",
    backgroundColor: "rgba(30,107,255,0.04)",
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
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
    fontWeight: "600",
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
    fontWeight: "500",
    fontFamily: "Inter_400Regular",
  },
  riskLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: "Rajdhani_500Medium",
    marginBottom: 4,
  },
  riskValue: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 28,
    fontWeight: "700",
    color: colors.critical,
  },
  riskSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  orbitTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: "Rajdhani_500Medium",
    marginBottom: 12,
  },
});

export default SatelliteScreen;
