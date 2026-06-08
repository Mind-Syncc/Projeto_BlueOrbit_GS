import React, { useEffect, useState, useRef, useCallback } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Animated,
  Keyboard,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import {
  createOccurrence,
  getOccurrences,
} from "../firebase/databaseService";

import { fetchSpaceObjects, FALLBACK_SATELLITES } from "../services/celestrakService";

import { Card, Button, StatusBadge } from "../components/UI";
import BottomNav from "../components/BottomNav";
import { colors } from "../styles/theme";
import { Ionicons } from '@expo/vector-icons';

// Constantes

const OCCURRENCE_TYPES = [
  "Aproximação crítica",
  "Fragmentação",
  "Satélite fora de órbita",
  "Comunicação perdida",
];

const ACTIONS = [
  "Monitoramento intensificado",
  "Manobra de desvio sugerida",
  "Alerta enviado a operadores",
  "Acionar protocolo de emergência",
];


// Mesmos limiares do SpaceObjectsScreen:
//   > 6  → vermelho  → "Aberta"
//   > 3  → amarelo   → "Monitorando"
//   ≤ 3  → verde     → "Resolvida"
const riskToStatus = (risk) => {
  const r = parseFloat(risk) || 0;
  if (r > 6) return "Aberta";
  if (r > 3) return "Monitorando";
  return null;
};

const riskColor = (risk) => {
  const r = parseFloat(risk) || 0;
  if (r > 6) return "#ff4d4d";
  if (r > 3) return "#ffb020";
  return "#2ee59d";
};

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
  let base = 0.5;
  switch (type) {
    case "iss":          base = 6 + Math.random() * 3; break;
    case "debris":       base = 3 + Math.random() * 4; break;
    case "starlink":     base = 2 + Math.random() * 3; break;
    case "rocket_body":  base = 1.5 + Math.random() * 2; break;
    case "payload":      base = 1 + Math.random() * 2; break;
    default:             base = 0.5 + Math.random() * 1.5;
  }
  return Number(base.toFixed(2));
};

// Componente principal

export default function OccurrencesScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // Tabs
  const [activeTab, setActiveTab] = useState("register");

  // Satélite selecionado (objeto completo)
  const [selectedSatellite, setSelectedSatellite] = useState(null);

  // Busca de satélites
  const [searchQuery, setSearchQuery]       = useState("");
  const [searchResults, setSearchResults]   = useState([]);
  const [allSatellites, setAllSatellites]   = useState([]);
  const [loadingSats, setLoadingSats]       = useState(false);
  const [showDropdown, setShowDropdown]     = useState(false);
  const searchInputRef = useRef(null);

  // Formulário
  const [selectedType,   setSelectedType]   = useState("Aproximação crítica");
  const [selectedAction, setSelectedAction] = useState("Monitoramento intensificado");
  const [description,    setDescription]    = useState("");
  const [notes,          setNotes]          = useState("");

  // Histórico
  const [occurrences,   setOccurrences]     = useState([]);
  const [historySearch, setHistorySearch]   = useState("");

  // Animação dropdown
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  // Carrega satélites na montagem
  useEffect(() => {
    loadAllSatellites();
    loadOccurrences();
  }, []);

  const loadAllSatellites = async () => {
    setLoadingSats(true);
    try {
      const data = await fetchSpaceObjects("active");
      const withRisk = (data.length > 0 ? data : FALLBACK_SATELLITES).map(obj => ({
        ...obj,
        collisionRisk: calculateCollisionRisk(obj),
      }));
      setAllSatellites(withRisk);
    } catch {
      setAllSatellites(FALLBACK_SATELLITES);
    } finally {
      setLoadingSats(false);
    }
  };

  // Filtra lista conforme o usuário digita
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      animateDropdown(false);
      return;
    }
    const results = allSatellites
      .filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.noradId.includes(q) ||
        s.operator.toLowerCase().includes(q)
      )
      .slice(0, 8);
    setSearchResults(results);
    animateDropdown(results.length > 0);
  }, [searchQuery, allSatellites]);

  const animateDropdown = (open) => {
    setShowDropdown(open);
    Animated.timing(dropdownAnim, {
      toValue: open ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const handleSelectSatellite = (sat) => {
    setSelectedSatellite(sat);
    setSearchQuery(sat.name);
    setSearchResults([]);
    animateDropdown(false);
    Keyboard.dismiss();
  };

  const handleClearSatellite = () => {
    setSelectedSatellite(null);
    setSearchQuery("");
    setSearchResults([]);
    animateDropdown(false);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  // ── Carrega histórico ──
  const loadOccurrences = async () => {
    const data = await getOccurrences();
    if (data.success) setOccurrences(data.data);
  };

  // Registrar ocorrência
  const handleRegisterOccurrence = async () => {
    if (!selectedSatellite) {
      Alert.alert("Atenção", "Selecione um satélite ou objeto para registrar a ocorrência.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Atenção", "Digite uma descrição da ocorrência.");
      return;
    }

    const occurrenceData = {
      satellite:      selectedSatellite.name,
      noradId:        selectedSatellite.noradId,
      operator:       selectedSatellite.operator,
      satelliteType:  selectedSatellite.satelliteType,
      altitude:       selectedSatellite.altitude,
      riskLevel:      selectedSatellite.riskLevel,
      type:           selectedType,
      action:         selectedAction,
      description,
      notes,
      createdAt:      new Date().toISOString(),
      status:         "Ativa",
    };

    const result = await createOccurrence(occurrenceData);

    if (result.success) {
      setOccurrences(prev => [{ id: result.id || Date.now().toString(), ...occurrenceData }, ...prev]);
      Alert.alert("Sucesso", "Ocorrência registrada com sucesso!");
      setDescription("");
      setNotes("");
      setSelectedSatellite(null);
      setSearchQuery("");
      setActiveTab("history");
    } else {
      Alert.alert("Erro", "Não foi possível registrar a ocorrência.");
    }
  };

  // Histórico filtrado
  const filteredOccurrences = occurrences.filter(item => {
    const text = `${item.satellite} ${item.type} ${item.description}`.toLowerCase();
    return text.includes(historySearch.toLowerCase());
  });

  // Render

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: 140 },
        ]}
        enableOnAndroid
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Ocorrências Orbitais</Text>

        {/* ── Tabs ── */}
        <View style={styles.tabsContainer}>
          {["register", "history"].map(tab => (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.8}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === "register" ? "Registrar" : "Histórico"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ═══════════════════════════ */}
        {/* ABA REGISTRO               */}
        {/* ═══════════════════════════ */}
        {activeTab === "register" && (
          <>
            {/* ── Busca de satélite ── */}
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>
              SATÉLITE / OBJETO
            </Text>

            <View style={styles.searchWrapper}>

              {/* Campo de busca */}
              <View style={[
                styles.searchBox,
                selectedSatellite && styles.searchBoxSelected,
              ]}>
                <Ionicons name="search-outline" size={20} color="#60A5FA" />
                <TextInput
                  ref={searchInputRef}
                  value={searchQuery}
                  onChangeText={(t) => {
                    setSearchQuery(t);
                    if (selectedSatellite) setSelectedSatellite(null);
                  }}
                  placeholder={loadingSats ? "Carregando satélites…" : "Buscar por nome ou NORAD ID…"}
                  placeholderTextColor={colors.textMuted}
                  style={styles.searchInput}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!loadingSats}
                />
                {loadingSats && (
                  <ActivityIndicator size="small" color={colors.accentBlue} />
                )}
                {selectedSatellite && (
                  <TouchableOpacity onPress={handleClearSatellite} style={styles.clearBtn}>
                    <Text style={styles.clearBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Card do satélite selecionado */}
              {selectedSatellite && (
                <View style={styles.selectedCard}>
                  <View style={styles.selectedCardLeft}>
                    <View style={[
                      styles.riskDot,
                      { backgroundColor: riskColor(selectedSatellite.collisionRisk) }
                    ]} />
                    <View>
                      <Text style={styles.selectedName}>{selectedSatellite.name}</Text>
                      <Text style={styles.selectedMeta}>
                        {selectedSatellite.operator} · {selectedSatellite.satelliteType}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.selectedCardRight}>
                    <View style={[
                      styles.riskBadge,
                      { backgroundColor: riskColor(selectedSatellite.collisionRisk) + "33" }
                    ]}>
                      <Text style={[
                        styles.riskBadgeText,
                        { color: riskColor(selectedSatellite.collisionRisk) }
                      ]}>
                        {`Risco: ${selectedSatellite.collisionRisk}%`}
                      </Text>
                    </View>
                    <Text style={styles.selectedAlt}>{selectedSatellite.altitude}</Text>
                  </View>
                </View>
              )}

              {/* Dropdown de resultados */}
              {showDropdown && (
                <Animated.View style={[
                  styles.dropdown,
                  {
                    maxHeight: dropdownAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 320],
                    }),
                    opacity: dropdownAnim,
                  },
                ]}>
                  {searchResults.map((sat, i) => (
                    <TouchableOpacity
                      key={sat.noradId}
                      onPress={() => handleSelectSatellite(sat)}
                      style={[
                        styles.dropdownItem,
                        i < searchResults.length - 1 && styles.dropdownItemBorder,
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.dropdownItemLeft}>
                        <View style={[
                          styles.riskDot,
                          { backgroundColor: riskColor(sat.collisionRisk) }
                        ]} />
                        <View>
                          <Text style={styles.dropdownName}>{sat.name}</Text>
                          <Text style={styles.dropdownMeta}>
                            {sat.operator} · {sat.altitude}
                          </Text>
                        </View>
                      </View>
                      <Text style={[
                        styles.dropdownRisk,
                        { color: riskColor(sat.collisionRisk) }
                      ]}>
                        {`${sat.collisionRisk}%`}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  {searchResults.length === 0 && searchQuery.length > 1 && (
                    <View style={styles.dropdownEmpty}>
                      <Text style={styles.dropdownEmptyText}>Nenhum objeto encontrado</Text>
                    </View>
                  )}
                </Animated.View>
              )}

            </View>

            {/* ── Tipo de ocorrência ── */}
            <Text style={styles.sectionLabel}>TIPO DE OCORRÊNCIA</Text>
            <Card style={{ marginBottom: 20 }}>
              {OCCURRENCE_TYPES.map((type, i) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSelectedType(type)}
                  style={[styles.listRow, i < OCCURRENCE_TYPES.length - 1 && styles.listRowBorder]}
                >
                  <Text style={styles.listRowText}>{type}</Text>
                  <View style={[styles.radio, selectedType === type && styles.radioActive]}>
                    {selectedType === type && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              ))}
            </Card>

            {/* ── Ação tomada ── */}
            <Text style={styles.sectionLabel}>AÇÃO TOMADA</Text>
            <Card style={{ marginBottom: 20 }}>
              {ACTIONS.map((action, i) => (
                <TouchableOpacity
                  key={action}
                  onPress={() => setSelectedAction(action)}
                  style={[styles.listRow, i < ACTIONS.length - 1 && styles.listRowBorder]}
                >
                  <Text style={styles.listRowText}>{action}</Text>
                  <View style={[styles.radio, selectedAction === action && styles.radioActive]}>
                    {selectedAction === action && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              ))}
            </Card>

            {/* ── Descrição ── */}
            <Text style={styles.sectionLabel}>DESCRIÇÃO</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={styles.textarea}
              placeholder="Descreva a ocorrência..."
              placeholderTextColor={colors.textMuted}
            />

            {/* ── Observações ── */}
            <Text style={styles.sectionLabel}>OBSERVAÇÕES</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              style={styles.textarea}
              placeholder="Observações adicionais..."
              placeholderTextColor={colors.textMuted}
            />

            <Button
              title="REGISTRAR OCORRÊNCIA"
              onPress={handleRegisterOccurrence}
              style={{ marginBottom: 95 }}
            />
          </>
        )}

        {/* ═══════════════════════════ */}
        {/* ABA HISTÓRICO              */}
        {/* ═══════════════════════════ */}
        {activeTab === "history" && (
          <>
            <TextInput
              value={historySearch}
              onChangeText={setHistorySearch}
              style={[styles.historySearchInput, { marginTop: 24 }]}
              placeholder="Buscar ocorrência..."
              placeholderTextColor={colors.textMuted}
            />

            {filteredOccurrences.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma ocorrência encontrada.</Text>
            ) : (
              filteredOccurrences.map((item, index) => (
                <Card
                  key={item.id || index}
                  style={{ marginBottom: index === filteredOccurrences.length - 1 ? 100 : 14 }}
                >
                  {/* Cabeçalho do card */}
                  <View style={styles.historyCardHeader}>
                    <Text style={styles.historyTitle}>{item.satellite}</Text>  
                  </View>

                  {/* Meta do satélite (só se veio do novo fluxo) */}
                  {item.operator && (
                    <Text style={styles.historyMeta}>
                      {item.operator}{item.altitude ? ` · ${item.altitude}` : ""}
                    </Text>
                  )}

                  <Text style={styles.historyType}>{item.type}</Text>
                  <Text style={styles.historyDescription}>{item.description}</Text>
                  <Text style={styles.historyAction}>Ação: {item.action}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(item.createdAt).toLocaleString("pt-BR")}
                  </Text>
                </Card>
              ))
            )}
          </>
        )}
      </KeyboardAwareScrollView>

      <BottomNav active="Occurrences" />
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.bgPrimary },
  content:     { paddingHorizontal: 20 },

  screenTitle: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 8,
  },

  // Tabs
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  tabButtonActive: { backgroundColor: colors.accentBlue },
  tabText: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: "Rajdhani_600SemiBold",
    letterSpacing: 0.5,
  },
  tabTextActive: { color: "#fff" },

  // Labels
  sectionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 10,
    fontFamily: "Rajdhani_600SemiBold",
    letterSpacing: 1,
  },

  // Busca de satélite
  searchWrapper:   { marginBottom: 20, zIndex: 10 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
  },
  searchBoxSelected: {
    borderColor: colors.accentBlue,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  searchIcon:  { fontSize: 14 },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: 10,
    fontFamily: "Rajdhani_500Medium",
  },
  clearBtn: {
    width: 24, height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtnText: { color: colors.textMuted, fontSize: 12 },

  // Card do selecionado
  selectedCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(59,130,246,0.08)",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.accentBlue,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selectedCardLeft:  { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  selectedCardRight: { alignItems: "flex-end", gap: 4 },
  selectedName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: "Rajdhani_600SemiBold",
  },
  selectedMeta:  { color: colors.textMuted, fontSize: 11 },
  selectedAlt:   { color: colors.textMuted, fontSize: 11 },

  dropdown: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.border,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  dropdownItemLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  dropdownName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: "Rajdhani_600SemiBold",
  },
  dropdownMeta:  { color: colors.textMuted, fontSize: 11 },
  dropdownRisk:  { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  dropdownEmpty: { padding: 16, alignItems: "center" },
  dropdownEmptyText: { color: colors.textMuted, fontSize: 13 },

  // Shared: dot + badge
  riskDot: {
    width: 8, height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  listRowBorder: {
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  listRowText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: "Rajdhani_500Medium",
  },
  radio: {
    width: 18, height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.borderBright,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: colors.accentBlue,
    backgroundColor: colors.accentBlue,
  },
  radioDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },

  // Textareas
  textarea: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    minHeight: 100,
    color: colors.textPrimary,
    marginBottom: 18,
    textAlignVertical: "top",
    fontFamily: "Rajdhani_500Medium",
    fontSize: 14,
  },

  // ── Histórico ──
  historySearchInput: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.textPrimary,
    marginBottom: 20,
  },
  historyCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  historyTitle: {
    color: colors.accentBlue,
    fontSize: 16,
    fontFamily: "Rajdhani_600SemiBold",
    flex: 1,
    marginRight: 8,
  },
  historyMeta: {
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: 6,
  },
  historyType: {
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 6,
  },
  historyDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 10,
  },
  historyAction: {
    color: colors.accentCyan,
    fontSize: 13,
    marginBottom: 6,
  },
  historyDate: {
    color: colors.textMuted,
    fontSize: 11,
  },

  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 40,
  },
});
