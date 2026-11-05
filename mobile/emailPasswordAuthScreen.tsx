import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { TactilePressable as Pressable } from "./tactilePressable";
import { palette } from "./designTokens";

type Props = {
  busy: boolean;
  status: string;
  onSubmit: (mode: "login" | "register", email: string, password: string, displayName: string) => void;
};

export function EmailPasswordAuthScreen({ busy, status, onSubmit }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [localError, setLocalError] = useState("");

  function submit() {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setLocalError("請輸入有效的電子郵件地址。");
      return;
    }
    if (password.length < 12) {
      setLocalError("密碼至少需要 12 個字元。");
      return;
    }
    setLocalError("");
    onSubmit(mode, normalizedEmail, password, displayName.trim());
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.brandMark}>
            <Text style={styles.brandGlyph}>糖</Text>
          </View>
          <Text style={styles.eyebrow}>TANG LU LU</Text>
          <Text style={styles.title}>{mode === "login" ? "歡迎回來" : "建立你的帳號"}</Text>
          <Text style={styles.subtitle}>登入後即可安全保存與查看你的健康紀錄。</Text>
          {mode === "register" ? (
            <TextInput
              accessibilityLabel="顯示名稱"
              autoCapitalize="words"
              editable={!busy}
              maxLength={120}
              onChangeText={setDisplayName}
              placeholder="你的稱呼（選填）"
              placeholderTextColor={palette.muted}
              style={styles.input}
              value={displayName}
            />
          ) : null}
          <TextInput
            accessibilityLabel="電子郵件"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            editable={!busy}
            keyboardType="email-address"
            maxLength={320}
            onChangeText={setEmail}
            placeholder="電子郵件"
            placeholderTextColor={palette.muted}
            style={styles.input}
            textContentType="emailAddress"
            value={email}
          />
          <TextInput
            accessibilityLabel="密碼"
            autoCapitalize="none"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            editable={!busy}
            maxLength={128}
            onChangeText={setPassword}
            onSubmitEditing={submit}
            placeholder="密碼（至少 12 個字元）"
            placeholderTextColor={palette.muted}
            secureTextEntry
            style={styles.input}
            textContentType={mode === "register" ? "newPassword" : "password"}
            value={password}
          />
          {localError || status ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {localError || status}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={submit}
            style={[styles.primary, busy ? styles.disabled : null]}
          >
            <Text style={styles.primaryText}>
              {busy ? "請稍候…" : mode === "login" ? "登入" : "建立帳號"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => {
              setMode(mode === "login" ? "register" : "login");
              setLocalError("");
            }}
            style={styles.switchButton}
          >
            <Text style={styles.switchText}>
              {mode === "login" ? "還沒有帳號？建立帳號" : "已有帳號？返回登入"}
            </Text>
          </Pressable>
          <Text style={styles.footnote}>Google 等其他登入方式將於後續版本提供。</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.canvas },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 440, alignSelf: "center", backgroundColor: palette.surface, borderRadius: 28, padding: 26, borderWidth: 1, borderColor: palette.border },
  brandMark: { width: 54, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: palette.wash, marginBottom: 18 },
  brandGlyph: { color: palette.brand, fontSize: 25, fontWeight: "800" },
  eyebrow: { color: palette.brand, fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  title: { color: palette.ink, fontSize: 27, fontWeight: "800", marginTop: 9 },
  subtitle: { color: palette.muted, fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 20 },
  input: { minHeight: 54, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.canvas, borderRadius: 14, paddingHorizontal: 15, color: palette.ink, fontSize: 15, marginTop: 10 },
  error: { color: palette.danger, lineHeight: 20, marginTop: 12 },
  primary: { minHeight: 54, borderRadius: 16, backgroundColor: palette.brand, alignItems: "center", justifyContent: "center", marginTop: 18 },
  primaryText: { color: palette.onBrand, fontSize: 16, fontWeight: "800" },
  disabled: { opacity: 0.6 },
  switchButton: { alignItems: "center", justifyContent: "center", minHeight: 48, marginTop: 7 },
  switchText: { color: palette.brand, fontSize: 14, fontWeight: "700" },
  footnote: { color: palette.muted, fontSize: 12, textAlign: "center", marginTop: 8 }
});
