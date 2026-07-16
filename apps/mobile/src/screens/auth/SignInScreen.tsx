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

type Props = NativeStackScreenProps<AuthStackParamList, "SignIn">;

export function SignInScreen({ navigation }: Props) {
  const reduced = useReducedMotion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  async function handleSignIn() {
    setError(null);
    setLoading(true);
    const { error: authError } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message ?? "Couldn't sign you in. Check your details.");
      if (!reduced) {
        shakeX.value = withSequence(
          withTiming(-6, { duration: 45 }),
          withTiming(6, { duration: 90 }),
          withTiming(-4, { duration: 90 }),
          withTiming(0, { duration: 60 })
        );
      }
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
              Welcome back.
            </Text>
            <Text style={{ fontSize: 14.5, color: colors.inkSoft, marginTop: 6, lineHeight: 20 }}>
              Sign in to see where every request is in the pipeline.
            </Text>
          </Animated.View>

          <Animated.View
            entering={reduced ? undefined : FadeInDown.duration(420).delay(80).springify().damping(20)}
            style={[shakeStyle, { marginTop: 32, gap: 12 }]}
          >
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

            {error && (
              <Animated.Text
                entering={reduced ? undefined : FadeInDown.duration(180)}
                style={{ color: colors.red, fontSize: 13 }}
              >
                {error}
              </Animated.Text>
            )}

            <PressableScale onPress={handleSignIn} disabled={loading}>
              <View
                style={{
                  backgroundColor: colors.ink,
                  borderRadius: 999,
                  height: 50,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 4,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color={colors.paper} />
                ) : (
                  <>
                    <Text style={{ color: colors.paper, fontSize: 15, fontWeight: "600" }}>Sign in</Text>
                    <ArrowRight size={16} color={colors.paper} />
                  </>
                )}
              </View>
            </PressableScale>

            <PressableScale onPress={() => authClient.signIn.social({ provider: "github" })}>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: 999,
                  height: 50,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Github size={16} color={colors.ink} />
                <Text style={{ color: colors.ink, fontSize: 15, fontWeight: "600" }}>Continue with GitHub</Text>
              </View>
            </PressableScale>
          </Animated.View>

          <Animated.View
            entering={reduced ? undefined : FadeInDown.duration(420).delay(140)}
            style={{ flexDirection: "row", justifyContent: "center", marginTop: 28, gap: 4 }}
          >
            <Text style={{ color: colors.inkSoft, fontSize: 13.5 }}>New to Shipflow?</Text>
            <PressableScale onPress={() => navigation.navigate("SignUp")}>
              <Text style={{ color: colors.ink, fontSize: 13.5, fontWeight: "600" }}>Create an account</Text>
            </PressableScale>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
