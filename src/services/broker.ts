// src/services/broker.ts - COMPLETE REPLACEMENT
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { Broker } from '../types';

// Your deployed Cloudflare Worker URL
const YOUR_BACKEND_URL = 'https://payvex-backend.payvex-api.workers.dev';

const DERIV_WS_URL = 'wss://ws.derivws.com/websockets/v3?app_id=1089';

const TOKEN_KEYS = {
  DERIV: 'deriv_token',
  MT5: 'mt5_data', // JSON {token: string, accountId: string}
  PHONE: 'user_mpesa_phone',
} as const;

// ============================================
// STORAGE - Using AsyncStorage (RELIABLE)
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

// In broker.ts - UPDATE setMpesaPhone function:
export async function setMpesaPhone(phone: string): Promise<boolean> {
  console.log('[broker.ts] setMpesaPhone called with:', phone);
  
  // Remove all non-digits
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Convert 0712345678 to 254712345678
  let formattedPhone = cleanPhone;
  if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
    formattedPhone = '254' + cleanPhone.substring(1);
  } else if (cleanPhone.startsWith('+')) {
    formattedPhone = cleanPhone.substring(1);
  }
  
  // More lenient validation - just check it's a valid Kenyan number
  // Kenyan numbers: 2547XXXXXXXX or 2541XXXXXXXX (12 digits total)
  const kePhoneRegex = /^254[17]\d{8}$/;
  
  // Debug
  console.log('[broker.ts] Testing:', formattedPhone, 'against regex:', kePhoneRegex);
  console.log('[broker.ts] Length:', formattedPhone.length, 'Expected: 12');
  console.log('[broker.ts] Starts with 2547 or 2541?:', 
    formattedPhone.startsWith('2547') || formattedPhone.startsWith('2541'));
  
  const isValid = kePhoneRegex.test(formattedPhone);
  console.log('[broker.ts] Regex test result:', isValid);
  
  if (!isValid) {
    console.error('[broker.ts] Invalid format. Must be 2547XXXXXXXX or 2541XXXXXXXX');
    console.error('[broker.ts] Got:', formattedPhone);
    return false;
  }
  
  try {
    await AsyncStorage.setItem(TOKEN_KEYS.PHONE, formattedPhone);
    console.log('[broker.ts] Phone saved successfully:', formattedPhone);
    return true;
  } catch (error) {
    console.error('[broker.ts] AsyncStorage error:', error);
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
// DERIV API (WebSocket - Direct)
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

      if (data.error) {
        resolve(false);
      } else if (data.authorize) {
        resolve(true);
      }
    };

    ws.onerror = () => {
      cleanup();
      resolve(false);
    };

    // Timeout after 5 seconds
    setTimeout(() => {
      cleanup();
      resolve(false);
    }, 5000);
  });
}

export async function withdrawDeriv(
  token: string,
  amount: number,
  phone: string
): Promise<{ success: boolean; message: string }> {
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
      // First authorize
      ws.send(JSON.stringify({ authorize: token }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // After authorization, send cashier request
      if (data.authorize && !data.error) {
        ws.send(
          JSON.stringify({
            cashier: 'withdraw',
            provider: 'mpesa',
            type: 'api',
            verification_code: token,
            amount: amount.toString(),
            phone_number: phone,
          })
        );
      }

      // Handle cashier response
      if (data.cashier || data.error) {
        cleanup();

        if (data.error) {
          resolve({ success: false, message: data.error.message });
        } else {
          resolve({ success: true, message: 'Withdrawal initiated successfully' });
        }
      }
    };

    ws.onerror = () => {
      cleanup();
      resolve({ success: false, message: 'Connection failed' });
    };

    setTimeout(() => {
      cleanup();
      resolve({ success: false, message: 'Request timeout' });
    }, 10000);
  });
}

export function getDerivDepositUrl(amount?: number): string {
  const baseUrl = 'https://app.deriv.com/cashier/deposit?method=mpesa';
  return amount ? `${baseUrl}&amount=${amount}` : baseUrl;
}

// ============================================
// MT5 API (via Cloudflare Worker Backend)
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
      return { success: true, message: data.message || 'Withdrawal initiated successfully' };
    } else {
      return { success: false, message: data.error || 'Withdrawal failed' };
    }
  } catch (error) {
    console.error('MT5 withdrawal error:', error);
    return { success: false, message: 'Network error. Please try again.' };
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
// UNIFIED FUNCTIONS (Backward Compatible)
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
      // For MT5, data is token, accountId is separate
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
    const result = await withdrawDeriv(credentials.token, amount, mpesa);
    if (!result.success) throw new Error(result.message);
    return { id: 'N/A', status: result.message };
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

  const url =
    broker === 'DERIV' ? getDerivDepositUrl(amount) : getMT5DepositUrl('exness', amount);

  await WebBrowser.openBrowserAsync(url);
  console.log('Deposit link opened - user pays broker directly');
}