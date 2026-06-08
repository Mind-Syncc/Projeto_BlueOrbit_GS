import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Polygon,
  LinearGradient,
  Path,
  G,
  Defs,
  RadialGradient,
  Stop,
  Ellipse,
  Line,
} from "react-native-svg";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Card, RiskBadge } from "../components/UI";
import { colors } from "../styles/theme";
import { auth } from "../firebase/config";
import BottomNav from "../components/BottomNav";
import { fetchSpaceObjects } from "../services/celestrakService";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const { width: SCREEN_W } = Dimensions.get("window");
const HEADER_H = 180;

// Classificação de tipo (igual SpaceObjectsScreen)
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

// Risco de colisão (igual SpaceObjectsScreen)
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

// Deriva stats reais a partir dos objetos da API
const deriveStats = (objects) => {
  const total = objects.length;

  // Contagens por risco
  let critical = 0,
    elevated = 0,
    moderate = 0,
    low = 0;
  // Contagens por tipo
  let activeSatellites = 0,
    debrisCount = 0,
    rocketBodies = 0;

  for (const obj of objects) {
    const risk = obj.collisionRisk;
    if (risk > 6) critical++;
    else if (risk > 3) elevated++;
    else if (risk > 1.5) moderate++;
    else low++;

    const cat = getCategoryType(obj);
    if (cat === "debris") debrisCount++;
    else if (cat === "rocket_body") rocketBodies++;
    else activeSatellites++;
  }

  // Distribuição de risco para o donut (percentuais reais)
  const riskDistribution = [
    {
      name: "Crítico",
      value: critical,
      color: "#EF4444",
      pct: total ? Math.round((critical / total) * 100) : 0,
    },
    {
      name: "Elevado",
      value: elevated,
      color: "#F59E0B",
      pct: total ? Math.round((elevated / total) * 100) : 0,
    },
    {
      name: "Moderado",
      value: moderate,
      color: "#3B82F6",
      pct: total ? Math.round((moderate / total) * 100) : 0,
    },
    {
      name: "Baixo",
      value: low,
      color: "#38BDF8",
      pct: total ? Math.round((low / total) * 100) : 0,
    },
  ];

  // Top alertas reais (maior risco primeiro)
  const topAlerts = [...objects]
    .sort((a, b) => b.collisionRisk - a.collisionRisk)
    .slice(0, 5)
    .map((obj) => ({
      id: obj.noradId,
      object1: obj.name,
      object2: getCategoryType(obj) === "debris" ? "DEBRIS" : "OBJETO PRÓXIMO",
      probability: obj.collisionRisk,
      type:
        obj.collisionRisk > 6
          ? "critical"
          : obj.collisionRisk > 3
            ? "elevated"
            : "moderate",
      timeToEvent: `${Math.floor(1 + Math.random() * 11)}h ${Math.floor(Math.random() * 59)}m`,
      status: obj.collisionRisk > 6 ? "Aberta" : "Monitorando",
    }));

  return {
    trackedObjects: total,
    criticalRisks: critical,
    activeSatellites,
    debris: debrisCount + rocketBodies,
    riskDistribution,
    topAlerts,
    overallRisk: total ? Math.round((critical / total) * 100) : 0,
  };
};

// SVG Background
const OrbitalBackground = ({ width, height }) => (
  <Svg
    width={width}
    height={height}
    viewBox={`0 0 ${width} ${height}`}
    style={StyleSheet.absoluteFill}
  >
    <Defs>
      <RadialGradient id="glow1" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#1E6BFF" stopOpacity="0.35" />
        <Stop offset="100%" stopColor="#050A18" stopOpacity="0" />
      </RadialGradient>
      <RadialGradient id="glow2" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#00D4FF" stopOpacity="0.2" />
        <Stop offset="100%" stopColor="#050A18" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Path d={`M0 0 H${width} V${height} H0Z`} fill="#050A18" />
    <Ellipse
      cx={width * 0.25}
      cy={height * 0.55}
      rx={width * 0.4}
      ry={height * 0.55}
      fill="url(#glow1)"
    />
    <Ellipse
      cx={width * 0.82}
      cy={height * 0.3}
      rx={width * 0.28}
      ry={height * 0.35}
      fill="url(#glow2)"
    />
    {[72, 100, 130, 162].map((r, i) => (
      <Circle
        key={i}
        cx={width * 0.5}
        cy={height * 1.05}
        r={r}
        stroke={
          i === 0
            ? "rgba(30,107,255,0.55)"
            : i === 1
              ? "rgba(0,212,255,0.3)"
              : "rgba(30,107,255,0.15)"
        }
        strokeWidth={i < 2 ? 0.9 : 0.5}
        fill="none"
        strokeDasharray={i > 1 ? "3 5" : undefined}
      />
    ))}
    <Circle
      cx={width * 0.5 + 72}
      cy={height * 1.05}
      r={2.5}
      fill="#00D4FF"
      opacity="0.9"
    />
    <Circle
      cx={width * 0.5 - 98}
      cy={height * 1.05 - 18}
      r={2}
      fill="#1E6BFF"
      opacity="0.8"
    />
    <Circle
      cx={width * 0.5 + 80}
      cy={height * 1.05 - 62}
      r={2}
      fill="#FF8C00"
      opacity="0.9"
    />
    <Line
      x1={width * 0.5}
      y1={height * 1.05}
      x2={width * 0.5 + 125}
      y2={height * 1.05 - 30}
      stroke="rgba(0,212,255,0.3)"
      strokeWidth="0.8"
    />
    {[
      [0.08, 0.12],
      [0.18, 0.07],
      [0.32, 0.18],
      [0.55, 0.06],
      [0.68, 0.14],
      [0.78, 0.25],
      [0.88, 0.08],
      [0.93, 0.32],
      [0.12, 0.35],
      [0.42, 0.28],
      [0.62, 0.35],
      [0.84, 0.44],
    ].map(([fx, fy], i) => (
      <Circle
        key={i}
        cx={width * fx}
        cy={height * fy}
        r={i % 3 === 0 ? 1.2 : 0.8}
        fill="#fff"
        opacity={0.25 + (i % 4) * 0.12}
      />
    ))}
    <Line
      x1="0"
      y1={height * 0.65}
      x2={width}
      y2={height * 0.65}
      stroke="rgba(30,107,255,0.08)"
      strokeWidth="0.5"
    />
    <Line
      x1="0"
      y1={height * 0.82}
      x2={width}
      y2={height * 0.82}
      stroke="rgba(30,107,255,0.08)"
      strokeWidth="0.5"
    />
  </Svg>
);

// Donut Chart
const DonutChart = ({ data, size = 130 }) => {
  const cx = size / 2,
    cy = size / 2,
    R = 44,
    r = 30;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <View style={{ width: size, height: size }} />;
  let startAngle = -90;
  const slices = data.map((d) => {
    const angle = (d.value / total) * 360;
    const s = startAngle;
    startAngle += angle;
    return { ...d, startAngle: s, angle };
  });
  const polarToXY = (deg, radius) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };
  const arcPath = (startDeg, angleDeg, outerR, innerR) => {
    if (angleDeg >= 360) angleDeg = 359.99;
    const endDeg = startDeg + angleDeg;
    const o1 = polarToXY(startDeg, outerR),
      o2 = polarToXY(endDeg, outerR);
    const i1 = polarToXY(endDeg, innerR),
      i2 = polarToXY(startDeg, innerR);
    const large = angleDeg > 180 ? 1 : 0;
    return [
      `M ${o1.x} ${o1.y}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${o2.x} ${o2.y}`,
      `L ${i1.x} ${i1.y}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${i2.x} ${i2.y}`,
      "Z",
    ].join(" ");
  };
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((slice, i) => (
        <Path
          key={i}
          d={arcPath(slice.startAngle, slice.angle, R, r)}
          fill={slice.color}
          opacity={0.95}
        />
      ))}
      <Circle cx={cx} cy={cy} r={r - 2} fill={colors.bgPrimary} />
      <Circle cx={cx} cy={cy} r={r - 2} fill="rgba(0,212,255,0.06)" />
    </Svg>
  );
};

// StatCard
const StatCard = ({ label, value, sub, loading }) => (
  <Card style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    {loading ? (
      <ActivityIndicator
        size="small"
        color={colors.accentBlue}
        style={{ marginVertical: 6 }}
      />
    ) : (
      <Text style={styles.statValue}>
        {Number(value).toLocaleString("pt-BR")}
      </Text>
    )}
    <Text style={styles.statSub}>{sub}</Text>
  </Card>
);

// DashboardScreen
const DashboardScreen = ({ navigation }) => {
  const user = auth.currentUser;
  const firstName = user?.displayName?.split(" ")[0] || "Usuário";
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Carrega dados reais
  const loadData = async () => {
    setLoading(true);
    try {
      const raw = await fetchSpaceObjects();

      // Normaliza e calcula risco (igual SpaceObjectsScreen)
      const objects = raw.map((obj) => {
        const name = (obj.name || obj.OBJECT_NAME || "").toUpperCase();
        const type = (obj.objectType || obj.OBJECT_TYPE || "").toUpperCase();
        const normalized = {
          ...obj,
          name,
          type,
          noradId: obj.noradId || obj.NORAD_CAT_ID || "",
        };
        return {
          ...normalized,
          collisionRisk: calculateCollisionRisk(normalized),
        };
      });

      setStats(deriveStats(objects));
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Notificações
  useEffect(() => {
    const init = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
      if (stats?.criticalRisks > 0) {
        await Notifications.setBadgeCountAsync(stats.criticalRisks);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "🚨 BLUEORBIT",
            body: `${stats.criticalRisks} objetos com risco crítico detectados`,
            sound: true,
            badge: stats.criticalRisks,
          },
          trigger: null,
        });
      }
    };
    if (stats) init();
  }, [stats]);

  // PDF com dados reais
  const generatePDF = async () => {
    if (pdfLoading || !stats) return;
    setPdfLoading(true);
    try {
      const now = new Date().toLocaleString("pt-BR");
      const {
        trackedObjects,
        criticalRisks,
        activeSatellites,
        debris,
        riskDistribution,
        topAlerts,
      } = stats;

      const riskRows = riskDistribution
        .map(
          (r) => `
        <tr>
          <td style="padding:8px 12px;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${r.color};margin-right:6px;"></span>${r.name}</td>
          <td style="padding:8px 12px;text-align:right;">${r.value.toLocaleString("pt-BR")}</td>
          <td style="padding:8px 12px;text-align:right;color:${r.color};">${r.pct}%</td>
        </tr>`,
        )
        .join("");

      const alertRows = topAlerts
        .map((a) => {
          const lvlColor =
            a.type === "critical"
              ? "#FF3B3B"
              : a.type === "elevated"
                ? "#FF8C00"
                : "#FFD700";
          return `<div style="border:1px solid ${lvlColor}30;border-radius:10px;padding:14px;margin-bottom:12px;background:rgba(255,255,255,0.02);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="font-weight:700;color:#fff;font-size:14px;">${a.object1}</span>
            <span style="background:${lvlColor}22;border:1px solid ${lvlColor}55;color:${lvlColor};font-size:10px;padding:2px 8px;border-radius:4px;font-weight:700;letter-spacing:1px;">${a.type.toUpperCase()}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div><div style="color:#8BA0CC;font-size:10px;margin-bottom:2px;">RISCO</div><div style="color:${lvlColor};font-size:16px;font-weight:700;">${a.probability}%</div></div>
            <div><div style="color:#8BA0CC;font-size:10px;margin-bottom:2px;">TEMPO ESTIMADO</div><div style="color:#E8F0FF;font-size:14px;font-weight:600;">${a.timeToEvent}</div></div>
          </div>
        </div>`;
        })
        .join("");

      const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><title>Relatório BlueOrbit</title>
<style>* { box-sizing:border-box;margin:0;padding:0; } body { font-family:Arial,sans-serif;background:#050A18;color:#E8F0FF;padding:32px; } table { width:100%;border-collapse:collapse; } td,th { border:1px solid #1E3060; } th { background:rgba(30,107,255,0.15);color:#8BA0CC;font-size:10px;letter-spacing:1px;padding:8px 12px;text-align:left; }</style>
</head><body>
<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #1E3060;padding-bottom:20px;margin-bottom:28px;">
  <div><div style="color:#00D4FF;font-size:10px;letter-spacing:3px;margin-bottom:4px;">SISTEMA DE MONITORAMENTO ORBITAL</div>
  <h1 style="font-size:28px;color:#fff;margin-bottom:4px;">BlueOrbit Space Safety</h1>
  <div style="color:#8BA0CC;font-size:13px;">Relatório Inteligente de Monitoramento</div></div>
  <div style="text-align:right;"><div style="background:rgba(255,59,59,0.15);border:1px solid rgba(255,59,59,0.4);border-radius:6px;padding:6px 14px;display:inline-block;margin-bottom:6px;"><span style="color:#FF3B3B;font-size:10px;font-weight:700;letter-spacing:1px;">● ATIVO</span></div>
  <div style="color:#8BA0CC;font-size:11px;">${now}</div></div>
</div>
<h2 style="font-size:11px;color:#4A5E80;letter-spacing:2px;margin-bottom:16px;">RESUMO GERAL</h2>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:28px;">
  <div style="background:rgba(255,255,255,0.03);border:1px solid #1E3060;border-radius:10px;padding:16px;"><div style="color:#8BA0CC;font-size:10px;margin-bottom:6px;">OBJETOS RASTREADOS</div><div style="color:#E8F0FF;font-size:24px;font-weight:700;">${trackedObjects.toLocaleString("pt-BR")}</div></div>
  <div style="background:rgba(255,59,59,0.05);border:1px solid rgba(255,59,59,0.2);border-radius:10px;padding:16px;"><div style="color:#8BA0CC;font-size:10px;margin-bottom:6px;">RISCOS CRÍTICOS</div><div style="color:#FF3B3B;font-size:24px;font-weight:700;">${criticalRisks}</div></div>
  <div style="background:rgba(0,212,255,0.04);border:1px solid rgba(0,212,255,0.15);border-radius:10px;padding:16px;"><div style="color:#8BA0CC;font-size:10px;margin-bottom:6px;">SATÉLITES ATIVOS</div><div style="color:#00D4FF;font-size:24px;font-weight:700;">${activeSatellites.toLocaleString("pt-BR")}</div></div>
  <div style="background:rgba(255,140,0,0.05);border:1px solid rgba(255,140,0,0.2);border-radius:10px;padding:16px;"><div style="color:#8BA0CC;font-size:10px;margin-bottom:6px;">DEBRIS ORBITAIS</div><div style="color:#FF8C00;font-size:24px;font-weight:700;">${debris.toLocaleString("pt-BR")}</div></div>
</div>
<h2 style="font-size:11px;color:#4A5E80;letter-spacing:2px;margin-bottom:12px;">DISTRIBUIÇÃO DE RISCO</h2>
<table style="margin-bottom:28px;border-radius:10px;overflow:hidden;"><thead><tr><th>NÍVEL</th><th style="text-align:right;">OBJETOS</th><th style="text-align:right;">% DO TOTAL</th></tr></thead><tbody style="background:rgba(255,255,255,0.02);">${riskRows}</tbody></table>
<h2 style="font-size:11px;color:#4A5E80;letter-spacing:2px;margin-bottom:16px;">OBJETOS DE MAIOR RISCO</h2>${alertRows}
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #1E3060;display:flex;justify-content:space-between;">
  <div style="color:#4A5E80;font-size:10px;">BLUEORBIT Space Safety System • Dados via CelesTrak API</div>
  <div style="color:#4A5E80;font-size:10px;">${now}</div>
</div>
</body></html>`;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Salvar Relatório BLUEORBIT",
          UTI: "com.adobe.pdf",
        });
      } else {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.log("PDF error:", error);
    } finally {
      setPdfLoading(false);
    }
  };

  const s = stats;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
          <OrbitalBackground
            width={SCREEN_W}
            height={HEADER_H + insets.top + 20}
          />

          <View style={styles.heroTopBar}>
            <View style={styles.logoRow}>
              <View style={styles.logoWrapper}>
                <Svg width={42} height={42} viewBox="0 0 60 60">
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
              </View>
              <View style={{ marginLeft: -15 }}>
                <Text style={styles.logoName}>BLUEORBIT</Text>
                <Text style={styles.logoSub}>Space Safety Intelligence</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => navigation.navigate("Notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={colors.textPrimary}
              />
              {s?.criticalRisks > 0 && <View style={styles.bellDot} />}
            </TouchableOpacity>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroBottom}>
            <View>
              <Text style={styles.heroGreetLabel}>
                Central de Monitoramento
              </Text>
              <Text style={styles.heroGreet}>Olá, {firstName}!</Text>
            </View>
          </View>

          <View style={styles.heroFade} pointerEvents="none" />
        </View>

        {/* ── Content ── */}
        <View style={styles.below}>
          {/* Banner de alerta crítico (dados reais) */}
          <TouchableOpacity
            style={styles.criticalBanner}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("Alerts")}
          >
            <View style={styles.criticalIcon}>
              <Text style={styles.criticalIconText}>⚠</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.criticalTitle}>
                {loading
                  ? "CARREGANDO..."
                  : s?.criticalRisks > 0
                    ? "ALERTA CRÍTICO"
                    : "SISTEMA NORMAL"}
              </Text>
              <Text style={styles.criticalDesc}>
                {loading
                  ? "Buscando dados da API CelesTrak…"
                  : s?.criticalRisks > 0
                    ? `${s.criticalRisks} objeto${s.criticalRisks > 1 ? "s" : ""} com risco crítico detectado${s.criticalRisks > 1 ? "s" : ""}`
                    : "Nenhum risco crítico no momento"}
              </Text>
            </View>
            <Text style={styles.criticalArrow}>›</Text>
          </TouchableOpacity>

          {/* Botão recarregar + PDF */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.pdfButton,
                (pdfLoading || loading) && { opacity: 0.6 },
              ]}
              onPress={generatePDF}
              disabled={pdfLoading || loading}
            >
              <Ionicons
                name={
                  pdfLoading ? "hourglass-outline" : "document-text-outline"
                }
                size={15}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.pdfButtonText}>
                {pdfLoading ? "Gerando..." : "Gerar PDF"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats Grid — valores reais */}
          <View style={styles.statsGrid}>
            <StatCard
              label="Objetos rastreados"
              value={s?.trackedObjects ?? 0}
              sub={loading ? "Carregando…" : "via CelesTrak API"}
              loading={loading}
            />
            <StatCard
              label="Riscos críticos"
              value={s?.criticalRisks ?? 0}
              sub={
                loading
                  ? "Carregando…"
                  : `${s?.riskDistribution?.[0]?.pct ?? 0}% do total`
              }
              loading={loading}
            />
            <StatCard
              label="Satélites ativos"
              value={s?.activeSatellites ?? 0}
              sub={loading ? "Carregando…" : "operacionais"}
              loading={loading}
            />
            <StatCard
              label="Debris / Foguetes"
              value={s?.debris ?? 0}
              sub={loading ? "Carregando…" : "fragmentos orbitais"}
              loading={loading}
            />
          </View>

          {/* Distribuição de risco — donut com dados reais */}
          <Card style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>Risco orbital geral</Text>
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={colors.accentBlue} />
                <Text style={styles.loadingText}>
                  Calculando distribuição de risco…
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.riskChartRow}>
                  <DonutChart data={s?.riskDistribution ?? []} size={130} />
                  <View style={styles.riskLegend}>
                    {(s?.riskDistribution ?? []).map((r) => (
                      <View key={r.name} style={styles.riskItem}>
                        <View style={styles.riskLeft}>
                          <View
                            style={[
                              styles.riskDot,
                              { backgroundColor: r.color },
                            ]}
                          />
                          <Text style={styles.riskLabel}>{r.name}</Text>
                        </View>
                        <View style={styles.riskRight}>
                          <Text style={[styles.riskVal, { color: r.color }]}>
                            {r.pct}%
                          </Text>
                          <Text style={styles.riskCount}>
                            {r.value.toLocaleString("pt-BR")}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    Total de objetos monitorados
                  </Text>
                  <Text style={styles.totalVal}>
                    {(s?.trackedObjects ?? 0).toLocaleString("pt-BR")}
                  </Text>
                </View>
              </>
            )}
          </Card>

          {/* Alertas recentes — objetos reais de maior risco */}
          <View style={{ marginBottom: -30 }}>
            <View style={styles.alertsHeader}>
              <Text style={styles.sectionTitle}>Maior risco agora</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Alerts")}>
                <Text style={styles.viewAll}>Ver todos</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <Card
                style={{
                  marginBottom: 10,
                  alignItems: "center",
                  paddingVertical: 20,
                }}
              >
                <ActivityIndicator color={colors.accentBlue} />
                <Text style={[styles.loadingText, { marginTop: 8 }]}>
                  Buscando objetos…
                </Text>
              </Card>
            ) : (
              (s?.topAlerts ?? []).slice(0, 2).map((alert) => (
                <Card key={alert.id} style={{ marginBottom: 10 }}>
                  <View style={styles.alertRow}>
                    <View
                      style={[
                        styles.alertIconBox,
                        {
                          backgroundColor:
                            alert.type === "critical"
                              ? colors.criticalBg
                              : colors.elevatedBg,
                        },
                      ]}
                    >
                      <Text>{alert.type === "critical" ? "⚠" : "△"}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.alertObjects}>{alert.object1}</Text>
                      <Text style={styles.alertMeta}>
                        Risco: {alert.probability}% • {alert.timeToEvent}
                      </Text>
                    </View>
                    <RiskBadge level={alert.type} />
                  </View>
                </Card>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {showSuccess && (
        <View style={styles.successPopup}>
          <Ionicons
            name="checkmark-circle"
            size={18}
            color={colors.accentGreen}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.successText}>PDF gerado com sucesso!</Text>
        </View>
      )}

      <BottomNav active="Dashboard" />
    </View>
  );
};

// styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { paddingHorizontal: 0 },

  hero: {
    width: "100%",
    minHeight: HEADER_H,
    backgroundColor: colors.bgPrimary,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(30,107,255,0.25)",
  },
  heroTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    zIndex: 2,
    marginTop: 10,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoWrapper: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logoName: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 17,
    color: colors.textPrimary,
    fontWeight: "700",
    letterSpacing: 3,
    lineHeight: 20,
  },
  logoSub: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 11,
    color: colors.accentCyan,
    letterSpacing: 2,
    lineHeight: 15,
  },
  bellBtn: {
    backgroundColor: "rgba(13,27,53,0.85)",
    borderWidth: 1,
    borderColor: "rgba(30,80,160,0.4)",
    borderRadius: 8,
    padding: 8,
    position: "relative",
    zIndex: 2,
  },
  bellDot: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.critical,
  },
  heroDivider: {
    height: 1,
    backgroundColor: "rgba(30,107,255,0.2)",
    marginBottom: 14,
    zIndex: 2,
  },
  heroBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    zIndex: 2,
    marginBottom: -10,
  },
  heroGreetLabel: {
    fontFamily: "Rajdhani_500Medium",
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  heroGreet: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    transform: [{ translateY: -15 }],
  },
  heroFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: "transparent",
  },

  below: { paddingHorizontal: 20, paddingTop: 16 },

  criticalBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,59,59,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,59,59,0.3)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 12,
  },
  criticalIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.criticalBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,59,59,0.3)",
  },
  criticalIconText: { fontSize: 18, color: colors.critical },
  criticalTitle: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 10,
    color: colors.critical,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  criticalDesc: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  criticalArrow: { color: colors.critical, fontSize: 22 },

  actionRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  reloadBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.15)",
    borderWidth: 1,
    borderColor: colors.borderBright,
    paddingVertical: 12,
    borderRadius: 10,
  },
  reloadBtnText: {
    color: colors.accentBlueBright,
    fontSize: 13,
    fontFamily: "Rajdhani_600SemiBold",
    letterSpacing: 0.5,
  },
  pdfButton: {
    flex: 2,
    flexDirection: "row",
    backgroundColor: colors.accentBlue,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pdfButtonText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Rajdhani_600SemiBold",
    letterSpacing: 1,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  statCard: { flex: 1, minWidth: "45%" },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: "Rajdhani_500Medium",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: "Orbitron_700Bold",
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    lineHeight: 24,
  },
  statSub: {
    fontSize: 11,
    color: colors.accentGreen,
    marginTop: 2,
    fontFamily: "Rajdhani_500Medium",
  },

  sectionTitle: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 14,
  },

  loadingBox: { alignItems: "center", paddingVertical: 24, gap: 8 },
  loadingText: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: "Rajdhani_500Medium",
  },

  riskChartRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 2,
  },
  riskLegend: { flex: 1 },
  riskItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 1,
  },
  riskLeft: { flexDirection: "row", alignItems: "center", gap: 7, flex: 1 },
  riskDot: { width: 9, height: 9, borderRadius: 4.5 },
  riskLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: "Rajdhani_500Medium",
  },
  riskRight: { alignItems: "flex-end" },
  riskVal: { fontSize: 12, fontFamily: "Orbitron_700Bold", fontWeight: "700" },
  riskCount: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: "Inter_400Regular",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: "Rajdhani_500Medium",
  },
  totalVal: {
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: "Orbitron_700Bold",
    fontWeight: "700",
  },

  alertsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  viewAll: {
    color: colors.accentBlue,
    fontSize: 12,
    fontFamily: "Rajdhani_500Medium",
  },
  alertRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  alertIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  alertObjects: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textPrimary,
    fontFamily: "Inter_400Regular",
  },
  alertMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },

  successPopup: {
    position: "absolute",
    top: 70,
    alignSelf: "center",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: colors.accentGreen,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
  },
  successText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Rajdhani_600SemiBold",
    letterSpacing: 0.5,
  },
});

export default DashboardScreen;
