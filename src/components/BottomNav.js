import React from "react";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Svg, { Path, Circle } from "react-native-svg";
import { colors } from "../styles/theme";

const NAV_ITEMS = [
  {
    id: "Dashboard",
    label: "Início",
    screen: "Dashboard",

    icon: (active) => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 9L12 2L21 9V20C21 20.53 20.79 21.04 20.41 21.41C20.04 21.79 19.53 22 19 22H5C4.47 22 3.96 21.79 3.59 21.41C3.21 21.04 3 20.53 3 20V9Z"
          stroke={active ? "#1E6BFF" : "#4A5E80"}
          strokeWidth="1.5"
          fill={active ? "rgba(30,107,255,0.15)" : "none"}
        />
        <Path
          d="M9 22V12H15V22"
          stroke={active ? "#1E6BFF" : "#4A5E80"}
          strokeWidth="1.5"
        />
      </Svg>
    ),
  },

  {
    id: "OrbitalMap",
    label: "Mapa",
    screen: "OrbitalMap",

    icon: (active) => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Circle
          cx="12"
          cy="12"
          r="9"
          stroke={active ? "#1E6BFF" : "#4A5E80"}
          strokeWidth="1.5"
          fill={active ? "rgba(30,107,255,0.15)" : "none"}
        />

        <Path
          d="M12 3C12 3 8 8 8 12C8 16 12 21 12 21"
          stroke={active ? "#1E6BFF" : "#4A5E80"}
          strokeWidth="1.5"
        />

        <Path
          d="M12 3C12 3 16 8 16 12C16 16 12 21 12 21"
          stroke={active ? "#1E6BFF" : "#4A5E80"}
          strokeWidth="1.5"
        />

        <Path
          d="M3 12H21"
          stroke={active ? "#1E6BFF" : "#4A5E80"}
          strokeWidth="1.5"
        />
      </Svg>
    ),
  },

  {
    id: "Alerts",
    label: "Alertas",
    screen: "Alerts",

    icon: (active) => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        {/* corpo do satélite */}
        <Circle
          cx="12"
          cy="12"
          r="2.5"
          stroke={active ? "#1E6BFF" : "#4A5E80"}
          strokeWidth="1.5"
          fill={active ? "rgba(30,107,255,0.15)" : "none"}
        />

        {/* antenas */}
        <Path
          d="M12 2V6"
          stroke={active ? "#1E6BFF" : "#4A5E80"}
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        <Path
          d="M12 18V22"
          stroke={active ? "#1E6BFF" : "#4A5E80"}
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        <Path
          d="M2 12H6"
          stroke={active ? "#1E6BFF" : "#4A5E80"}
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        <Path
          d="M18 12H22"
          stroke={active ? "#1E6BFF" : "#4A5E80"}
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* órbita */}
        <Circle
          cx="12"
          cy="12"
          r="8"
          stroke={active ? "#1E6BFF" : "#4A5E80"}
          strokeWidth="1.2"
          opacity="0.6"
        />
      </Svg>
    ),
  },

  {
    id: "Occurrences",
    label: "Ocorrencias",
    screen: "Occurrences",

    icon: (active) => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M14 2H6C5.47 2 4.96 2.21 4.59 2.59C4.21 2.96 4 3.47 4 4V20C4 20.53 4.21 21.04 4.59 21.41C4.96 21.79 5.47 22 6 22H18C18.53 22 19.04 21.79 19.41 21.41C19.79 21.04 20 20.53 20 20V8L14 2Z"
          stroke={active ? "#1E6BFF" : "#4A5E80"}
          strokeWidth="1.5"
          fill={active ? "rgba(30,107,255,0.15)" : "none"}
        />
      </Svg>
    ),
  },

  {
    id: "Profile",
    label: "Perfil",
    screen: "Profile",

    icon: (active) => (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M20 21V19A4 4 0 0 0 16 15H8A4 4 0 0 0 4 19V21"
          stroke={active ? "#1E6BFF" : "#4A5E80"}
          strokeWidth="1.5"
        />

        <Circle
          cx="12"
          cy="7"
          r="4"
          stroke={active ? "#1E6BFF" : "#4A5E80"}
          strokeWidth="1.5"
          fill={active ? "rgba(30,107,255,0.15)" : "none"}
        />
      </Svg>
    ),
  },
];

const BottomNav = ({ active }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.nav, { paddingBottom: insets.bottom || 8 }]}>
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.id;

        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => navigation.navigate(item.screen)}
            style={styles.navItem}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              {item.icon(isActive)}

              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </View>

            <Text style={[styles.label, isActive && styles.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  nav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 30,
    flexDirection: "row",
    backgroundColor: "rgba(10, 22, 40, 0.98)",
    borderTopWidth: 1,
    borderTopColor: "rgba(30, 80, 160, 0.3)",
    paddingTop: 8,
    paddingHorizontal: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },

  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },

  iconWrap: {
    position: "relative",
  },

  badge: {
    position: "absolute",
    top: -2,
    right: -6,
    backgroundColor: "#FF3B3B",
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },

  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },

  label: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.3,
    color: colors.textMuted,
    marginTop: 3,
  },

  labelActive: {
    color: colors.accentBlue,
  },
});

export default BottomNav;
