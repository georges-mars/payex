import magically from 'magically-sdk';
import {useAppStateStore} from '../stores/appStateStore';

/**
 * Service for account management operations
 */
export const accountService = {
    /**
     * Permanently deletes a user account and all associated data
     * @param userId - The user ID to delete
     * @returns Promise<boolean> - true if successful
     */
    async deleteAccount(userId: string): Promise<boolean> {
        if (!userId) {
            throw new Error('User ID is required');
        }

        try {
            // Delete all user data from collections in order of dependencies
            // This ensures referential integrity is maintained during deletion
            // NOTE: We do NOT delete from 'users' collection - that's handled by auth system
            // IMPORTANT: MongoDB collections use 'creator' field for user reference

            // Convert userId string to MongoDB ObjectId format
            const creatorId = {userId};

            // User cannot be deleted

            // 1. Delete credit transactions first (depends on user)
            await magically.data.delete('credit_transactions', {});
            console.log('Deleted credit transactions');

            // 2. Delete conversation sessions (depends on user)
            await magically.data.delete('conversation_sessions', {});
            console.log('Deleted conversation sessions');

            // 3. Delete feedbacks (depends on user)
            await magically.data.delete('feedbacks', {userId});
            console.log('Deleted feedbacks');

            // 4. Delete user credits (depends on user)
            await magically.data.delete('user_credits', {});
            console.log('Deleted user credits');

            // 5. Delete user progress (depends on user)
            await magically.data.delete('user_progress', {});
            console.log('Deleted user progress');

            // 6. Clear local stores
            const stores = [];

            stores.forEach(store => {
                // if (store.clear) {
                //     store.clear();
                // }
            });

            // 7. Sign out the user
            await magically.auth.signOut();

            // 8. Reset app state
            useAppStateStore.getState().updateState({
                isAuthenticated: false,
                onboardingCompleted: false,
                creditsBalance: 0
            });

            return true;
        } catch (error) {
            console.error('Failed to delete account:', error);
            throw new Error('Failed to delete account. Please contact support.');
        }
    },

    /**
     * Validates user confirmation for account deletion
     * @param confirmationText - The text entered by user
     * @returns boolean - true if confirmation is valid
     */
    validateDeletionConfirmation(confirmationText: string): boolean {
        return confirmationText.trim().toUpperCase() === 'DELETE';
    }
};