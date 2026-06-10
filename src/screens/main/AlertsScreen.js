import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Card,
  RiskBadge,
  StatusBadge,
  Button,
  RiskIcon,
} from "../../components/UI";
import { mockAlerts } from "../../utils/mockData";
import BottomNav from "../../components/BottomNav";
import { colors } from "../../styles/theme";

const AlertsScreen = ({ setScreen, setSelectedAlert }) => {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("Todos");
  const filters = ["Todos", "Crítico", "Elevado", "Moderado"];

  const filterMap = {
    Crítico: "critical",
    Elevado: "elevated",
    Moderado: "moderate",
  };
  const filtered =
    filter === "Todos"
      ? mockAlerts
      : mockAlerts.filter((a) => a.type === filterMap[filter]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 16,
            paddingBottom: 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Alertas</Text>

        <Text style={styles.sub}>
          {
            mockAlerts.filter(
              (a) => a.status === "Aberta" || a.status === "Monitorando",
            ).length
          }{" "}
          alertas ativos
        </Text>

        {/* FILTERS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.chip, filter === f && styles.chipActive]}
            >
              <Text
                style={[styles.chipText, filter === f && styles.chipTextActive]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.period}>HOJE</Text>

        {filtered.slice(0, 2).map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onPress={() => {
              setSelectedAlert(alert);

              setScreen("alertDetail");
            }}
          />
        ))}

        {filtered.slice(2).length > 0 && (
          <>
            <Text
              style={[
                styles.period,
                {
                  marginTop: 16,
                },
              ]}
            >
              ONTEM
            </Text>

            {filtered.slice(2).map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                faded
                onPress={() => {
                  setSelectedAlert(alert);

                  setScreen("alertDetail");
                }}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* MENU */}
      <BottomNav active="Alerts" />
    </View>
  );
};

const AlertCard = ({ alert, onPress, faded }) => {
  const titleColor =
    alert.type === "critical"
      ? colors.critical
      : alert.type === "elevated"
        ? colors.elevated
        : colors.moderate;
  return (
    <Card style={[styles.card, faded && { opacity: 0.8 }]} onPress={onPress}>
      <View style={styles.cardRow}>
        <RiskIcon type={alert.type} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={styles.cardHeader}>
            <Text
              style={[
                styles.cardTitle,
                { color: faded ? colors.textSecondary : titleColor },
              ]}
            >
              {alert.title.toUpperCase()}
            </Text>
            <Text style={styles.cardTime}>{alert.time}</Text>
          </View>
          <Text style={styles.cardObjects}>
            {alert.object1} & {alert.object2}
          </Text>
        </View>
      </View>
      <View style={{ alignItems: "flex-end", marginTop: 8 }}>
        <StatusBadge status={alert.status} />
      </View>
    </Card>
  );
};

export const AlertDetailScreen = ({ alert, setScreen }) => {
  const insets = useSafeAreaInsets();
  if (!alert) return null;
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 52, paddingBottom: 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Alert banner */}
      <View style={styles.detailBanner}>
        <Text style={styles.detailBannerTitle}>⚠ ALERTA CRÍTICO</Text>
        <Text style={styles.detailBannerSub}>
          Risco de colisão entre objetos
        </Text>
      </View>

      {/* Objects */}
      <Card style={{ marginBottom: 16 }}>
        <View style={styles.objectsRow}>
          <View style={{ alignItems: "center" }}>
            <Text style={styles.objectName}>{alert.object1}</Text>
            <View style={styles.objectBadge}>
              <Text style={styles.objectBadgeText}>SATÉLITE ATIVO</Text>
            </View>
          </View>
          <View style={styles.vsCircle}>
            <Text
              style={{
                color: colors.critical,
                fontWeight: "700",
                fontSize: 16,
              }}
            >
              ✕
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={styles.objectName}>DEBRIS-4487</Text>
            <View
              style={[
                styles.objectBadge,
                {
                  backgroundColor: "rgba(155,89,182,0.15)",
                  borderColor: "#9B59B630",
                },
              ]}
            >
              <Text style={[styles.objectBadgeText, { color: "#9B59B6" }]}>
                FRAGMENTO
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Stats */}
      <Card style={{ marginBottom: 16 }}>
        <View style={styles.statsRow}>
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={styles.statMetaLabel}>Probabilidade</Text>
            <Text style={[styles.statMetaValue, { color: colors.critical }]}>
              {alert.probability}%
            </Text>
            <View style={styles.critBadge}>
              <Text style={styles.critBadgeText}>CRÍTICO</Text>
            </View>
          </View>
          <View style={[{ alignItems: "center", flex: 1 }, styles.statDivider]}>
            <Text style={styles.statMetaLabel}>Tempo até o evento</Text>
            <Text style={styles.statMetaValue}>{alert.timeToEvent}</Text>
          </View>
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={styles.statMetaLabel}>Distância mínima</Text>
            <Text style={styles.statMetaValue}>{alert.minDistance}</Text>
          </View>
        </View>
      </Card>

      {/* AI Suggestion */}
      <Card
        style={{
          marginBottom: 16,
          borderColor: "rgba(0,212,255,0.2)",
          backgroundColor: "rgba(0,212,255,0.04)",
        }}
      >
        <Text style={styles.aiLabel}>Ações sugeridas pela IA</Text>
        <Text style={styles.aiText}>{alert.aiSuggestion}</Text>
        <View style={styles.aiReductionBadge}>
          <Text style={styles.aiReductionText}>
            Redução estimada: {alert.riskReduction}%
          </Text>
        </View>
      </Card>

      <Button
        title="Ver Detalhes"
        onPress={() => setScreen("satellite")}
        style={{ marginBottom: 12 }}
      />
      <Button
        title="Registrar Ocorrência"
        onPress={() => setScreen("newOccurrence")}
        variant="secondary"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingHorizontal: 20 },
  title: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 22,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sub: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
  },
  filterScroll: { marginBottom: 16 },
  chip: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.accentBlue,
    borderColor: colors.accentBlue,
  },
  chipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: "Rajdhani_500Medium",
  },
  chipTextActive: { color: "#fff" },
  period: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: "Rajdhani_500Medium",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  card: { marginBottom: 10 },
  cardRow: { flexDirection: "row", alignItems: "flex-start" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Rajdhani_600SemiBold",
  },
  cardTime: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  cardObjects: {
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: "Inter_400Regular",
  },
  // Detail styles
  detailBanner: {
    backgroundColor: colors.criticalBg,
    borderWidth: 1,
    borderColor: "rgba(255,59,59,0.3)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  detailBannerTitle: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 11,
    color: colors.critical,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  detailBannerSub: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 4,
    fontFamily: "Inter_400Regular",
  },
  objectsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  objectName: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: "Rajdhani_500Medium",
    marginBottom: 4,
  },
  objectBadge: {
    backgroundColor: "rgba(0,255,136,0.12)",
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.3)",
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  objectBadgeText: {
    fontSize: 9,
    fontFamily: "Orbitron_700Bold",
    color: colors.accentGreen,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  vsCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.criticalBg,
    borderWidth: 1,
    borderColor: colors.critical,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  statMetaLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: "Rajdhani_500Medium",
    marginBottom: 6,
    textAlign: "center",
  },
  statMetaValue: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  statDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
  },
  critBadge: {
    backgroundColor: colors.criticalBg,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  critBadgeText: {
    fontSize: 9,
    fontFamily: "Orbitron_700Bold",
    color: colors.critical,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  aiLabel: {
    fontSize: 11,
    color: colors.accentCyan,
    fontFamily: "Rajdhani_600SemiBold",
    letterSpacing: 1,
    marginBottom: 8,
  },
  aiText: {
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 8,
    fontFamily: "Inter_400Regular",
  },
  aiReductionBadge: {
    backgroundColor: "rgba(0,255,136,0.1)",
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.2)",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  aiReductionText: {
    fontSize: 12,
    color: colors.accentGreen,
    fontFamily: "Rajdhani_600SemiBold",
    fontWeight: "600",
  },
});

export default AlertsScreen;
