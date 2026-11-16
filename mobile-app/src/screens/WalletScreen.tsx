import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { mobileApi } from '../api/client';
import { colors, radii, spacing } from '../theme/tokens';
import type { WalletAccount, WalletTransaction } from '../types/domain';

export function WalletScreen() {
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [depositAmount, setDepositAmount] = useState('50000');
  const [sendRecipient, setSendRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('25000');

  const load = () => {
    mobileApi.getWallet().then((res) => {
      setAccount(res.account);
      setTransactions(res.transactions);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const handleDeposit = async () => {
    const amt = Number(depositAmount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    try {
      const res = await mobileApi.depositWallet({ amount: amt, source: 'mobile_money' });
      setAccount(res.account);
      load();
      Alert.alert('Deposit Complete', `Added ${res.account.currency} ${amt.toLocaleString()}`);
    } catch (err: any) {
      Alert.alert('Deposit Error', err.message);
    }
  };

  const handleSend = async () => {
    const amt = Number(sendAmount);
    if (!sendRecipient.trim() || !Number.isFinite(amt) || amt <= 0) return;
    try {
      const res = await mobileApi.sendWallet({ recipient: sendRecipient.trim(), amount: amt });
      setAccount(res.account);
      setSendRecipient('');
      load();
      Alert.alert('Transfer Sent', `Sent ${res.account.currency} ${amt.toLocaleString()}`);
    } catch (err: any) {
      Alert.alert('Transfer Error', err.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>
          {account ? `${account.accountName} · KYC Tier ${account.kycTier}` : 'Loading Wallet...'}
        </Text>
        <Text style={styles.balanceValue}>
          {account ? `${account.currency} ${account.balance.toLocaleString()}` : '—'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top Up via Mobile Money</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={depositAmount}
          onChangeText={setDepositAmount}
          placeholder="Amount"
        />
        <Pressable style={styles.primaryBtn} onPress={handleDeposit}>
          <Text style={styles.primaryBtnText}>Add Funds</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Send Payment</Text>
        <TextInput
          style={styles.input}
          value={sendRecipient}
          onChangeText={setSendRecipient}
          placeholder="Recipient email or booking ref"
        />
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={sendAmount}
          onChangeText={setSendAmount}
          placeholder="Amount"
        />
        <Pressable style={styles.outlineBtn} onPress={handleSend}>
          <Text style={styles.outlineBtnText}>Send Payment</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Ledger Activity</Text>
      {transactions.map((tx) => (
        <View key={tx.id} style={styles.txRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.txTitle}>{tx.sourceOrRecipient}</Text>
            <Text style={styles.txMeta}>
              {tx.reference} · {tx.type}
            </Text>
          </View>
          <Text style={[styles.txAmount, { color: tx.amount >= 0 ? colors.success : colors.danger }]}>
            {tx.amount >= 0 ? '+' : ''}
            {tx.currency} {tx.amount.toLocaleString()}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBody },
  content: { padding: spacing.lg, paddingBottom: 32 },
  balanceCard: {
    backgroundColor: colors.brandPrimaryDark,
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 6 },
  balanceValue: { color: colors.brandAccent, fontSize: 28, fontWeight: '800' },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
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
    borderWidth: 1,
    borderColor: colors.brandPrimary,
    minHeight: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: { color: colors.brandPrimary, fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginVertical: 10 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: 8,
  },
  txTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  txMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '800' },
});
