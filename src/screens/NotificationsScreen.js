import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { Card } from "../components/UI";
import { colors } from "../styles/theme";
import { Ionicons } from "@expo/vector-icons";
import { fetchSpaceObjects } from "../services/celestrakService";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const requestPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === "granted";
};

const normalize = (obj) => ({
  ...obj,
  name: (obj.name || obj.OBJECT_NAME || "").toUpperCase(),
  type: (obj.objectType || obj.OBJECT_TYPE || "").toUpperCase(),
  noradId: obj.noradId || obj.NORAD_CAT_ID || "",
});

const getCategoryType = (obj) => {
  const name = obj.name || "";
  const type = obj.type || "";

  if (name.includes("ISS") || obj.noradId === "25544") return "iss";
  if (name.includes("STARLINK")) return "starlink";
  if (type.includes("PAYLOAD")) return "payload";
  if (type.includes("ROCKET")) return "rocket_body";
  if (type.includes("DEBRIS")) return "debris";

  return "satellite";
};

const calculateCollisionRisk = (obj) => {
  const type = getCategoryType(obj);

  switch (type) {
    case "iss":
      return 8;
    case "debris":
      return 6;
    case "starlink":
      return 4;
    case "rocket_body":
      return 3;
    case "payload":
      return 2;
    default:
      return 1;
  }
};

const generateAlerts = (objects) => {
  return objects
    .filter((obj) => obj.collisionRisk >= 3)
    .sort((a, b) => b.collisionRisk - a.collisionRisk)
    .slice(0, 20)
    .map((obj) => ({
      id: String(obj.noradId),
      type:
        obj.collisionRisk >= 6
          ? "critical"
          : obj.collisionRisk >= 4
            ? "elevated"
            : "moderate",

      title:
        obj.collisionRisk >= 6
          ? "Alerta crítico"
          : obj.collisionRisk >= 4
            ? "Risco elevado"
            : "Risco moderado",

      message: `${obj.name} apresenta risco orbital monitorado.`,

      time: "Agora",
      read: false,
      object: obj.name,
    }));
};

const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    type: "critical",
    title: "Alerta crítico",
    message: "Risco de colisão: STARLINK-2031 × COSMOS-1408 DEB (4.7%).",
    time: "Agora",
    read: false,
    object: "STARLINK-2031",
  },
  {
    id: "2",
    type: "elevated",
    title: "Risco elevado",
    message: "IRIDIUM-106 em aproximação com DEBRIS-4487. Probabilidade: 3.2%.",
    time: "12 min",
    read: false,
    object: "IRIDIUM-106",
  },
  {
    id: "3",
    type: "info",
    title: "Atualização TLE",
    message: "Novos dados TLE disponíveis para 28 objetos monitorados.",
    time: "1 h",
    read: true,
    object: null,
  },
  {
    id: "4",
    type: "system",
    title: "Sistema",
    message: "Relatório diário gerado. 18.732 objetos rastreados.",
    time: "2 h",
    read: true,
    object: null,
  },
  {
    id: "5",
    type: "moderate",
    title: "Risco moderado",
    message: "ONEWEB-0012 em zona de congestionamento orbital (1200 km).",
    time: "3 h",
    read: true,
    object: "ONEWEB-0012",
  },
];

const NotificationsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState([]);
  const [permGranted, setPermGranted] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [sending, setSending] = useState(null);
  const notifListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    requestPermissions().then(setPermGranted);
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await fetchSpaceObjects();

      const normalized = data.map((obj) => {
        const n = normalize(obj);

        return {
          ...n,
          collisionRisk: calculateCollisionRisk(n),
        };
      });

      setNotifications(generateAlerts(normalized));
    } catch (error) {
      console.log(error);
    }
  };

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

  const testNotif = async (type) => {
    const granted = await requestPermissions();
    if (!granted) {
      alert("Ative as notificações nas configurações do dispositivo.");
      return;
    }
    const configs = {
      critical: {
        title: "⚠ ALERTA CRÍTICO - BlueOrbit",
        body: "Risco de colisão: STARLINK-2031 × COSMOS-1408 DEB (4.7%)",
      },
      elevated: {
        title: "▲ Risco Elevado - BlueOrbit",
        body: "IRIDIUM-106 em aproximação com DEBRIS-4487 (3.2%)",
      },
      info: {
        title: "ℹ Atualização - BlueOrbit",
        body: "12 novos objetos rastreados. Dados TLE atualizados.",
      },
    };
    const cfg = configs[type] || configs.info;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: cfg.title,
        body: cfg.body,
        sound: type === "critical",
        data: { type, screen: "Alerts" },
      },
      trigger: { seconds: 2 },
    });
    setSending(type);
    setTimeout(() => setSending(null), 3000);
  };

  const iconByType = (type) => {
    if (type === "critical")
      return { icon: "⚠", color: colors.critical, bg: colors.criticalBg };
    if (type === "elevated")
      return { icon: "▲", color: colors.elevated, bg: colors.elevatedBg };
    if (type === "moderate")
      return { icon: "◆", color: colors.moderate, bg: colors.moderateBg };
    if (type === "info")
      return {
        icon: "↻",
        color: colors.accentBlue,
        bg: "rgba(30,107,255,0.12)",
      };
    return {
      icon: "⚙",
      color: colors.textSecondary,
      bg: "rgba(139,160,204,0.08)",
    };
  };

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate("Dashboard")}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          <View>
            <Text style={styles.title}>Notificações</Text>

            <Text style={styles.sub}>{unread} não lidas</Text>
          </View>
        </View>

        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.markAll}>Marcar todas lidas</Text>
        </TouchableOpacity>
      </View>

      {!permGranted && (
        <View style={styles.permBanner}>
          <Text style={{ fontSize: 22 }}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.permTitle}>Ativar notificações</Text>
            <Text style={styles.permDesc}>
              Receba alertas de colisão em tempo real.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.permBtn}
            onPress={() => requestPermissions().then(setPermGranted)}
          >
            <Text style={styles.permBtnText}>Ativar</Text>
          </TouchableOpacity>
        </View>
      )}

      <Card style={{ marginBottom: 16 }}>
        <Text style={styles.settingsTitle}>CONFIGURAÇÕES</Text>
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Notificações ativas</Text>
            <Text style={styles.settingDesc}>
              Alertas de risco e atualizações
            </Text>
          </View>
          <Switch
            value={notifEnabled}
            onValueChange={setNotifEnabled}
            trackColor={{ false: colors.border, true: "rgba(30,107,255,0.5)" }}
            thumbColor={notifEnabled ? colors.accentBlue : colors.textMuted}
          />
        </View>
        <View
          style={[
            styles.settingRow,
            {
              borderTopWidth: 1,
              borderColor: colors.border,
              marginTop: 10,
              paddingTop: 10,
            },
          ]}
        >
          <View>
            <Text style={styles.settingLabel}>Apenas críticos</Text>
            <Text style={styles.settingDesc}>
              Só alertas com risco {">"} 4%
            </Text>
          </View>
          <Switch
            value={criticalOnly}
            onValueChange={setCriticalOnly}
            trackColor={{ false: colors.border, true: "rgba(255,59,59,0.5)" }}
            thumbColor={criticalOnly ? colors.critical : colors.textMuted}
          />
        </View>
      </Card>

      <Text style={styles.settingsTitle}>HISTÓRICO</Text>
      {notifications
        .filter((n) => !criticalOnly || n.type === "critical")
        .map((notif) => {
          const { icon, color, bg } = iconByType(notif.type);
          return (
            <TouchableOpacity
              key={notif.id}
              onPress={() => markRead(notif.id)}
              activeOpacity={0.8}
            >
              <Card
                style={[
                  styles.card,
                  {
                    borderColor: !notif.read ? color + "35" : colors.border,
                    backgroundColor: !notif.read ? color + "05" : colors.bgCard,
                  },
                ]}
              >
                <View style={styles.row}>
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: bg, borderColor: color + "30" },
                    ]}
                  >
                    <Text style={{ fontSize: 16 }}>{icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.rowHeader}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Text style={[styles.notifTitle, { color }]}>
                          {notif.title.charAt(0).toUpperCase() +
                            notif.title.slice(1)}
                        </Text>
                        {!notif.read && (
                          <View
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: color,
                            }}
                          />
                        )}
                      </View>
                      <Text style={styles.notifTime}>{notif.time}</Text>
                    </View>
                    <Text style={styles.notifMessage}>{notif.message}</Text>
                    {notif.object && (
                      <Text
                        style={{
                          fontSize: 10,
                          color: colors.accentBlue,
                          fontFamily: "Orbitron_700Bold",
                          marginTop: 4,
                        }}
                      >
                        {notif.object}
                      </Text>
                    )}
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingHorizontal: 20 },
  title: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 22,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  sub: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  markAll: {
    color: colors.accentBlue,
    fontSize: 12,
    fontFamily: "Rajdhani_600SemiBold",
    fontWeight: "600",
    paddingTop: 4,
  },
  permBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(30,107,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(30,107,255,0.25)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  permTitle: {
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: "Rajdhani_600SemiBold",
    fontWeight: "600",
  },
  permDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  permBtn: {
    backgroundColor: colors.accentBlue,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  permBtnText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Rajdhani_600SemiBold",
    fontWeight: "600",
  },
  settingsTitle: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: "Orbitron_700Bold",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: "Rajdhani_500Medium",
  },
  settingDesc: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  card: { marginBottom: 10 },
  row: { flexDirection: "row", gap: 12 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingBottom: 12,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Rajdhani_600SemiBold",
  },
  notifTime: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  notifMessage: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
});

export default NotificationsScreen;
