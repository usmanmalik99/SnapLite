import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { signup } from "../services/auth";

type Props = NativeStackScreenProps<RootStackParamList, "Signup">;

export default function SignupScreen({ navigation }: Props) {
  const theme = useTheme();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignup = async () => {
    setError(null);
    setLoading(true);
    try {
      await signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
      });
      navigation.replace("Login");
    } catch (e: any) {
      setError(e?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, justifyContent: "center", backgroundColor: theme.colors.background }}>
      <Text variant="headlineMedium" style={{ marginBottom: 10, color: theme.colors.primary }}>
        Create account
      </Text>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <TextInput
          mode="outlined"
          label="First name"
          value={firstName}
          onChangeText={setFirstName}
          style={{ flex: 1, marginBottom: 12 }}
        />
        <TextInput
          mode="outlined"
          label="Last name"
          value={lastName}
          onChangeText={setLastName}
          style={{ flex: 1, marginBottom: 12 }}
        />
      </View>

      <TextInput mode="outlined" label="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} style={{ marginBottom: 12 }} />
      <TextInput mode="outlined" label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={{ marginBottom: 12 }} />
      <TextInput mode="outlined" label="Password" secureTextEntry value={password} onChangeText={setPassword} style={{ marginBottom: 12 }} />

      {error ? <Text style={{ color: theme.colors.error, marginBottom: 10 }}>{error}</Text> : null}

      <Button mode="contained" onPress={onSignup} loading={loading} disabled={loading} style={{ borderRadius: 16 }}>
        Sign up
      </Button>

      <Button mode="text" onPress={() => navigation.goBack()} style={{ marginTop: 10 }} textColor={theme.colors.primary}>
        Back to login
      </Button>
    </ScrollView>
  );
}
