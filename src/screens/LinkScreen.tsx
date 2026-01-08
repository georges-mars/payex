import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { linkBroker, setMpesaPhone, type Broker } from '../services/broker';
import { useNavigation } from '@react-navigation/native';

export default function LinkScreen() {
  const [broker, setBroker] = useState<Broker>('DERIV');
  const [token, setToken] = useState('');
  const [accountId, setAccountId] = useState('');
  const [phone, setPhone] = useState('');
  const navigation = useNavigation();

  const handleTestLink = async () => {
    let data = token;
    if (broker === 'MT5') data = JSON.stringify({ token, accountId });
    const success = await linkBroker(broker, data);
    Alert.alert('Test Result', success ? 'Token valid!' : 'Invalid token – check & retry');
  };

  const handleLink = async () => {
    let data = token;
    if (broker === 'MT5') data = JSON.stringify({ token, accountId });
    const success = await linkBroker(broker, data);
    if (success) {
      Alert.alert('Linked!', `Ready for ${broker} deposits/withdraws`);
    }
  };

  const handlePhone = async () => {
    const valid = await setMpesaPhone(phone);
    if (valid) {
      Alert.alert('Saved!', 'M-Pesa phone set for withdrawals');
      navigation.navigate('MainTabs');
    } else {
      Alert.alert('Error', 'Invalid phone: Use 2547XXXXXXXX format');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: 'white' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Setup {broker} Account</Text>
      <TouchableOpacity onPress={() => setBroker(broker === 'DERIV' ? 'MT5' : 'DERIV')} style={{ backgroundColor: 'blue', padding: 8, borderRadius: 4, marginBottom: 8 }}>
        <Text style={{ color: 'white' }}>Switch to {broker === 'DERIV' ? 'MT5' : 'Deriv'}</Text>
      </TouchableOpacity>
      
      <Text style={{ fontSize: 12, marginBottom: 4 }}>Enter your {broker} API Token (get from dashboard)</Text>
      <TextInput 
        placeholder={broker === 'DERIV' ? "Deriv API Token (e.g., abc123...)" : "MetaApi Token (for MT5)"} 
        value={token} 
        onChangeText={setToken} 
        secureTextEntry 
        style={{ borderWidth: 1, padding: 8, borderRadius: 4, marginBottom: 8 }} 
      />
      {broker === 'MT5' && (
        <TextInput 
          placeholder="Your MT5 Account ID (from MetaApi dashboard)" 
          value={accountId} 
          onChangeText={setAccountId} 
          style={{ borderWidth: 1, padding: 8, borderRadius: 4, marginBottom: 8 }} 
        />
      )}
      <TouchableOpacity onPress={handleTestLink} style={{ backgroundColor: 'yellow', padding: 8, borderRadius: 4, marginBottom: 8 }}>
        <Text>Test Token (No Save)</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleLink} style={{ backgroundColor: 'green', padding: 8, borderRadius: 4, marginBottom: 16 }}>
        <Text style={{ color: 'white' }}>Save & Link</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 32, marginBottom: 8 }}>Your M-Pesa Phone (for Withdrawals)</Text>
      <Text style={{ fontSize: 12, marginBottom: 4 }}>Used only for direct broker transfers – never shared</Text>
      <TextInput 
        placeholder="254712345678" 
        value={phone} 
        onChangeText={setPhone} 
        keyboardType="phone-pad"
        style={{ borderWidth: 1, padding: 8, borderRadius: 4, marginBottom: 8 }} 
      />
      <TouchableOpacity onPress={handlePhone} style={{ backgroundColor: 'green', padding: 8, borderRadius: 4 }}>
        <Text style={{ color: 'white' }}>Save Phone</Text>
      </TouchableOpacity>
    </View>
  );
}