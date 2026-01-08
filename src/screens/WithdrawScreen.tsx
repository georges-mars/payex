import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, Broker } from '../types';
import { getBrokerToken, getMpesaPhone, withdraw } from '../services/broker';

type WithdrawScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function WithdrawScreen() {
  const navigation = useNavigation<WithdrawScreenNavigationProp>();
  const [broker, setBroker] = useState<Broker>('DERIV');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) < 100) {
      return Alert.alert('Error', 'Min KES 100');
    }
    
    try {
      const token = await getBrokerToken(broker);
      if (!token) {
        return Alert.alert('Link First', 'Enter token on Link');
      }
      
      const mpesa = await getMpesaPhone();
      if (!mpesa) {
        return Alert.alert('Phone Missing', 'Set phone on Link');
      }
      
      // This now opens the withdrawal cashier page in browser for DERIV
      // or calls backend API for MT5
      const res = await withdraw(broker, parseFloat(amount));
      
      if (broker === 'DERIV') {
        setStatus('Withdrawal page opened in browser. Complete the transaction in Deriv\'s cashier.');
        Alert.alert(
          'Withdrawal Started',
          'Complete the withdrawal in the browser. Funds will be sent to your M-Pesa.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        setStatus(`Success! ID: ${res.id} | ${res.status}. Funds to M-Pesa direct.`);
        Alert.alert('Success', res.status);
      }
    } catch (error: any) {
      setStatus(`Error: ${error.message}. Check link/phone.`);
      Alert.alert('Error', error.message || 'Withdrawal failed');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: 'white' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
        Withdraw from {broker}
      </Text>
      
      <Picker 
        selectedValue={broker} 
        onValueChange={setBroker} 
        style={{ marginBottom: 16 }}
      >
        <Picker.Item label="Deriv" value="DERIV" />
        <Picker.Item label="MT5" value="MT5" />
      </Picker>
      
      <TextInput 
        placeholder="Amount (KES)" 
        value={amount} 
        onChangeText={setAmount} 
        keyboardType="numeric"
        style={{ 
          borderWidth: 1, 
          padding: 8, 
          borderRadius: 4, 
          marginBottom: 16 
        }} 
      />
      
      <TouchableOpacity 
        onPress={handleWithdraw} 
        style={{ 
          backgroundColor: 'red', 
          padding: 8, 
          borderRadius: 4, 
          marginBottom: 8 
        }}
      >
        <Text style={{ color: 'white' }}>Withdraw to M-Pesa</Text>
      </TouchableOpacity>
      
      {status ? (
        <Text style={{ 
          fontSize: 12, 
          fontStyle: 'italic', 
          marginBottom: 16,
          color: status.includes('Error') ? 'red' : 'green'
        }}>
          {status}
        </Text>
      ) : null}
      
      <TouchableOpacity 
        onPress={() => navigation.navigate('Link')} 
        style={{ 
          backgroundColor: 'gray', 
          padding: 8, 
          borderRadius: 4 
        }}
      >
        <Text style={{ color: 'white' }}>Link Broker First?</Text>
      </TouchableOpacity>
    </View>
  );
}