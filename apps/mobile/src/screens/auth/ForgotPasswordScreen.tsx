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
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { PressableScale } from "../../components/PressableScale";
import { colors } from "../../theme/tokens";
import { authClient } from "../../lib/auth-client";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export function ForgotPasswordScreen({ navigation }: Props) {
  const reduced = useReducedMotion();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  async function handleReset() {
    setError(null);
    if (!email) {
      setError("Please enter your email.");
      triggerShake();
      return;
    }

    setLoading(true);
    // @ts-ignore: Types might not have forgetPassword if it's missing from ReactAuthClient
    const { error: authError } = await authClient.forgetPassword({
      email,
      redirectTo: "/reset-password",
    });
    setLoading(false);
    
    if (authError) {
      setError(authError.message ?? "Failed to request password reset.");
      triggerShake();
    } else {
      setSubmitted(true);
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

  if (submitted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
        <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: "center", alignItems: "center" }}>
          <Animated.View entering={reduced ? undefined : FadeInDown.duration(420).springify().damping(20)}>
            <Text style={{ fontSize: 24, fontWeight: "700", color: colors.ink, textAlign: "center", letterSpacing: -0.4 }}>
              Check your email
            </Text>
            <Text style={{ fontSize: 14.5, color: colors.inkSoft, marginTop: 8, lineHeight: 22, textAlign: "center" }}>
              We sent a password reset link to{"\n"}
              <Text style={{ fontWeight: "600", color: colors.ink }}>{email}</Text>.
            </Text>
          </Animated.View>

          <Animated.View entering={reduced ? undefined : FadeInDown.duration(420).delay(80).springify().damping(20)} style={{ marginTop: 32 }}>
            <PressableScale onPress={() => navigation.navigate("SignIn")}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <ArrowLeft size={16} color={colors.inkSoft} />
                <Text style={{ color: colors.inkSoft, fontSize: 14, fontWeight: "500" }}>Back to login</Text>
              </View>
            </PressableScale>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
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
              Reset password
            </Text>
            <Text style={{ fontSize: 14.5, color: colors.inkSoft, marginTop: 6, lineHeight: 20 }}>
              Enter your email address and we will send you a link to reset your password.
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
                placeholder="name@example.com"
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

            <PressableScale onPress={handleReset} disabled={loading} style={{ marginTop: 24 }}>
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
                  <Text style={{ color: colors.paper, fontWeight: "600", fontSize: 15 }}>Send reset link</Text>
                )}
              </View>
            </PressableScale>

            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24 }}>
              <Text style={{ color: colors.inkSoft, fontSize: 14 }}>Remember your password? </Text>
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
