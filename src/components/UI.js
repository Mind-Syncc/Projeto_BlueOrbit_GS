import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import Svg, { Path, Circle, Polyline, Line, Rect } from "react-native-svg";
import { colors, riskColors, riskBg, riskLabels } from "../styles/theme";

// RiskBadge
export const RiskBadge = ({ level }) => (
  <View
    style={[
      styles.badge,
      { backgroundColor: riskBg[level], borderColor: riskColors[level] + "40" },
    ]}
  >
    <Text style={[styles.badgeText, { color: riskColors[level] }]}>
      {riskLabels[level]}
    </Text>
  </View>
);

// StatusBadge
export const StatusBadge = ({ status }) => {
  const map = {
    Aberta: { color: colors.critical, bg: colors.criticalBg },
    Monitorando: { color: colors.elevated, bg: colors.elevatedBg },
    Resolvida: { color: colors.accentGreen, bg: colors.lowBg },
    Encerrada: { color: colors.textSecondary, bg: "rgba(139,160,204,0.1)" },
  };
  const s = map[status] || map["Encerrada"];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: s.bg, borderColor: s.color + "30" },
      ]}
    >
      <Text style={[styles.badgeText, { color: s.color }]}>{status}</Text>
    </View>
  );
};

// Card
export const Card = ({ children, style, onPress }) => {
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={[styles.card, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
};

// Button (primary + secondary)
export const Button = ({
  title,
  children,
  onPress,
  disabled,
  style,
  variant,
}) => {
  const label = title || children;
  if (variant === "secondary") {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[styles.secondaryBtn, style]}
      >
        <Text
          style={[
            styles.secondaryBtnText,
            style?.color ? { color: style.color } : null,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[styles.primaryBtn, disabled && { opacity: 0.5 }, style]}
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
};

// Input
export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  extra,
  type,
}) => {
  // type prop from web version is ignored; use secureTextEntry
  return (
    <View style={{ marginBottom: 16 }}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View style={styles.inputWrapper}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          style={styles.input}
          autoCapitalize="none"
          keyboardType={type === "email" ? "email-address" : "default"}
        />
        {extra}
      </View>
    </View>
  );
};

// FormInput (alias for Input)
export const FormInput = Input;

// SectionHeader
export const SectionHeader = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

// RiskIcon (triangle SVG)
export const RiskIcon = ({ type, size = 20 }) => {
  const color = riskColors[type] || colors.accentGreen;
  const h = size;
  const w = size;
  const pts = `${w / 2},2 ${w - 2},${h - 2} 2,${h - 2}`;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Path
        d={`M${w / 2} 2 L${w - 2} ${h - 2} L2 ${h - 2} Z`}
        fill={color + "25"}
        stroke={color}
        strokeWidth={1.5}
      />
      <Line
        x1={w / 2}
        y1={h * 0.35}
        x2={w / 2}
        y2={h * 0.62}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Circle cx={w / 2} cy={h * 0.76} r={1.2} fill={color} />
    </Svg>
  );
};

// PrimaryButton / SecondaryButton
export const PrimaryButton = ({ title, onPress, disabled, style }) => (
  <Button title={title} onPress={onPress} disabled={disabled} style={style} />
);

export const SecondaryButton = ({ title, onPress, style, textStyle }) => (
  <Button title={title} onPress={onPress} variant="secondary" style={style} />
);

// Styles
const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    fontFamily: "Orbitron_700Bold",
  },
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 16,
  },
  primaryBtn: {
    backgroundColor: colors.accentBlue,
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: colors.accentBlue,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.5,
    fontFamily: "Rajdhani_700Bold",
  },
  secondaryBtn: {
    backgroundColor: "transparent",
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderBright,
  },
  secondaryBtnText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.5,
    fontFamily: "Rajdhani_700Bold",
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
    fontFamily: "Rajdhani_600SemiBold",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  sectionHeader: {
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 10,
    fontFamily: "Rajdhani_600SemiBold",
  },
});
