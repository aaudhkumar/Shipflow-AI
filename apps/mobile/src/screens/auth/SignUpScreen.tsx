import React, { useState } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { ArrowRight, Github } from "lucide-react-native";
import { PressableScale } from "../../components/PressableScale";
import { colors } from "../../theme/tokens";
import { authClient } from "../../lib/auth-client";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;

export function SignUpScreen({ navigation }: Props) {
  const reduced = useReducedMotion();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  async function handleSignUp() {
    setError(null);
    if (!name || !email || !password) {
      setError("Please fill out all fields.");
      triggerShake();
      return;
    }

    setLoading(true);
    const { error: authError } = await authClient.signUp.email({ name, email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message ?? "Couldn't sign you up. Check your details.");
      triggerShake();
    }
  }

  function triggerShake() {
    if (!reduced) {
      shakeX.value = withSequence(
        withTiming(-6, { duration: 45 }),
        withTiming(6, { duration: 90 }),
        withTiming(-4, { duration: 90 }),
        withTiming(0, { duration: 60 })
      );
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: "center" }}>
          <Animated.View entering={reduced ? undefined : FadeInDown.duration(420).springify().damping(20)}>
            <Text style={{ fontFamily: "WinkySans_600SemiBold", fontSize: 26, color: colors.ink }}>
              shipflow<Text style={{ color: colors.inkFaint }}>.</Text>
            </Text>
            <Text style={{ fontSize: 26, fontWeight: "700", color: colors.ink, marginTop: 20, letterSpacing: -0.4 }}>
              Create an account.
            </Text>
            <Text style={{ fontSize: 14.5, color: colors.inkSoft, marginTop: 6, lineHeight: 20 }}>
              Join to track feature requests from idea to deployed code.
            </Text>
          </Animated.View>

          <Animated.View
            entering={reduced ? undefined : FadeInDown.duration(420).delay(80).springify().damping(20)}
            style={[shakeStyle, { marginTop: 32, gap: 12 }]}
          >
            <View>
              <Text style={{ fontSize: 12, color: colors.inkSoft, marginBottom: 6, fontWeight: "500" }}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                placeholder="Jane Doe"
                placeholderTextColor={colors.inkFaint}
                style={{
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 13,
                  fontSize: 15,
                  color: colors.ink,
                }}
              />
            </View>
            <View>
              <Text style={{ fontSize: 12, color: colors.inkSoft, marginBottom: 6, fontWeight: "500" }}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@company.com"
                placeholderTextColor={colors.inkFaint}
                style={{
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 13,
                  fontSize: 15,
                  color: colors.ink,
                }}
              />
            </View>
            <View>
              <Text style={{ fontSize: 12, color: colors.inkSoft, marginBottom: 6, fontWeight: "500" }}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={colors.inkFaint}
                style={{
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 13,
                  fontSize: 15,
                  color: colors.ink,
                }}
              />
            </View>
          </Animated.View>

          <Animated.View entering={reduced ? undefined : FadeInDown.duration(420).delay(160).springify().damping(20)}>
            {error && (
              <Text style={{ color: colors.red, fontSize: 13, marginTop: 12, textAlign: "center" }}>{error}</Text>
            )}

            <PressableScale onPress={handleSignUp} disabled={loading} style={{ marginTop: 24 }}>
              <View
                style={{
                  backgroundColor: colors.ink,
                  paddingVertical: 14,
                  borderRadius: 12,
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color={colors.paper} size="small" />
                ) : (
                  <>
                    <Text style={{ color: colors.paper, fontWeight: "600", fontSize: 15 }}>Sign Up</Text>
                    <ArrowRight size={16} color={colors.paper} />
                  </>
                )}
              </View>
            </PressableScale>

            <PressableScale
              onPress={async () => {
                await authClient.signIn.social({ provider: "github" });
              }}
              style={{ marginTop: 12 }}
            >
              <View
                style={{
                  borderWidth: 1,
                  borderColor: colors.line,
                  backgroundColor: colors.paper,
                  paddingVertical: 14,
                  borderRadius: 12,
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Github size={18} color={colors.ink} />
                <Text style={{ color: colors.ink, fontWeight: "500", fontSize: 15 }}>Continue with GitHub</Text>
              </View>
            </PressableScale>

            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24 }}>
              <Text style={{ color: colors.inkSoft, fontSize: 14 }}>Already have an account? </Text>
              <PressableScale onPress={() => navigation.navigate("SignIn")}>
                <Text style={{ color: colors.ink, fontSize: 14, fontWeight: "600" }}>Sign In</Text>
              </PressableScale>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
