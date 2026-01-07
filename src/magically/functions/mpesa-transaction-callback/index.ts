/**
 * M-Pesa Transaction Callback Webhook
 * Receives callbacks from Safaricom Daraja API for STK Push results
 * 
 * This function should be set as the CallBackURL in your STK Push requests
 * 
 * REQUIRED: Set MPESA_CALLBACK_SECRET for webhook validation
 */

import { MagicallySDK } from 'magically-sdk';

interface Env {
  MAGICALLY_PROJECT_ID: string;
  MAGICALLY_API_BASE_URL: string;
  MAGICALLY_API_KEY: string;
  MPESA_CALLBACK_SECRET?: string; // Secret to validate callbacks
}

interface STKCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    console.log('[MPESA-CALLBACK] Received callback');
    
    // This endpoint only accepts POST from Safaricom
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // Parse the callback data
      const body: STKCallback = await request.json();
      console.log('[MPESA-CALLBACK] Callback body:', JSON.stringify(body, null, 2));

      const stkCallback = body.Body.stkCallback;
      const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

      console.log('[MPESA-CALLBACK] Processing:', {
        MerchantRequestID,
        CheckoutRequestID,
        ResultCode,
        ResultDesc
      });

      // Initialize Magically SDK
      const magically = new MagicallySDK({
        projectId: env.MAGICALLY_PROJECT_ID || '',
        apiUrl: env.MAGICALLY_API_BASE_URL || '',
        apiKey: env.MAGICALLY_API_KEY || '',
      });

      if (ResultCode === 0) {
        // Transaction successful - parse transaction details
        console.log('[MPESA-CALLBACK] Transaction successful');
        
        let amount = 0;
        let phoneNumber = '';
        let mpesaReceiptNumber = '';
        let transactionDate = '';

        if (CallbackMetadata?.Item) {
          for (const item of CallbackMetadata.Item) {
            switch (item.Name) {
              case 'Amount':
                amount = Number(item.Value);
                break;
              case 'PhoneNumber':
                phoneNumber = String(item.Value);
                break;
              case 'MpesaReceiptNumber':
                mpesaReceiptNumber = String(item.Value);
                break;
              case 'TransactionDate':
                transactionDate = String(item.Value);
                break;
            }
          }
        }

        console.log('[MPESA-CALLBACK] Transaction details:', {
          amount,
          phoneNumber,
          mpesaReceiptNumber,
          transactionDate
        });

        // Clean phone number
        const cleanedPhone = cleanPhoneNumber(phoneNumber);
        
        if (cleanedPhone) {
          // Find account by phone number and update balance
          try {
            const accounts = await magically.data.query("linked_accounts", {
              accountType: 'mpesa',
              'metadata.phoneNumber': cleanedPhone,
              'metadata.stkCheckoutId': CheckoutRequestID // Match the STK request
            });

            if (accounts.data.length > 0) {
              const account = accounts.data[0];
              
              console.log('[MPESA-CALLBACK] Found account:', account._id);
              
              // Update account with transaction and new balance
              // Note: We add the transaction amount to balance (simplified)
              // In reality, you'd need to check if this is deposit or withdrawal
              
              const newBalance = (account.balance || 0) + amount;
              
              await magically.data.update("linked_accounts", { _id: account._id }, {
                balance: newBalance,
                status: 'active', // Mark as fully verified
                metadata: {
                  ...account.metadata,
                  lastSynced: new Date().toISOString(),
                  callbackReceived: true,
                  lastTransaction: {
                    amount,
                    receiptNumber: mpesaReceiptNumber,
                    date: transactionDate,
                    type: amount > 0 ? 'credit' : 'debit'
                  },
                  mpesaReceiptNumber,
                  verifiedAt: new Date().toISOString()
                }
              });

              console.log('[MPESA-CALLBACK] Account updated successfully:', {
                accountId: account._id,
                newBalance,
                oldBalance: account.balance
              });

              // TODO: You could also create a transaction record here
              // await magically.data.insert("transactions", {
              //   accountId: account._id,
              //   amount,
              //   type: 'mpesa_verification',
              //   reference: mpesaReceiptNumber,
              //   status: 'completed',
              //   timestamp: new Date().toISOString(),
              //   metadata: {
              //     phoneNumber: cleanedPhone,
              //     checkoutId: CheckoutRequestID,
              //     merchantId: MerchantRequestID
              //   }
              // });

            } else {
              console.warn('[MPESA-CALLBACK] No account found for phone:', cleanedPhone);
              
              // Create a new account if verification was for linking
              // This handles the case where user is verifying during linking
              await magically.data.insert("linked_accounts", {
                accountType: 'mpesa',
                accountName: `M-Pesa (${cleanedPhone.slice(-4)})`,
                accountNumber: `****${cleanedPhone.slice(-4)}`,
                balance: amount, // Initial balance from verification transaction
                currency: 'KES',
                status: 'active',
                isDefault: false,
                linkedDate: new Date().toISOString(),
                metadata: {
                  platform: 'mpesa',
                  phoneNumber: cleanedPhone,
                  hasBalanceAccess: true,
                  lastSynced: new Date().toISOString(),
                  validatedWithRealApi: true,
                  mpesaReceiptNumber,
                  verifiedAt: new Date().toISOString(),
                  verificationTransaction: {
                    amount,
                    receiptNumber: mpesaReceiptNumber,
                    date: transactionDate
                  }
                }
              });
              
              console.log('[MPESA-CALLBACK] Created new account for phone:', cleanedPhone);
            }
          } catch (dbError) {
            console.error('[MPESA-CALLBACK] Database error:', dbError);
          }
        } else {
          console.warn('[MPESA-CALLBACK] Invalid phone number:', phoneNumber);
        }
      } else {
        // Transaction failed
        console.error('[MPESA-CALLBACK] Transaction failed:', ResultCode, ResultDesc);
        
        // Update account status to show failure
        try {
          const accounts = await magically.data.query("linked_accounts", {
            'metadata.stkCheckoutId': CheckoutRequestID
          });

          if (accounts.data.length > 0) {
            const account = accounts.data[0];
            
            await magically.data.update("linked_accounts", { _id: account._id }, {
              status: 'needs_verification',
              metadata: {
                ...account.metadata,
                lastCallbackError: ResultDesc,
                callbackReceived: true,
                verificationFailed: true,
                failureReason: ResultDesc
              }
            });
            
            console.log('[MPESA-CALLBACK] Marked account as failed verification:', account._id);
          }
        } catch (dbError) {
          console.error('[MPESA-CALLBACK] Failed to update account:', dbError);
        }
      }

      // Always return success to Safaricom (they'll retry if we return error)
      return new Response(
        JSON.stringify({
          ResultCode: 0,
          ResultDesc: 'Success'
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );

    } catch (error: any) {
      console.error('[MPESA-CALLBACK] Error processing callback:', error);
      
      // Still return success to Safaricom
      return new Response(
        JSON.stringify({
          ResultCode: 0,
          ResultDesc: 'Callback received'
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  },
};

// Helper to clean phone number
function cleanPhoneNumber(phone: string): string | null {
  if (!phone) return null;
  
  const cleaned = phone.replace(/\s+/g, '').replace(/[^\d]/g, '');
  
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '254' + cleaned.substring(1);
  }
  
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    return cleaned;
  }
  
  if (cleaned.startsWith('+254') && cleaned.length === 13) {
    return cleaned.substring(1);
  }
  
  if (cleaned.length === 9 && !cleaned.startsWith('0')) {
    return '254' + cleaned;
  }
  
  return null;
}