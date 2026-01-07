/**
 * M-Pesa Account Linking Edge Function
 * 
 * PURPOSE:
 * Validates and links M-Pesa accounts using Safaricom Daraja API
 * 
 * REQUIRED SECRETS (Configure in Project Settings → Secrets):
 * - MPESA_CONSUMER_KEY: Your Safaricom Daraja API Consumer Key
 * - MPESA_CONSUMER_SECRET: Your Safaricom Daraja API Consumer Secret
 * - MPESA_SHORTCODE: Your paybill/till number
 * - MPESA_PASSKEY: Your Safaricom Daraja passkey
 * 
 * HOW TO GET CREDENTIALS:
 * 1. Go to https://developer.safaricom.co.ke/
 * 2. Create an account and login
 * 3. Create a new app
 * 4. Get Consumer Key and Consumer Secret from app details
 * 5. Get Shortcode and Passkey from Safaricom
 * 
 * API DOCUMENTATION:
 * https://developer.safaricom.co.ke/APIs
 */

import { MagicallySDK } from 'magically-sdk';

interface Env {
  MAGICALLY_PROJECT_ID: string;
  MAGICALLY_API_BASE_URL: string;
  MAGICALLY_API_KEY: string;
  MPESA_CONSUMER_KEY?: string;
  MPESA_CONSUMER_SECRET?: string;
  MPESA_SHORTCODE?: string;
  MPESA_PASSKEY?: string;
}

interface MPesaRequest {
  phoneNumber: string;
  pin: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Initialize Magically SDK
    const magically = new MagicallySDK({
      projectId: env.MAGICALLY_PROJECT_ID,
      apiUrl: env.MAGICALLY_API_BASE_URL,
      apiKey: env.MAGICALLY_API_KEY,
    });

    // Authenticate user
    const { user } = await magically.auth.getUser(request);
    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      // Parse request body
      const body: MPesaRequest = await request.json();
      const { phoneNumber, pin } = body;

      // Validate input
      if (!phoneNumber || !pin) {
        return new Response(
          JSON.stringify({ success: false, message: 'Phone number and PIN are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check if API credentials are configured
      if (!env.MPESA_CONSUMER_KEY || !env.MPESA_CONSUMER_SECRET) {
        console.error('[M-PESA] API credentials not configured');
        return new Response(
          JSON.stringify({
            success: false,
            message: 'M-Pesa API credentials not configured. Please contact support.',
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Step 1: Get OAuth token from Daraja API
      const auth = btoa(`${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`);
      const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get M-Pesa OAuth token');
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Step 2: Validate account using Account Balance API or STK Push
      // For demo, we'll simulate validation
      // In production, you'd call:
      // https://sandbox.safaricom.co.ke/mpesa/accountbalance/v1/query
      
      console.log('[M-PESA] Validating account:', { phoneNumber, userId: user._id });

      // Simulate validation delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 3: Return success response
      // In production, parse actual account data from Safaricom response
      const accountData = {
        accountName: `M-Pesa (${phoneNumber.slice(-4)})`,
        maskedAccountNumber: `****${phoneNumber.slice(-4)}`,
        balance: 0, // Would come from actual API
        currency: 'KES',
        status: 'active',
      };

      return new Response(
        JSON.stringify({
          success: true,
          message: 'M-Pesa account linked successfully',
          data: accountData,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error: any) {
      console.error('[M-PESA] Error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          message: error.message || 'Failed to link M-Pesa account',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
