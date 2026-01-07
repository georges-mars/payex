import { MagicallySDK } from 'magically-sdk';

interface Env {
  MAGICALLY_PROJECT_ID: string;
  MAGICALLY_API_BASE_URL: string;
  MAGICALLY_API_KEY: string;
  STRIPE_SECRET_KEY: string;
}

interface CheckoutRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

/**
 * Create Stripe Checkout Session
 * 
 * This function creates a Stripe checkout session for subscription payments.
 * It requires the user to be authenticated and includes user metadata in the session.
 * 
 * Required secrets:
 * - STRIPE_SECRET_KEY: Your Stripe secret key (test or live)
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    console.log('[STRIPE-CHECKOUT] Function invoked');
    
    // Initialize Magically SDK
    const magically = new MagicallySDK({
      projectId: env.MAGICALLY_PROJECT_ID,
      apiUrl: env.MAGICALLY_API_BASE_URL,
      apiKey: env.MAGICALLY_API_KEY
    });
    
    try {
      console.log('[STRIPE-CHECKOUT] Authenticating user...');
      
      // Authenticate user
      const { user } = await magically.auth.getUser(request);
      if (!user) {
        console.log('[STRIPE-CHECKOUT] Authentication failed - no user');
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      console.log('[STRIPE-CHECKOUT] User authenticated:', user._id);

      // Parse request body
      const { priceId, successUrl, cancelUrl, metadata = {} } = await request.json() as CheckoutRequest;
      console.log('[STRIPE-CHECKOUT] Request data:', { priceId, successUrl, cancelUrl, userId: user._id });

      if (!priceId) {
        console.log('[STRIPE-CHECKOUT] Validation failed - missing priceId');
        return new Response(JSON.stringify({ error: 'Price ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Create Stripe checkout session
      console.log('[STRIPE-CHECKOUT] Creating Stripe checkout session...');
      const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'payment_method_types[0]': 'card',
          'line_items[0][price]': priceId,
          'line_items[0][quantity]': '1',
          'mode': 'subscription',
          'success_url': successUrl,
          'cancel_url': cancelUrl,
          'client_reference_id': user._id,
          'customer_email': user.email,
          'metadata[userId]': user._id,
          'metadata[projectId]': env.MAGICALLY_PROJECT_ID,
          ...Object.entries(metadata).reduce((acc, [key, value], index) => ({
            ...acc,
            [`metadata[${key}]`]: value
          }), {})
        })
      });

      if (!stripeResponse.ok) {
        const error = await stripeResponse.text();
        console.error('[STRIPE-CHECKOUT] Stripe API error:', {
          status: stripeResponse.status,
          statusText: stripeResponse.statusText,
          error: error
        });
        return new Response(JSON.stringify({ error: 'Payment session creation failed' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const session = await stripeResponse.json();
      console.log('[STRIPE-CHECKOUT] Checkout session created successfully:', {
        sessionId: session.id,
        customerId: session.customer,
        userId: user._id
      });

      return new Response(JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error: any) {
      console.error('[STRIPE-CHECKOUT] Unexpected error:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        timestamp: new Date().toISOString()
      });
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};