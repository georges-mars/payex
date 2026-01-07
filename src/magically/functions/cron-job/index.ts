// TODO: This function is not deployed yet. This is a starter template.
// In order to deploy, make changes using the editFile tool and it will be auto deployed.
// Note: Logs arrive ~2 minutes later in getFunctionLogs.

import { MagicallySDK } from 'magically-sdk';

/**
 * CRON JOB TEMPLATE
 * 
 * IMPORTANT: Cron jobs ONLY support API key authentication.
 * JWT tokens expire and cannot be used for scheduled tasks.
 * 
 * COST WARNING: Frequent cron jobs cost more money!
 * Recommended schedules:
 * - Daily: "0 0 * * *" (midnight UTC)
 * - Weekly: "0 0 * * 0" (Sunday midnight UTC)
 * - Monthly: "0 0 1 * *" (1st of month midnight UTC)
 * 
 * See platform webhook handler for complex integrations:
 * @src/app/api/webhooks/stripe/
 */

interface Env {
  MAGICALLY_PROJECT_ID: string;
  MAGICALLY_API_BASE_URL: string;
  MAGICALLY_API_KEY: string;  // Required for cron jobs
}

interface ScheduledController {
  scheduledTime: number;
  cron: string;
  noRetry(): void;
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const timestamp = new Date(controller.scheduledTime).toISOString();
    console.log(`[CRON] Executed at ${timestamp}, pattern: ${controller.cron}`);
    
    try {
      // Initialize SDK with API key (required for cron)
      const sdk = new MagicallySDK({
        projectId: env.MAGICALLY_PROJECT_ID,
        apiUrl: env.MAGICALLY_API_BASE_URL,
        apiKey: env.MAGICALLY_API_KEY
      });

      // TODO: Add your scheduled task logic here
      // Example: Clean up old data
      // const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      // await sdk.data.raw('temp_data', 'deleteMany', {
      //   query: { createdAt: { $lt: thirtyDaysAgo } }
      // });

      // Log successful execution
      await sdk.data.insert('cron_logs', {
        job: 'example-cron',
        executedAt: new Date(controller.scheduledTime),
        status: 'success'
      });

    } catch (error) {
      console.error('[CRON] Failed:', error);
      controller.noRetry(); // Prevent retry to save costs
    }
  }
};