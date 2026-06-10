import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/config";
import { getOccurrences } from "../../firebase/databaseService";
import { fetchSpaceObjects } from "../../services/celestrakService";
import { Card, Button } from "../../components/UI";
import BottomNav from "../../components/BottomNav";
import { colors } from "../../styles/theme";

// Mesmo cálculo de risco do resto do app
const getCategoryType = (obj) => {
  const name = (obj.name || "").toUpperCase();
  const type = (
    obj.type ||
    obj.objectType ||
    obj.OBJECT_TYPE ||
    ""
  ).toUpperCase();
  if (name.includes("ISS") || obj.noradId === "25544") return "iss";
  if (name.includes("STARLINK")) return "starlink";
  if (type.includes("PAYLOAD")) return "payload";
  if (type.includes("ROCKET")) return "rocket_body";
  if (type.includes("DEBRIS") || name.includes("DEB") || name.includes("R/B"))
    return "debris";
  return "satellite";
};

const calculateCollisionRisk = (obj) => {
  const type = getCategoryType(obj);
  let base = 0.5;
  switch (type) {
    case "iss":
      base = 6 + Math.random() * 3;
      break;
    case "debris":
      base = 3 + Math.random() * 4;
      break;
    case "starlink":
      base = 2 + Math.random() * 3;
      break;
    case "rocket_body":
      base = 1.5 + Math.random() * 2;
      break;
    case "payload":
      base = 1 + Math.random() * 2;
      break;
    default:
      base = 0.5 + Math.random() * 1.5;
  }
  return Number(base.toFixed(2));
};

// Stat card
const StatCard = ({ label, value, loading }) => (
  <Card style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    {loading ? (
      <ActivityIndicator
        size="small"
        color={colors.accentCyan}
        style={{ marginTop: 6 }}
      />
    ) : (
      <Text style={styles.statValue}>{value}</Text>
    )}
  </Card>
);

// ProfileScreen
const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const user = auth.currentUser;
  const firstName = user?.displayName?.split(" ")[0] || "Operador";

  const [loading, setLoading] = useState(true);
  const [monitoredObjects, setMonitored] = useState(0);
  const [activeAlerts, setAlerts] = useState(0);
  const [occurrenceCount, setOccs] = useState(0);
  const [actionCount, setActions] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [occResult, spaceData] = await Promise.all([
          getOccurrences(),
          fetchSpaceObjects(),
        ]);

        // Ocorrencias do Firebase
        const occList = occResult.success ? occResult.data : [];
        setOccs(occList.length);

        // Acoes = ocorrencias com campo action preenchido
        setActions(
          occList.filter((o) => o.action && o.action.trim() !== "").length,
        );

        // Objetos via API
        setMonitored(spaceData.length);

        // Alertas criticos = risco > 6
        const criticals = spaceData.filter((obj) => {
          const n = {
            ...obj,
            name: (obj.name || obj.OBJECT_NAME || "").toUpperCase(),
            type: (obj.objectType || obj.OBJECT_TYPE || "").toUpperCase(),
            noradId: obj.noradId || obj.NORAD_CAT_ID || "",
          };
          return calculateCollisionRisk(n) > 6;
        }).length;
        setAlerts(criticals);
      } catch (e) {
        console.error("ProfileScreen load error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch {
      Alert.alert("Erro", "Nao foi possivel sair");
    }
  }

  const memberSince = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      })
    : null;

  const stats = [
    {
      label: "Objetos monitorados",
      value: monitoredObjects.toLocaleString("pt-BR"),
    },
    { label: "Alertas ativos", value: activeAlerts.toLocaleString("pt-BR") },
    { label: "Ocorrências", value: occurrenceCount.toLocaleString("pt-BR") },
    { label: "Ações registradas", value: actionCount.toLocaleString("pt-BR") },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{firstName[0]}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>
              {user?.displayName || "Operador"}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>

            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>OPERADOR DA BLUEORBIT</Text>
              </View>
              {user?.emailVerified && (
                <View style={styles.verifiedBadge}>
                  <View style={styles.verifiedDot} />
                  <Text style={styles.verifiedText}>VERIFICADO</Text>
                </View>
              )}
            </View>

            {memberSince && (
              <Text style={styles.memberSince}>Membro desde {memberSince}</Text>
            )}
          </View>
        </View>

        {/* STATS */}
        <View style={styles.statsGrid}>
          {stats.map((item) => (
            <StatCard
              key={item.label}
              label={item.label}
              value={item.value}
              loading={loading}
            />
          ))}
        </View>

        {/* MENU */}
        <Card style={{ marginBottom: 20 }}>
          {[
            "Dados do perfil",
            "Segurança",
            "Notificações",
            "Sobre o BlueOrbit",
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.menuRow,
                i !== arr.length - 1 && styles.menuBorder,
              ]}
            >
              <Text style={styles.menuLabel}>{item}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </Card>

        {/* LOGOUT */}
        <Button
          title="Sair da conta"
          variant="secondary"
          onPress={handleLogout}
          style={{ borderColor: "rgba(255,59,59,0.4)" }}
        />
      </ScrollView>

      <BottomNav active="Profile" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingHorizontal: 20 },

  profileHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 24,
    marginTop: 10,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.accentBlue,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.borderBright,
  },
  avatarText: { fontSize: 24, color: "#fff", fontWeight: "700" },

  userName: { fontSize: 22, color: colors.textPrimary, fontWeight: "700" },
  userEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },

  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(30,107,255,0.15)",
    borderRadius: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  roleBadgeText: {
    color: colors.accentBlue,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.accentGreen,
  },
  verifiedText: {
    color: colors.accentGreen,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },

  memberSince: { fontSize: 11, color: colors.textMuted, marginTop: 6 },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statCard: { flex: 1, minWidth: "45%" },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 24, color: colors.accentCyan, fontWeight: "700" },

  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  menuBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(30,80,160,0.15)",
  },
  menuLabel: { color: colors.textPrimary, fontSize: 14 },
  menuArrow: { color: colors.textMuted, fontSize: 20 },
});

export default ProfileScreen;
