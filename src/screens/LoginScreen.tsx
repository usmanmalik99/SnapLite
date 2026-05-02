import React, { useState } from "react";
import { Alert, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { login } from "../services/auth";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const theme = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onLogin = async () => {
    setError(null);
    setLoading(true);

    const attempt = async (force?: boolean) => {
      await login({ email: email.trim(), password, force });
      navigation.replace("Tabs");
    };

    try {
      await attempt(false);
    } catch (e: any) {
      if (e?.code === "SESSION_EXISTS") {
        Alert.alert(
          "Already logged in",
          "This account is already logged in on another device. If you continue, it will log out the other device.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Yes, continue",
              style: "destructive",
              onPress: async () => {
                setLoading(true);
                setError(null);
                try {
                  await attempt(true);
                } catch (err: any) {
                  setError(err?.message || "Login failed");
                } finally {
                  setLoading(false);
                }
              },
            },
          ]
        );
      } else {
        setError(e?.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        padding: 20,
        justifyContent: "center",
        backgroundColor: theme.colors.background,
      }}
    >
      <Text variant="headlineLarge" style={{ marginBottom: 6, color: theme.colors.primary, fontWeight: "900" }}>
        SnapLite
      </Text>
      <Text style={{ marginBottom: 18, opacity: 0.9 }}>Sign in to continue</Text>

      <TextInput
        mode="outlined"
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ marginBottom: 12 }}
      />

      <TextInput
        mode="outlined"
        label="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ marginBottom: 8 }}
      />

      <Button
        mode="text"
        compact
        onPress={() => navigation.navigate("ForgotPassword")}
        style={{ alignSelf: "flex-end", marginBottom: 10 }}
      >
        Forgot password?
      </Button>

      {error ? <Text style={{ color: theme.colors.error, marginBottom: 10 }}>{error}</Text> : null}

      <Button mode="contained" onPress={onLogin} loading={loading} disabled={loading} style={{ borderRadius: 16 }}>
        Login
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.navigate("Signup")}
        style={{ marginTop: 10 }}
        textColor={theme.colors.primary}
      >
        Create an account
      </Button>
    </View>
  );
}
