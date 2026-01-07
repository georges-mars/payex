// TODO: This function is not deployed yet. This is a starter template.
// In order to deploy, make changes using the editFile tool and it will be auto deployed.
// Note: Logs arrive ~2 minutes later in getFunctionLogs.

import { MagicallySDK } from 'magically-sdk';

/**
 * HEALTH CHECK WITH JWT AUTHENTICATION
 * 
 * Shows how to authenticate users via JWT in edge functions.
 * Key pattern: Use sdk.auth.getUser(request) to extract user from JWT token.
 */

interface Env {
  MAGICALLY_PROJECT_ID: string;
  MAGICALLY_API_BASE_URL: string;
  MAGICALLY_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Initialize SDK with API key for edge environment
    const sdk = new MagicallySDK({
      projectId: env.MAGICALLY_PROJECT_ID,
      apiUrl: env.MAGICALLY_API_BASE_URL,
      apiKey: env.MAGICALLY_API_KEY  // Required for data operations
    });

    try {
      // CRITICAL PATTERN: Authenticate user from JWT token
      // This extracts JWT from Authorization header
      const { user } = await sdk.auth.getUser(request);
      
      if (!user) {
        return new Response(JSON.stringify({ 
          status: 'healthy',
          authenticated: false,
          message: 'No authentication provided'
        }), { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // User authenticated successfully
      console.log('Authenticated user:', user._id);

      // Now you can perform user-specific operations
      
      // Example 1: Check user data
      // const userData = await sdk.data.query('user_profiles', {
      //   userId: user._id
      // }, { limit: 1 });
      
      // Example 2: Use LLM in edge function
      // const aiResponse = await sdk.llm.invoke(
      //   "Generate a welcome message",
      //   { model: "openai/gpt-4o-mini" }
      // );
      
      // Example 3: List user's files
      // const userFiles = await sdk.files.list({
      //   limit: 10,
      //   tags: ['profile-images']
      // });

      return new Response(JSON.stringify({ 
        status: 'healthy',
        authenticated: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name
        }
        // hasProfile: userData.data.length > 0
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error: any) {
      return new Response(JSON.stringify({ 
        status: 'error',
        message: error.message
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};