import * as SecureStore from 'expo-secure-store';
import { DerivAPIBasic } from '@deriv/deriv-api';
import MetaApi from 'metaapi.cloud-sdk';
import * as WebBrowser from 'expo-web-browser';
import { Broker } from '../types';

const TOKEN_KEYS = {
  DERIV: 'deriv_token',
  MT5: 'mt5_data',  // JSON {token: string, accountId: string}
  PHONE: 'user_mpesa_phone',
} as const;

export async function linkBroker(broker: Broker, data: string): Promise<boolean> {
  try {
    const key = broker === 'DERIV' ? TOKEN_KEYS.DERIV : TOKEN_KEYS.MT5;
    await SecureStore.setItemAsync(key, data);
    
    // Quick validate
    if (broker === 'DERIV') {
      const api = new DerivAPIBasic({ token: data });
      const auth = await api.authorize({ authorize: 1 });
      if (auth.error) throw new Error('Invalid Deriv token');
    } else {
      const { token, accountId } = JSON.parse(data);
      const api = new MetaApi(token);
      const account = await api.metatraderAccountApi.getAccount(accountId);
      await account.deploy();
    }
    
    console.log(`${broker} linked`);
    return true;
  } catch (error) {
    console.error(error.message);
    return false;
  }
}

export async function getBrokerToken(broker: Broker): Promise<string | null> {
  const key = broker === 'DERIV' ? TOKEN_KEYS.DERIV : TOKEN_KEYS.MT5;
  return await SecureStore.getItemAsync(key);
}

export async function getMpesaPhone(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEYS.PHONE);
}

export async function setMpesaPhone(phone: string): Promise<boolean> {
  const kePhoneRegex = /^254[17]\d{8}$/;  // Validates 2547XXXXXXXX or 2541XXXXXXXX
  if (!kePhoneRegex.test(phone)) {
    console.error('Invalid Kenyan phone format');
    return false;
  }
  await SecureStore.setItemAsync(TOKEN_KEYS.PHONE, phone);
  return true;
}

export async function withdraw(broker: Broker, amount: number): Promise<{ id: string; status: string }> {
  const token = await getBrokerToken(broker);
  if (!token) throw new Error('Link broker first');
  const mpesa = await getMpesaPhone();
  if (!mpesa) throw new Error('Set M-Pesa phone');

  if (broker === 'DERIV') {
    const api = new DerivAPIBasic({ token });
    await api.authorize({ authorize: 1 });
    const req = await api.paymentagent_withdraw({
      amount,
      currency: 'KES',
      paymentagent_loginid: (await api.authorize({ authorize: 1 })).authorize.loginid,
      mpesa_phone: mpesa,
      justification: { text: 'Direct withdrawal' }
    });
    return { id: req.withdraw_id || 'N/A', status: 'Initiated - Check Deriv app' };
  } else {
    const { token: metaToken, accountId } = JSON.parse(token);
    const api = new MetaApi(metaToken);
    const account = await api.metatraderAccountApi.getAccount(accountId);
    await account.deploy();
    await account.waitConnected();
    const req = await account.requestDepositOrWithdrawal({
      type: 'WITHDRAWAL',
      amount,
      method: 'M_PESA',
      details: { phone: mpesa }
    });
    return { id: req.id || 'N/A', status: req.status || 'Initiated' };
  }
}

export async function initiateDeposit(broker: Broker, amount: number): Promise<void> {
  const token = await getBrokerToken(broker);
  if (!token) throw new Error('Link broker first');
  const url = getDepositUrl(broker, amount);
  await WebBrowser.openBrowserAsync(url);
  console.log('Deposit link opened - user pays broker till');
}

function getDepositUrl(broker: Broker, amount: number): string {
  return broker === 'DERIV' 
    ? `https://deriv.com/cashier?method=mpesa&amount=${amount}` 
    : `https://exness.com/deposit?method=mpesa&amount=${amount}`;  // Customize for your MT5 broker
}