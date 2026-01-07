import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getBrokerToken, initiateDeposit, type Broker } from '../services/broker';
import { useNavigation } from '@react-navigation/native';

export default function DepositScreen() {
  const [broker, setBroker] = useState<Broker>('DERIV');
  const [amount, setAmount] = useState('');
  const navigation = useNavigation();

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) < 100) return Alert.alert('Error', 'Min KES 100');
    const token = await getBrokerToken(broker);
    if (!token) return Alert.alert('Link First', 'Go to Link to enter your token');
    await initiateDeposit(broker, parseFloat(amount));
    Alert.alert('Deposit Started', 'Pay via M-Pesa in browser - funds go direct to broker');
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: 'white' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Deposit to {broker}</Text>
      <Picker selectedValue={broker} onValueChange={setBroker} style={{ marginBottom: 16 }}>
        <Picker.Item label="Deriv" value="DERIV" />
        <Picker.Item label="MT5" value="MT5" />
      </Picker>
      
      <TextInput 
        placeholder="Amount (KES)" 
        value={amount} 
        onChangeText={setAmount} 
        keyboardType="numeric"
        style={{ borderWidth: 1, padding: 8, borderRadius: 4, marginBottom: 16 }} 
      />
      <TouchableOpacity onPress={handleDeposit} style={{ backgroundColor: 'blue', padding: 8, borderRadius: 4, marginBottom: 8 }}>
        <Text style={{ color: 'white' }}>Open M-Pesa Pay Link</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Link')} style={{ backgroundColor: 'gray', padding: 8, borderRadius: 4 }}>
        <Text style={{ color: 'white' }}>Link Broker First?</Text>
      </TouchableOpacity>
    </View>
  );
}