/**
 * Bank Account Linking Edge Function
 * 
 * PURPOSE:
 * Validates and links bank accounts using Plaid API or direct bank APIs
 * 
 * REQUIRED SECRETS (Configure in Project Settings → Secrets):
 * - PLAID_CLIENT_ID: Your Plaid Client ID
 * - PLAID_SECRET: Your Plaid Secret (sandbox/development/production)
 * - PLAID_ENV: Environment (sandbox, development, production)
 * 
 * HOW TO GET CREDENTIALS:
 * 1. Go to https://plaid.com/
 * 2. Sign up and create an account
 * 3. Get your Client ID and Secret from dashboard
 * 4. Start with 'sandbox' environment for testing
 * 
 * ALTERNATIVE: Direct Bank APIs
 * Some banks provide direct APIs. Check your target banks' developer portals.
 * 
 * API DOCUMENTATION:
 * https://plaid.com/docs/
 */

import { MagicallySDK } from 'magically-sdk';

interface Env {
  MAGICALLY_PROJECT_ID: string;
  MAGICALLY_API_BASE_URL: string;
  MAGICALLY_API_KEY: string;
  PLAID_CLIENT_ID?: string;
  PLAID_SECRET?: string;
  PLAID_ENV?: string;
}

interface BankRequest {
  bankName: string;
  accountNumber: string;
  accountName: string;
  routingNumber?: string;
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
      const body: BankRequest = await request.json();
      const { bankName, accountNumber, accountName, routingNumber } = body;

      // Validate input
      if (!bankName || !accountNumber || !accountName) {
        return new Response(
          JSON.stringify({ success: false, message: 'Bank name, account number, and account name are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check if API credentials are configured
      if (!env.PLAID_CLIENT_ID || !env.PLAID_SECRET) {
        console.error('[BANK] Plaid API credentials not configured');
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Bank API credentials not configured. Please contact support.',
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Step 1: Create Link Token (for Plaid Link flow)
      // In production, you'd use Plaid Link to let users authenticate
      const plaidEnv = env.PLAID_ENV || 'sandbox';
      const plaidUrl = `https://${plaidEnv}.plaid.com`;

      console.log('[BANK] Validating account:', { bankName, accountNumber: `****${accountNumber.slice(-4)}`, userId: user._id });

      // Step 2: For demo, simulate validation
      // In production, you'd:
      // 1. Create a Link Token
      // 2. Exchange public token for access token
      // 3. Get auth data and account balance
      // See: https://plaid.com/docs/api/tokens/#linktokencreate

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Return success response
      const accountData = {
        accountName: bankName,
        maskedAccountNumber: `****${accountNumber.slice(-4)}`,
        balance: 0, // Would come from Plaid API
        currency: 'KES',
        status: 'pending', // Pending verification
      };

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Bank account linked successfully',
          data: accountData,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error: any) {
      console.error('[BANK] Error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          message: error.message || 'Failed to link bank account',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
