// src/services/broker.ts - COMPLETELY FIXED
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

export async function setMpesaPhone(phone: string): Promise<boolean> {
  console.log('🔧 [broker.ts] setMpesaPhone START - received:', phone);
  
  if (!phone || typeof phone !== 'string') {
    console.error('❌ [broker.ts] Invalid input - not a string');
    return false;
  }
  
  if (phone.trim().length === 0) {
    console.error('❌ [broker.ts] Empty phone number');
    return false;
  }
  
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    console.log('🔧 [broker.ts] After cleaning digits:', cleanPhone);
    
    let formattedPhone = cleanPhone;
    
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      formattedPhone = '254' + cleanPhone.substring(1);
      console.log('🔧 [broker.ts] Converted 0 format:', formattedPhone);
    } else if (cleanPhone.startsWith('254') && cleanPhone.length === 12) {
      console.log('🔧 [broker.ts] Already in 254 format');
    } else if (cleanPhone.startsWith('7') && cleanPhone.length === 9) {
      formattedPhone = '254' + cleanPhone;
      console.log('🔧 [broker.ts] Converted 7 format:', formattedPhone);
    } else if (cleanPhone.startsWith('1') && cleanPhone.length === 9) {
      formattedPhone = '254' + cleanPhone;
      console.log('🔧 [broker.ts] Converted 1 format:', formattedPhone);
    } else {
      console.error('❌ [broker.ts] Unrecognized format:', cleanPhone);
      return false;
    }
    
    if (formattedPhone.length !== 12) {
      console.error('❌ [broker.ts] Invalid length:', formattedPhone.length);
      return false;
    }
    
    if (!formattedPhone.startsWith('254')) {
      console.error('❌ [broker.ts] Does not start with 254:', formattedPhone);
      return false;
    }
    
    console.log('🔧 [broker.ts] Final phone to save:', formattedPhone);
    
    await AsyncStorage.setItem(TOKEN_KEYS.PHONE, formattedPhone);
    
    const saved = await AsyncStorage.getItem(TOKEN_KEYS.PHONE);
    console.log('🔧 [broker.ts] Verified saved value:', saved);
    
    if (saved !== formattedPhone) {
      console.error('❌ [broker.ts] Save verification failed');
      return false;
    }
    
    console.log('✅ [broker.ts] setMpesaPhone SUCCESS - returning true');
    return true;
    
  } catch (error) {
    console.error('❌ [broker.ts] setMpesaPhone ERROR:', error);
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

    setTimeout(() => {
      cleanup();
      resolve(false);
    }, 5000);
  });
}

export function getDerivWithdrawUrl(amount?: number, phone?: string): string {
  let url = 'https://app.deriv.com/cashier/withdrawal';
  const params = new URLSearchParams();
  
  if (amount) {
    params.append('amount', amount.toString());
  }
  
  if (phone) {
    params.append('phone_number', phone);
  }
  
  params.append('method', 'mpesa');
  
  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
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
      status: 'Withdrawal page opened - Complete the transaction in Deriv\'s cashier' 
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

  const url =
    broker === 'DERIV' ? getDerivDepositUrl(amount) : getMT5DepositUrl('exness', amount);

  await WebBrowser.openBrowserAsync(url);
  console.log('Deposit link opened - user completes payment via broker');
}

// ============================================
// FIXED: Deriv M-Pesa Deposit via Cashier API
// ============================================
export async function depositDerivMpesa(
  token: string,
  amountKES: number,
  phone: string
): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const ws = new WebSocket(DERIV_WS_URL);
    let resolved = false;
    let authorized = false;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        ws.close();
      }
    };

    ws.onopen = () => {
      console.log('🔌 WebSocket connected - authorizing...');
      ws.send(JSON.stringify({ authorize: token }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📨 Received:', data);

      // Step 1: Authorization response
      if (data.authorize && !data.error && !authorized) {
        authorized = true;
        console.log('✅ Authorized! Requesting cashier URL...');

        // Step 2: Request cashier URL for M-Pesa deposit
        ws.send(
          JSON.stringify({
            cashier: 'deposit',
            provider: 'doughflow',
            verification_code: token
          })
        );
      }

      // Step 3: Handle cashier response
      if (data.cashier) {
        cleanup();
        
        if (data.cashier.deposit) {
          console.log('✅ Got cashier URL:', data.cashier.deposit);
          
          // Open the cashier URL in browser
          WebBrowser.openBrowserAsync(data.cashier.deposit)
            .then(() => {
              resolve({ 
                success: true, 
                message: 'Redirecting to Deriv cashier. Complete your M-Pesa payment there.' 
              });
            })
            .catch((error) => {
              resolve({ 
                success: false, 
                message: 'Failed to open browser: ' + error.message 
              });
            });
        } else {
          resolve({ 
            success: false, 
            message: 'No deposit URL received from Deriv' 
          });
        }
      }

      // Handle errors
      if (data.error) {
        console.error('❌ API error:', data.error);
        cleanup();
        
        let errorMessage = data.error.message || 'Deposit failed';
        
        // Provide helpful error messages
        if (errorMessage.includes('InvalidToken')) {
          errorMessage = 'Invalid Deriv token. Please re-link your account.';
        } else if (errorMessage.includes('verification')) {
          errorMessage = 'Please verify your email in Deriv before depositing.';
        }
        
        resolve({ 
          success: false, 
          message: errorMessage
        });
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      cleanup();
      resolve({ 
        success: false, 
        message: 'Connection failed. Please check your internet.' 
      });
    };

    // Timeout after 15 seconds
    setTimeout(() => {
      if (!resolved) {
        cleanup();
        resolve({ 
          success: false, 
          message: 'Request timeout. Please try again.' 
        });
      }
    }, 15000);
  });
}

export { Broker };