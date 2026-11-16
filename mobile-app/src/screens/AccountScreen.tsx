import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, radii, spacing } from '../theme/tokens';

export function AccountScreen() {
  const { user, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('amina@pamoja.space');
  const [password, setPassword] = useState('Pamoja2027!');
  const [country, setCountry] = useState('UG');

  const submitAuth = async () => {
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        await signUp({ fullName: fullName.trim(), email: email.trim(), password, country });
      }
    } catch (err: any) {
      Alert.alert('Authentication Error', err.message || 'Check your credentials.');
    }
  };

  if (user) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.meta}>
            {user.email} · {user.country} · KYC Tier {user.kycTier}
          </Text>
          <Text style={styles.meta}>Public ID: {user.publicId}</Text>
          <Pressable style={styles.outlineBtn} onPress={signOut}>
            <Text style={styles.outlineBtnText}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.name}>{mode === 'login' ? 'Sign In to Pamoja' : 'Create Pamoja Account'}</Text>
        <Text style={styles.meta}>Access your passes, stay bookings, rides, and wallet.</Text>

        {mode === 'register' ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              style={styles.input}
              placeholder="Country Code (UG, KE, TZ, NG)"
              value={country}
              onChangeText={setCountry}
              autoCapitalize="characters"
            />
          </>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={styles.primaryBtn} onPress={submitAuth}>
          <Text style={styles.primaryBtnText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>
        </Pressable>

        <Pressable style={{ marginTop: 14, alignItems: 'center' }} onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
          <Text style={{ color: colors.brandPrimary, fontWeight: '700' }}>
            {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign In'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBody },
  content: { padding: spacing.lg },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.xl,
  },
  name: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  meta: { fontSize: 13, color: colors.textMuted, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    minHeight: 46,
    marginBottom: 10,
    fontSize: 15,
  },
  primaryBtn: {
    backgroundColor: colors.brandPrimary,
    minHeight: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  outlineBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    minHeight: 46,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
});
