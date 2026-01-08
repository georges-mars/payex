// src/services/broker.ts - SIMPLIFIED WORKING VERSION
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { Broker } from '../types';

// Your deployed Cloudflare Worker URL
const YOUR_BACKEND_URL = 'https://payvex-backend.payvex-api.workers.dev';

const DERIV_WS_URL = 'wss://ws.derivws.com/websockets/v3?app_id=1089';

const TOKEN_KEYS = {
  DERIV: 'deriv_token',
  MT5: 'mt5_data',
  PHONE: 'user_mpesa_phone',
} as const;

// ============================================
// STORAGE
// ============================================

export async function saveBrokerToken(
  broker: Broker,
  token: string,
  accountId?: string
): Promise<void> {
  try {
    if (broker === 'DERIV') {
      await AsyncStorage.setItem(TOKEN_KEYS.DERIV, token);
    } else {
      const data = JSON.stringify({ token, accountId });
      await AsyncStorage.setItem(TOKEN_KEYS.MT5, data);
    }
  } catch (error) {
    console.error('Failed to save credentials:', error);
    throw new Error('Failed to save credentials');
  }
}

export async function getBrokerToken(
  broker: Broker
): Promise<{ token: string; accountId?: string } | null> {
  try {
    if (broker === 'DERIV') {
      const token = await AsyncStorage.getItem(TOKEN_KEYS.DERIV);
      if (!token) return null;
      return { token };
    } else {
      const data = await AsyncStorage.getItem(TOKEN_KEYS.MT5);
      if (!data) return null;
      const parsed = JSON.parse(data);
      return { token: parsed.token, accountId: parsed.accountId };
    }
  } catch (error) {
    console.error('Failed to get credentials:', error);
    return null;
  }
}

export async function setMpesaPhone(phone: string): Promise<boolean> {
  console.log('🔧 setMpesaPhone START:', phone);
  
  if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
    console.error('❌ Invalid phone input');
    return false;
  }
  
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    let formattedPhone = cleanPhone;
    
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      formattedPhone = '254' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('254') && cleanPhone.length === 12) {
      // Already correct
    } else if (cleanPhone.startsWith('7') && cleanPhone.length === 9) {
      formattedPhone = '254' + cleanPhone;
    } else if (cleanPhone.startsWith('1') && cleanPhone.length === 9) {
      formattedPhone = '254' + cleanPhone;
    } else {
      console.error('❌ Unrecognized format:', cleanPhone);
      return false;
    }
    
    if (formattedPhone.length !== 12 || !formattedPhone.startsWith('254')) {
      console.error('❌ Invalid format after conversion:', formattedPhone);
      return false;
    }
    
    await AsyncStorage.setItem(TOKEN_KEYS.PHONE, formattedPhone);
    
    const saved = await AsyncStorage.getItem(TOKEN_KEYS.PHONE);
    if (saved !== formattedPhone) {
      console.error('❌ Save verification failed');
      return false;
    }
    
    console.log('✅ Phone saved successfully:', formattedPhone);
    return true;
    
  } catch (error) {
    console.error('❌ setMpesaPhone ERROR:', error);
    return false;
  }
}

export async function getMpesaPhone(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEYS.PHONE);
  } catch (error) {
    console.error('Failed to get phone:', error);
    return null;
  }
}

// ============================================
// DERIV API
// ============================================

export async function validateDerivToken(token: string): Promise<boolean> {
  return new Promise((resolve) => {
    const ws = new WebSocket(DERIV_WS_URL);
    let resolved = false;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        ws.close();
      }
    };

    ws.onopen = () => {
      ws.send(JSON.stringify({ authorize: token }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      cleanup();
      resolve(!data.error && !!data.authorize);
    };

    ws.onerror = () => {
      cleanup();
      resolve(false);
    };

    setTimeout(() => {
      cleanup();
      resolve(false);
    }, 5000);
  });
}

export function getDerivWithdrawUrl(amount?: number, phone?: string): string {
  let url = 'https://app.deriv.com/cashier/withdrawal';
  const params = new URLSearchParams();
  
  if (amount) params.append('amount', amount.toString());
  if (phone) params.append('phone_number', phone);
  params.append('method', 'mpesa');
  
  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

export function getDerivDepositUrl(amount?: number): string {
  const baseUrl = 'https://app.deriv.com/cashier/deposit?method=mpesa';
  return amount ? `${baseUrl}&amount=${amount}` : baseUrl;
}

// ============================================
// MT5 API
// ============================================

export async function validateMT5Token(
  token: string,
  accountId: string
): Promise<boolean> {
  try {
    const response = await fetch(`${YOUR_BACKEND_URL}/mt5-validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, accountId }),
    });
    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    console.error('MT5 validation error:', error);
    return false;
  }
}

export async function withdrawMT5(
  token: string,
  accountId: string,
  amount: number,
  phone: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${YOUR_BACKEND_URL}/mt5-withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, accountId, amount, phone }),
    });
    const data = await response.json();
    
    if (response.ok && data.success) {
      return { success: true, message: data.message || 'Withdrawal initiated' };
    }
    return { success: false, message: data.error || 'Withdrawal failed' };
  } catch (error) {
    console.error('MT5 withdrawal error:', error);
    return { success: false, message: 'Network error' };
  }
}

export function getMT5DepositUrl(broker: string = 'exness', amount?: number): string {
  const urls: Record<string, string> = {
    exness: 'https://www.exness.com/accounts/deposit/',
    xm: 'https://members.xm.com/deposit',
    fxtm: 'https://my.forextime.com/deposit',
  };
  const baseUrl = urls[broker.toLowerCase()] || urls.exness;
  return amount ? `${baseUrl}?amount=${amount}` : baseUrl;
}

// ============================================
// UNIFIED FUNCTIONS
// ============================================

export async function linkBroker(
  broker: Broker,
  data: string,
  accountId?: string
): Promise<boolean> {
  try {
    if (broker === 'DERIV') {
      const isValid = await validateDerivToken(data);
      if (!isValid) throw new Error('Invalid Deriv token');
      await saveBrokerToken('DERIV', data);
    } else {
      if (!accountId) throw new Error('MT5 requires accountId');
      const isValid = await validateMT5Token(data, accountId);
      if (!isValid) throw new Error('Invalid MT5 credentials');
      await saveBrokerToken('MT5', data, accountId);
    }
    console.log(`${broker} linked successfully`);
    return true;
  } catch (error) {
    console.error(`Failed to link ${broker}:`, error);
    return false;
  }
}

export async function withdraw(
  broker: Broker,
  amount: number
): Promise<{ id: string; status: string }> {
  const credentials = await getBrokerToken(broker);
  if (!credentials) throw new Error('Link broker first');

  const mpesa = await getMpesaPhone();
  if (!mpesa) throw new Error('Set M-Pesa phone number first');

  if (broker === 'DERIV') {
    const url = getDerivWithdrawUrl(amount, mpesa);
    await WebBrowser.openBrowserAsync(url);
    return { 
      id: 'DERIV_CASHIER', 
      status: 'Withdrawal page opened - Complete in Deriv cashier' 
    };
  } else {
    if (!credentials.accountId) throw new Error('MT5 account ID missing');
    const result = await withdrawMT5(credentials.token, credentials.accountId, amount, mpesa);
    if (!result.success) throw new Error(result.message);
    return { id: 'N/A', status: result.message };
  }
}

export async function initiateDeposit(broker: Broker, amount?: number): Promise<void> {
  const credentials = await getBrokerToken(broker);
  if (!credentials) throw new Error('Link broker first');

  const url = broker === 'DERIV' 
    ? getDerivDepositUrl(amount) 
    : getMT5DepositUrl('exness', amount);

  await WebBrowser.openBrowserAsync(url);
}

// ============================================
// DERIV DEPOSIT - BROWSER-BASED (WORKING)
// ============================================
export async function depositDerivMpesa(
  token: string,
  amountKES: number,
  phone: string
): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🚀 Opening Deriv cashier for deposit...');
    
    // Validate token first
    const isValid = await validateDerivToken(token);
    if (!isValid) {
      return {
        success: false,
        message: 'Invalid Deriv token. Please re-link your account.'
      };
    }
    
    // Convert KES to USD (approximate: 1 USD = 130 KES)
    const amountUSD = Math.round((amountKES / 130) * 100) / 100;
    
    // Build Deriv cashier URL with amount
    const url = `https://app.deriv.com/cashier/deposit?amount=${amountUSD}`;
    
    console.log('📱 Opening URL:', url);
    
    // Open Deriv's web cashier
    const result = await WebBrowser.openBrowserAsync(url);
    
    if (result.type === 'cancel' || result.type === 'dismiss') {
      return {
        success: false,
        message: 'Deposit cancelled'
      };
    }
    
    return {
      success: true,
      message: 'Deriv cashier opened. Complete your M-Pesa payment in the browser.'
    };
    
  } catch (error: any) {
    console.error('❌ Deposit error:', error);
    return {
      success: false,
      message: error.message || 'Failed to open deposit page'
    };
  }
}

export { Broker };