import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  ScrollView,
  Animated,
} from "react-native";
import { GLView } from "expo-gl";
import { Renderer, TextureLoader } from "expo-three";
import * as THREE from "three";
import BottomNav from "../components/BottomNav";
import { fetchSpaceObjects } from "../services/celestrakService";
import { colors, riskLabels } from "../styles/theme";

// Cores dos satélites (espelha o theme)
const SAT_COLORS = {
  low: 0x38bdf8,
  moderate: 0x3b82f6,
  elevated: 0xf59e0b,
  critical: 0xef4444,
  debris: 0xcc66ff,
};

const RISK_HEX = {
  low: "#38BDF8",
  moderate: "#3B82F6",
  elevated: "#F59E0B",
  critical: "#EF4444",
};

// Texturas públicas
const TEX_URLS = {
  day: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg",
  night:
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_lights_2048.png",
  specular:
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg",
  clouds:
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png",
};

// Converte altitude km → raio de órbita na cena (Terra = raio 1.0)
const altToRadius = (altKm) => {
  const alt = parseInt(altKm) || 400;
  // LEO ~400km → r=2.0, MEO ~20000km → r=5.0
  return 1.0 + 1.0 + (alt / 42164) * 4.0;
};

// Cena Three.js
async function buildScene(gl, satellites, onSatSelect) {
  const renderer = new Renderer({ gl });
  renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
  renderer.setClearColor(0x000510, 1);

  const camera = new THREE.PerspectiveCamera(
    45,
    gl.drawingBufferWidth / gl.drawingBufferHeight,
    0.1,
    200,
  );
  camera.position.set(0, 1.2, 7.0);
  camera.lookAt(0, 0, 0);

  const scene = new THREE.Scene();

  // Estrelas
  {
    const positions = [];
    for (let i = 0; i < 2500; i++) {
      const r = 80 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    scene.add(
      new THREE.Points(
        geo,
        new THREE.PointsMaterial({
          color: 0xffffff,
          size: 0.18,
          sizeAttenuation: true,
        }),
      ),
    );
  }

  // Iluminação
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const sun = new THREE.DirectionalLight(0xfffbf0, 2.2);
  sun.position.set(8, 4, 6);
  scene.add(sun);
  const fill = new THREE.PointLight(0x1144ff, 0.2);
  fill.position.set(-10, -5, -10);
  scene.add(fill);

  // ── Terra ──
  const earthGroup = new THREE.Group();
  earthGroup.position.y = 0.2;
  scene.add(earthGroup);

  const texLoader = new TextureLoader();
  const [dayMap, nightMap, specMap, cloudMap] = await Promise.all([
    texLoader.loadAsync(TEX_URLS.day),
    texLoader.loadAsync(TEX_URLS.night),
    texLoader.loadAsync(TEX_URLS.specular),
    texLoader.loadAsync(TEX_URLS.clouds),
  ]);

  earthGroup.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 64, 64),
      new THREE.MeshPhongMaterial({
        map: dayMap,
        specularMap: specMap,
        specular: new THREE.Color(0x333333),
        shininess: 15,
        emissiveMap: nightMap,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.6,
      }),
    ),
  );

  const cloudMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.515, 64, 64),
    new THREE.MeshStandardMaterial({
      map: cloudMap,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    }),
  );
  earthGroup.add(cloudMesh);

  earthGroup.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(1.06, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0x1a6aff,
        transparent: true,
        opacity: 0.12,
        side: THREE.FrontSide,
        depthWrite: false,
      }),
    ),
  );

  // Satélites reais
  const satAnims = [];
  const satMeshMap = {}; // noradId → { mesh, data }
  const orbitGroups = {};

  // Agrupa órbitas por altitude aproximada para reutilizar anéis
  const ringCache = {};

  for (const sat of satellites) {
    const radius = altToRadius(sat.altitude);
    const color =
      sat.status === "DEBRIS"
        ? SAT_COLORS.debris
        : SAT_COLORS[sat.riskLevel] || SAT_COLORS.low;

    // Anel de órbita (compartilhado por altitude similar, arredondado a 0.25)
    const ringKey = (Math.round(radius * 4) / 4).toFixed(2);
    if (!ringCache[ringKey]) {
      const tilt = (Math.random() - 0.5) * 2.0;
      const tiltAxis = Math.random() > 0.5 ? "x" : "z";
      const orbitGroup = new THREE.Group();
      if (tiltAxis === "x") orbitGroup.rotation.x = tilt;
      else orbitGroup.rotation.z = tilt;
      scene.add(orbitGroup);

      const pts = [];
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2;
        pts.push(
          new THREE.Vector3(
            Math.cos(a) * parseFloat(ringKey),
            0,
            Math.sin(a) * parseFloat(ringKey),
          ),
        );
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const opacity = sat.riskLevel === "critical" ? 0.3 : 0.15;
      orbitGroup.add(
        new THREE.LineLoop(
          ringGeo,
          new THREE.LineBasicMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity,
          }),
        ),
      );

      ringCache[ringKey] = { group: orbitGroup, tilt, tiltAxis };
    }

    const orbitGroup = ringCache[ringKey].group;
    const size =
      sat.riskLevel === "critical"
        ? 0.06
        : sat.status === "DEBRIS"
          ? 0.035
          : 0.045;

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(size, 8, 8),
      new THREE.MeshBasicMaterial({ color }),
    );
    orbitGroup.add(mesh);

    const initAngle = Math.random() * Math.PI * 2;
    const speed = 0.05 + Math.random() * 0.4; // velocidade visual proporcional
    satAnims.push({
      mesh,
      radius: parseFloat(ringKey),
      speed,
      angle: initAngle,
      sat,
    });
    satMeshMap[sat.noradId] = { mesh, sat };
  }

  // Raycaster para toque
  const raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = 0.1;

  // Loop de animação
  let running = true;
  let lastTime = performance.now();
  let selectedId = null;

  function animate() {
    if (!running) return;
    requestAnimationFrame(animate);

    const now = performance.now();
    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    earthGroup.rotation.y += delta * 0.05;
    cloudMesh.rotation.y += delta * 0.025;

    for (const s of satAnims) {
      s.angle += delta * s.speed;
      s.mesh.position.set(
        Math.cos(s.angle) * s.radius,
        0,
        Math.sin(s.angle) * s.radius,
      );

      // Pulso visual nos críticos
      if (s.sat.riskLevel === "critical") {
        const pulse = 0.9 + 0.1 * Math.sin(now * 0.005);
        s.mesh.scale.setScalar(pulse);
      }
    }

    renderer.render(scene, camera);
    gl.endFrameEXP();
  }

  animate();

  return {
    stopAnimation: () => {
      running = false;
    },
    onDrag: (dx, dy) => {
      earthGroup.rotation.y += dx * 0.004;
      for (const key in ringCache) {
        ringCache[key].group.rotation.y += dx * 0.004;
      }
      // Leve inclinação vertical
      camera.position.y = Math.max(
        -2,
        Math.min(4, camera.position.y + dy * 0.01),
      );
      camera.lookAt(0, 0, 0);
    },
    onZoom: (scale) => {
      const z = camera.position.z;
      camera.position.z = Math.max(3.5, Math.min(12, z / scale));
    },
    onTap: (normX, normY, width, height) => {
      // Converte toque em coordenadas NDC
      const ndc = new THREE.Vector2(
        (normX / width) * 2 - 1,
        -(normY / height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      const meshes = satAnims.map((s) => s.mesh);
      const hits = raycaster.intersectObjects(meshes);
      if (hits.length > 0) {
        const hitMesh = hits[0].object;
        const found = satAnims.find((s) => s.mesh === hitMesh);
        if (found) {
          // Highlight
          for (const s of satAnims) {
            s.mesh.scale.setScalar(
              s.sat.noradId === found.sat.noradId ? 2.0 : 1.0,
            );
          }
          onSatSelect(found.sat);
          return true;
        }
      }
      onSatSelect(null);
      return false;
    },
    getSatCount: () => satAnims.length,
  };
}

// Componente Principal
const OrbitalMapScreen = () => {
  const sceneRef = useRef(null);
  const glSizeRef = useRef({ width: 1, height: 1 });
  const [satellites, setSatellites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [sceneReady, setSceneReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Carrega satélites
  const loadSatellites = useCallback(async () => {
    setLoading(true);
    const data = await fetchSpaceObjects("active");
    setSatellites(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSatellites();
  }, []);

  // Anima painel ao selecionar
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: selected ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [selected]);

  // Contexto GL
  const handleContextCreate = useCallback(
    async (gl) => {
      if (satellites.length === 0) return;

      try {
        sceneRef.current = await buildScene(gl, satellites, setSelected);

        setSceneReady(true);
      } catch (e) {
        console.error("OrbitalMap buildScene error:", e);
      }
    },
    [satellites],
  );

  useEffect(() => {
    return () => sceneRef.current?.stopAnimation();
  }, []);

  // PanResponder
  let lastPinchDist = null;
  let tapStart = null;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
      onPanResponderGrant: (e) => {
        tapStart = {
          x: e.nativeEvent.locationX,
          y: e.nativeEvent.locationY,
          time: Date.now(),
        };
      },
      onPanResponderMove: (e, g) => {
        if (e.nativeEvent.touches.length === 2) {
          // Pinça
          const t = e.nativeEvent.touches;
          const dx = t[0].locationX - t[1].locationX;
          const dy = t[0].locationY - t[1].locationY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (lastPinchDist) {
            const scale = dist / lastPinchDist;
            sceneRef.current?.onZoom(scale);
          }
          lastPinchDist = dist;
        } else {
          lastPinchDist = null;
          sceneRef.current?.onDrag(g.dx, g.dy);
        }
      },
      onPanResponderRelease: (e, g) => {
        lastPinchDist = null;
        // Detecta toque simples (pouco movimento, rápido)
        const totalMove = Math.abs(g.dx) + Math.abs(g.dy);
        const elapsed = Date.now() - (tapStart?.time || 0);
        if (totalMove < 8 && elapsed < 300 && tapStart) {
          sceneRef.current?.onTap(
            tapStart.x,
            tapStart.y,
            glSizeRef.current.width,
            glSizeRef.current.height,
          );
        }
        tapStart = null;
      },
    }),
  ).current;

  return (
    <View style={styles.container}>
      {/* Canvas 3D */}
      <View
        style={styles.canvasContainer}
        {...panResponder.panHandlers}
        onLayout={(e) => {
          glSizeRef.current = {
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          };
        }}
      >
        {satellites.length > 0 && (
          <GLView
            style={StyleSheet.absoluteFill}
            onContextCreate={handleContextCreate}
          />
        )}
      </View>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text style={styles.loadingText}>Carregando objetos orbitais…</Text>
        </View>
      )}

      {/* Header / controles superiores */}
      <View style={styles.topControls}>
        <View style={styles.topLeft}>
          <Text style={styles.titleText}>Mapa Orbital</Text>
          <Text style={styles.countText}>
            {satellites.length} objetos rastreados
          </Text>
        </View>
        <TouchableOpacity style={styles.reloadBtn} onPress={loadSatellites}>
          <Text style={styles.iconText}>⟳</Text>
        </TouchableOpacity>
      </View>

      {/* Painel de detalhes do satélite selecionado */}
      {selected && (
        <Animated.View style={[styles.detailPanel, { opacity: fadeAnim }]}>
          <View style={styles.detailHeader}>
            <View
              style={[
                styles.riskBadge,
                {
                  backgroundColor: RISK_HEX[selected.riskLevel] + "22",
                  borderColor: RISK_HEX[selected.riskLevel] + "55",
                },
              ]}
            >
              <Text
                style={[
                  styles.riskBadgeText,
                  { color: RISK_HEX[selected.riskLevel] },
                ]}
              >
                {riskLabels[selected.riskLevel] ||
                  selected.riskLevel?.toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelected(null)}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.detailName}>{selected.name}</Text>
          <Text style={styles.detailSub}>
            {selected.satelliteType} · {selected.operator}
          </Text>

          <View style={styles.detailGrid}>
            <DetailItem label="Altitude" value={selected.altitude} />
            <DetailItem label="Velocidade" value={selected.velocity} />
            <DetailItem label="Inclinação" value={selected.inclination} />
            <DetailItem label="Período" value={selected.period} />
            <DetailItem label="País" value={selected.country} />
            <DetailItem label="NORAD ID" value={selected.noradId} />
          </View>

          <View style={styles.riskBar}>
            <Text style={styles.riskBarLabel}>Risco de colisão</Text>
            <View style={styles.riskBarTrack}>
              <View
                style={[
                  styles.riskBarFill,
                  {
                    width: `${Math.min((selected.collisionRisk / 8) * 100, 100)}%`,
                    backgroundColor: RISK_HEX[selected.riskLevel],
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.riskBarValue,
                { color: RISK_HEX[selected.riskLevel] },
              ]}
            >
              {selected.collisionRisk?.toFixed(1)}/8
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Legenda compacta (só aparece quando nenhum satélite selecionado) */}
      <View style={styles.legend}>
        {[
          { color: "#38BDF8", label: "Baixo" },
          { color: "#3B82F6", label: "Moderado" },
          { color: "#F59E0B", label: "Elevado" },
          { color: "#EF4444", label: "Crítico" },
          { color: "#CC66FF", label: "Debris" },
        ].map((item, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <BottomNav active="Map" />
    </View>
  );
};

// Sub-componente: item de detalhe
const DetailItem = ({ label, value }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailItemLabel}>{label}</Text>
    <Text style={styles.detailItemValue}>{value}</Text>
  </View>
);

// styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000510" },
  canvasContainer: { flex: 1 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,5,16,0.85)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "500",
  },

  // Header
  topControls: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 40,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  topLeft: { gap: 2 },
  titleText: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginTop: 20,
  },
  countText: { color: "#60A5FA", fontSize: 12, fontWeight: "500" },
  reloadBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
  },
  iconText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    fontWeight: "600",
    marginTop: -2,
  },

  // Painel de detalhes
  detailPanel: {
    position: "absolute",
    bottom: 80,
    left: 12,
    right: 12,
    backgroundColor: "rgba(11,20,45,0.95)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.20)",
    padding: 16,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  riskBadgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { color: "rgba(255,255,255,0.5)", fontSize: 14 },

  detailName: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  detailSub: { color: "#94A3B8", fontSize: 12, marginBottom: 12 },

  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  detailItem: { width: "30%" },
  detailItemLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 2,
  },
  detailItemValue: { color: "#CBD5E1", fontSize: 12, fontWeight: "600" },

  riskBar: { gap: 4 },
  riskBarLabel: { color: "#64748B", fontSize: 11, fontWeight: "600" },
  riskBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  riskBarFill: { height: "100%", borderRadius: 3 },
  riskBarValue: { fontSize: 11, fontWeight: "700", alignSelf: "flex-end" },

  // Legenda
  legend: {
    position: "absolute",
    bottom: 90,
    left: 12,
    right: 12,

    flexDirection: "row",
    justifyContent: "space-around",

    backgroundColor: "rgba(0,5,20,0.75)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(68,136,255,0.15)",

    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 4.5 },
  legendLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontWeight: "500",
  },
});

export default OrbitalMapScreen;
