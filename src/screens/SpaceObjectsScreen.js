import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Card } from "../components/UI";
import { colors } from "../styles/theme";
import BottomNav from "../components/BottomNav";
import { fetchSpaceObjects } from "../services/celestrakService";

// CATEGORIAS
const CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "satellite", label: "Satélites" },
  { id: "starlink", label: "Starlink" },
  { id: "iss", label: "ISS" },
  { id: "payload", label: "Payloads" },
  { id: "rocket_body", label: "Foguetes" },
];

// NORMALIZAÇÃO
const normalize = (obj) => ({
  ...obj,
  name: (obj.name || obj.OBJECT_NAME || "").toUpperCase(),
  type: (obj.objectType || obj.OBJECT_TYPE || "").toUpperCase(),
  noradId: obj.noradId || obj.NORAD_CAT_ID || "",
});

// CLASSIFICAÇÃO REAL
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

// RISCO DE COLISÃO (UI ESTIMADO)
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

// FILTRO CATEGORIA
const filterByCategory = (obj, category) => {
  const type = getCategoryType(obj);

  switch (category) {
    case "satellite":
      return type === "satellite" || type === "payload";

    case "starlink":
      return type === "starlink";

    case "iss":
      return type === "iss";

    case "payload":
      return type === "payload";

    case "rocket_body":
      return type === "rocket_body";

    default:
      return true;
  }
};

export default function SpaceObjectsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [objects, setObjects] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  // LOAD
  const load = useCallback(async () => {
    setLoading(true);

    try {
      const data = await fetchSpaceObjects();

      const normalized = data.map((obj) => {
        const n = normalize(obj);
        return {
          ...n,
          collisionRisk: calculateCollisionRisk(n),
        };
      });

      setObjects(normalized);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  // FILTRO
  useEffect(() => {
    let result = objects.filter((o) => filterByCategory(o, category));

    if (search.trim()) {
      const q = search.toLowerCase();

      result = result.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          String(o.noradId).includes(q) ||
          o.type.toLowerCase().includes(q),
      );
    }

    setFiltered(result);
  }, [objects, category, search]);

  const handleSelect = (obj) => {
    navigation.navigate("SpaceObjectDetail", { object: obj });
  };

  // UI
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentCyan}
          />
        }
      >
        <Text style={styles.title}>Objetos Espaciais</Text>

        {/* SEARCH */}
        <TextInput
          style={styles.search}
          placeholder="Buscar objeto..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        {/* CATEGORIES */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setCategory(c.id)}
              style={[styles.chip, category === c.id && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  category === c.id && styles.chipTextActive,
                ]}
              >
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* LIST */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#ababab" margin={20} />

            <Text style={[styles.loadingTitle, { color: "#ababab" }]}>
              Carregando dados da API CelesTrak...
            </Text>

            <Text style={[styles.loadingSub, { color: "#ababab" }]}>
              Sincronizando objetos orbitais em tempo real
            </Text>
          </View>
        ) : (
          <>
            {filtered.length === 0 ? (
              <Text style={styles.empty}>Nenhum objeto encontrado</Text>
            ) : (
              filtered.map((obj) => {
                const riskColor =
                  obj.collisionRisk > 6
                    ? "#ff4d4d"
                    : obj.collisionRisk > 3
                      ? "#ffb020"
                      : "#2ee59d";

                return (
                  <Card
                    key={obj.noradId + obj.name}
                    style={styles.card}
                    onPress={() => handleSelect(obj)}
                  >
                    <View style={styles.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{obj.name}</Text>

                        <Text style={styles.meta}>
                          Tipo: {getCategoryType(obj)}
                        </Text>

                        <Text style={styles.meta}>NORAD: {obj.noradId}</Text>

                        {/* 🔥 RISCO */}
                        <Text
                          style={{
                            marginTop: 6,
                            color: riskColor,
                            fontWeight: "700",
                            fontSize: 12,
                          }}
                        >
                          Risco de colisão: {obj.collisionRisk}%
                        </Text>
                      </View>

                      {/* SETA */}
                      <Svg
                        width={18}
                        height={18}
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <Path
                          d="M9 18l6-6-6-6"
                          stroke={colors.textMuted}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </View>
                  </Card>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      <BottomNav active="Alerts" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },

  content: {
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 22,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: 12,
  },

  search: {
    backgroundColor: colors.bgCard,
    padding: 10,
    borderRadius: 8,
    color: colors.textPrimary,
    marginBottom: 12,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    marginRight: 8,
  },

  chipActive: {
    backgroundColor: colors.accentBlue,
  },

  chipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  chipTextActive: {
    color: "#fff",
  },

  card: {
    marginTop: 10,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  name: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  meta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },

  empty: {
    marginTop: 20,
    textAlign: "center",
    color: colors.textMuted,
  },
});
