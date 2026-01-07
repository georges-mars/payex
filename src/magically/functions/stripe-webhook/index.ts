// TODO: This function is not deployed yet. This is a starter template.
// In order to deploy, make changes using the editFile tool and it will be auto deployed.
// Note: Logs arrive ~2 minutes later in getFunctionLogs.

import { MagicallySDK } from 'magically-sdk';

/**
 * STRIPE WEBHOOK HANDLER TEMPLATE WITH IDEMPOTENCY
 * =================================================
 * 
 * This edge function receives pre-verified Stripe webhooks from the Magically platform.
 * The platform handles signature verification transparently, so you can focus on business logic.
 * 
 * IMPORTANT: STRIPE_WEBHOOK_SECRET is required but verification is handled by the platform.
 * You don't need to verify signatures here. Ask the user for STRIPE_WEBHOOK_SECRET.
 * The platform endpoint (https://trymagically.com/api/functions/v1/{projectId}/stripe-webhook) 
 * verifies Stripe signatures centrally to ensure security at the right entry point.
 * magically platform does not intercept any other webhooks whatsoever, make sure to add any other webhooks as intended and share the link with the user.
 * 
 * AUTHENTICATION PATTERN:
 * -----------------------
 * In Cloudflare Workers (edge environment), the SDK uses API key authentication.
 * The API key is automatically detected and used when provided in the SDK config.
 * 
 * ENVIRONMENT VARIABLES (Auto-injected):
 * ---------------------------------------
 * - MAGICALLY_PROJECT_ID: Your project UUID
 * - MAGICALLY_API_BASE_URL: The API endpoint
 * - MAGICALLY_API_KEY: Your API key starting with "mg_" prefix
 * 
 * WEBHOOK VERIFICATION:
 * --------------------
 * The platform adds these headers after verification:
 * - X-Webhook-Verified: "true" if signature is valid
 * - X-Verification-Error: Error message if verification failed
 * - X-Stripe-Event-Id: The Stripe event ID for idempotency checking
 * - X-Stripe-Idempotency-Key: Optional idempotency key from Stripe
 * 
 * IDEMPOTENCY:
 * ------------
 * The platform stores all webhooks in __stripe_webhooks collection and prevents duplicates.
 * This template also implements application-level idempotency using webhook_processing collection.
 * 
 * DATA STORAGE PATTERN:
 * --------------------
 * Use MagicallySDK to store data in your MongoDB collections:
 * - sdk.data.insert(): Create new documents
 * - sdk.data.update(): Update existing documents (must exist)
 * - sdk.data.raw(): Direct MongoDB operations
 * - sdk.data.query(): Query with filters
 */

interface Env {
  MAGICALLY_PROJECT_ID: string;
  MAGICALLY_API_BASE_URL: string;
  MAGICALLY_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    console.log('[STRIPE-WEBHOOK] Webhook received');
    
    try {
      // STEP 1: Verify webhook is from platform
      // The platform pre-verifies Stripe signatures for security
      const isVerified = request.headers.get('X-Webhook-Verified') === 'true';
      
      if (!isVerified) {
        const verificationError = request.headers.get('X-Verification-Error');
        console.error('[STRIPE-WEBHOOK] Webhook verification failed:', verificationError);
        
        // Log unverified event for debugging (but don't process it)
        const event = await request.json();
        console.log('[STRIPE-WEBHOOK] Rejected unverified event:', {
          type: event.type,
          id: event.id,
          livemode: event.livemode
        });
        
        // SECURITY: Always reject unverified webhooks
        return new Response('Webhook verification failed', { status: 401 });
      }
      
      console.log('[STRIPE-WEBHOOK] Webhook verified by platform');

      // STEP 2: Parse the verified webhook event
      const event = await request.json();
      const eventId = event.id;
      const stripeEventId = request.headers.get('X-Stripe-Event-Id') || eventId;
      const idempotencyKey = request.headers.get('X-Stripe-Idempotency-Key');
      
      console.log('[STRIPE-WEBHOOK] Processing event:', {
        type: event.type,
        id: eventId,
        stripeEventId: stripeEventId,
        hasIdempotencyKey: !!idempotencyKey,
        created: event.created,
        livemode: event.livemode
      });

      // STEP 3: Initialize MagicallySDK with API key for edge environment
      const sdk = new MagicallySDK({
        projectId: env.MAGICALLY_PROJECT_ID,
        apiUrl: env.MAGICALLY_API_BASE_URL,
        apiKey: env.MAGICALLY_API_KEY  // Critical for edge authentication
      });

      // STEP 4: IDEMPOTENCY CHECK - Prevent duplicate processing
      // Check if we've already processed this webhook event
      try {
        const existingProcessed = await sdk.data.query('webhook_processing', {
          eventId: eventId
        }, { limit: 1 });
        
        if (existingProcessed.data.length > 0) {
          console.log('[STRIPE-WEBHOOK] Event already processed (idempotent):', {
            eventId: eventId,
            processedAt: existingProcessed.data[0].processedAt
          });
          
          // Return success to prevent Stripe from retrying
          return new Response(JSON.stringify({
            received: true,
            duplicate: true,
            message: 'Event already processed'
          }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        // If collection doesn't exist, it will be created on first insert
        console.log('[STRIPE-WEBHOOK] No previous processing records found');
      }

      // STEP 5: RECORD PROCESSING START - For idempotency and race condition handling
      try {
        await sdk.data.insert('webhook_processing', {
          eventId: eventId,
          type: event.type,
          status: 'processing',
          startedAt: new Date(),
          idempotencyKey: idempotencyKey || null,
          livemode: event.livemode
        });
      } catch (insertError: any) {
        // Handle race condition where another instance already inserted
        if (insertError.message?.includes('duplicate') || insertError.code === 11000) {
          console.log('[STRIPE-WEBHOOK] Concurrent processing detected, aborting');
          return new Response(JSON.stringify({
            received: true,
            duplicate: true,
            message: 'Event being processed by another instance'
          }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        // Log but continue if it's a different error
        console.error('[STRIPE-WEBHOOK] Failed to record processing start:', insertError);
      }

      // STEP 6: PROCESS WEBHOOK - Handle different Stripe event types
      let processingResult = { success: true, error: null as any };
      
      try {
        switch (event.type) {
          
          // === PAYMENT COMPLETED ===
          case 'checkout.session.completed': {
            const session = event.data.object;
            
            // Extract metadata (set during checkout creation)
            const userId = session.metadata?.userId || session.client_reference_id;
            const planType = session.metadata?.planType || 'default';
            
            console.log('[STRIPE-WEBHOOK] Checkout completed:', {
              sessionId: session.id,
              userId: userId,
              customerId: session.customer,
              amount: session.amount_total / 100, // Convert cents to dollars
              currency: session.currency
            });
            
            // TODO: Implement your business logic here
            // Example patterns:
            
            // 1. Store payment record
            // await sdk.data.insert('payments', {
            //   userId: userId,
            //   stripeSessionId: session.id,
            //   stripeCustomerId: session.customer,
            //   amount: session.amount_total / 100,
            //   currency: session.currency,
            //   status: 'completed',
            //   webhookEventId: eventId,
            //   createdAt: new Date()
            // });
            
            // 2. Update user subscription status
            // await sdk.data.raw('users', 'updateOne', {
            //   query: { _id: userId },
            //   update: { 
            //     $set: { 
            //       isPremium: true,
            //       stripeCustomerId: session.customer,
            //       subscriptionType: planType,
            //       lastPaymentDate: new Date()
            //     }
            //   }
            // });
            
            break;
          }

          // === SUBSCRIPTION CREATED/UPDATED ===
          case 'customer.subscription.created':
          case 'customer.subscription.updated': {
            const subscription = event.data.object;
            
            console.log('[STRIPE-WEBHOOK] Subscription changed:', {
              subscriptionId: subscription.id,
              customerId: subscription.customer,
              status: subscription.status,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000)
            });
            
            // TODO: Update subscription records
            // Example:
            // await sdk.data.raw('subscriptions', 'updateOne', {
            //   query: { stripeSubscriptionId: subscription.id },
            //   update: {
            //     $set: {
            //       status: subscription.status,
            //       currentPeriodStart: new Date(subscription.current_period_start * 1000),
            //       currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            //       webhookEventId: eventId,
            //       updatedAt: new Date()
            //     }
            //   },
            //   options: { upsert: true }
            // });
            
            break;
          }

          // === SUBSCRIPTION CANCELLED ===
          case 'customer.subscription.deleted': {
            const subscription = event.data.object;
            
            console.log('[STRIPE-WEBHOOK] Subscription cancelled:', {
              subscriptionId: subscription.id,
              customerId: subscription.customer
            });
            
            // TODO: Handle subscription cancellation
            // Example:
            // await sdk.data.raw('subscriptions', 'updateOne', {
            //   query: { stripeSubscriptionId: subscription.id },
            //   update: { 
            //     $set: { 
            //       status: 'cancelled',
            //       canceledAt: new Date(),
            //       webhookEventId: eventId
            //     }
            //   }
            // });
            
            // Update user status if userId available
            // if (subscription.metadata?.userId) {
            //   await sdk.data.raw('users', 'updateOne', {
            //     query: { _id: subscription.metadata.userId },
            //     update: { 
            //       $set: { 
            //         isPremium: false,
            //         subscriptionEndedAt: new Date()
            //       }
            //     }
            //   });
            // }
            
            break;
          }

          // === PAYMENT SUCCEEDED ===
          case 'invoice.payment_succeeded': {
            const invoice = event.data.object;
            
            console.log('[STRIPE-WEBHOOK] Payment succeeded:', {
              invoiceId: invoice.id,
              customerId: invoice.customer,
              amount: invoice.amount_paid / 100
            });
            
            // TODO: Record successful payment
            // Example:
            // await sdk.data.insert('invoice_payments', {
            //   invoiceId: invoice.id,
            //   customerId: invoice.customer,
            //   subscriptionId: invoice.subscription,
            //   amount: invoice.amount_paid / 100,
            //   currency: invoice.currency,
            //   status: 'succeeded',
            //   webhookEventId: eventId,
            //   paidAt: new Date()
            // });
            
            break;
          }

          // === PAYMENT FAILED ===
          case 'invoice.payment_failed': {
            const invoice = event.data.object;
            
            console.log('[STRIPE-WEBHOOK] Payment failed:', {
              invoiceId: invoice.id,
              customerId: invoice.customer,
              attemptCount: invoice.attempt_count
            });
            
            // TODO: Handle payment failure
            // Example:
            // await sdk.data.insert('payment_failures', {
            //   invoiceId: invoice.id,
            //   customerId: invoice.customer,
            //   amount: invoice.amount_due / 100,
            //   attemptCount: invoice.attempt_count,
            //   nextAttempt: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000) : null,
            //   webhookEventId: eventId,
            //   failedAt: new Date()
            // });
            
            // TODO: Send notification to user about payment failure
            
            break;
          }

          // === UNHANDLED EVENTS ===
          default:
            console.log('[STRIPE-WEBHOOK] Unhandled event type:', event.type);
            // It's okay to ignore events you don't need
        }
      } catch (processingError: any) {
        processingResult = { 
          success: false, 
          error: processingError.message || 'Unknown processing error' 
        };
        console.error('[STRIPE-WEBHOOK] Error processing event:', processingError);
      }

      // STEP 7: UPDATE PROCESSING RECORD - Mark as completed or failed
      try {
        await sdk.data.raw('webhook_processing', 'updateOne', {
          query: { eventId: eventId },
          update: { 
            $set: { 
              status: processingResult.success ? 'completed' : 'failed',
              completedAt: new Date(),
              error: processingResult.error,
              processingTimeMs: Date.now() - (event.created * 1000)
            } 
          }
        });
      } catch (updateError) {
        console.error('[STRIPE-WEBHOOK] Failed to update processing record:', updateError);
      }

      // STEP 8: RETURN RESPONSE
      if (!processingResult.success) {
        // Return 500 to trigger Stripe retry
        return new Response(JSON.stringify({
          error: 'Processing failed',
          message: processingResult.error
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      console.log('[STRIPE-WEBHOOK] Event processed successfully');
      return new Response(JSON.stringify({
        received: true,
        eventId: eventId,
        type: event.type
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error: any) {
      // Log detailed error for debugging
      console.error('[STRIPE-WEBHOOK] Processing error:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        timestamp: new Date().toISOString()
      });
      
      // Return 500 to indicate processing failure
      // Stripe may retry the webhook based on your settings
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error?.message
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};