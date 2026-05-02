import React, { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { Button, Card, HelperText, IconButton, Text, TextInput, useTheme } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { api } from "../services/api";

type Props = NativeStackScreenProps<RootStackParamList, "ForgotPassword">;

type Step = "email" | "reset" | "done";

export default function ForgotPasswordScreen({ navigation }: Props) {
  const theme = useTheme();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const emailValue = useMemo(() => email.trim().toLowerCase(), [email]);

  const requestReset = async () => {
    setError(null);
    setMessage(null);

    if (!emailValue) {
      setError("Enter the email address connected to your SnapLite account.");
      return;
    }

    try {
      setLoading(true);
      const result = await api<{ ok: boolean; resetToken?: string; message?: string }>(
        "/api/auth/request-password-reset",
        { method: "POST", json: { email: emailValue } }
      );

      setResetToken(result.resetToken || "");
      setMessage(result.message || "Account found. Create a new password below.");
      setStep("reset");
    } catch (e: any) {
      if (e?.status === 404) {
        setError("User not found with that email address.");
      } else {
        setError(e?.message || "Could not start password reset. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setError(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!resetToken) {
      setError("Reset token is missing. Go back and request a new reset link.");
      return;
    }

    try {
      setLoading(true);
      await api("/api/auth/reset-password", {
        method: "POST",
        json: { email: emailValue, token: resetToken, newPassword },
      });
      setStep("done");
      setMessage("Your password has been changed. You can now log in with the new password.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      setError(e?.message || "Reset failed. Request a new reset link and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ paddingTop: 52, paddingHorizontal: 18 }}>
        <IconButton icon="chevron-left" size={30} onPress={() => navigation.goBack()} />
      </View>

      <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
        <Text variant="headlineMedium" style={{ fontWeight: "900", color: theme.colors.primary }}>
          Reset password
        </Text>
        <Text style={{ marginTop: 8, marginBottom: 18, opacity: 0.75 }}>
          Enter your account email. If the user exists, SnapLite will let you create a new password.
        </Text>

        <Card mode="contained" style={{ borderRadius: 24, backgroundColor: "rgba(0,0,0,0.035)" }}>
          <Card.Content>
            {step === "email" ? (
              <>
                <TextInput
                  mode="outlined"
                  label="Email address"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  style={{ marginBottom: 12 }}
                />
                <Button mode="contained" loading={loading} disabled={loading} onPress={requestReset}>
                  Continue
                </Button>
              </>
            ) : null}

            {step === "reset" ? (
              <>
                <Text style={{ fontWeight: "800", marginBottom: 10 }}>{emailValue}</Text>
                <TextInput
                  mode="outlined"
                  label="New password"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  style={{ marginBottom: 12 }}
                />
                <TextInput
                  mode="outlined"
                  label="Confirm new password"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={{ marginBottom: 12 }}
                />
                <Button mode="contained" loading={loading} disabled={loading} onPress={resetPassword}>
                  Change password
                </Button>
                <Button
                  mode="text"
                  onPress={() => {
                    setStep("email");
                    setResetToken("");
                    setMessage(null);
                    setError(null);
                  }}
                  style={{ marginTop: 6 }}
                >
                  Use another email
                </Button>
              </>
            ) : null}

            {step === "done" ? (
              <>
                <Text style={{ marginBottom: 16, lineHeight: 21 }}>{message}</Text>
                <Button mode="contained" onPress={() => navigation.replace("Login")}>
                  Back to login
                </Button>
              </>
            ) : null}

            {!!error && <HelperText type="error" visible>{error}</HelperText>}
            {!!message && step !== "done" && <HelperText type="info" visible>{message}</HelperText>}
          </Card.Content>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}
