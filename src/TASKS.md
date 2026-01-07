# Tasks & Specs

*Updated: 2026-01-02T23:48:21.001Z*

## ✅ Completed

### Create Edge Functions for Account Linking (technical)
ID: edge-functions

**User Story:** As a developer, I have edge functions ready for API credentials to enable real account linking

**Specs:**
- [ ] 3.1. Create link-mpesa-account function with Daraja API structure
- [ ] 3.2. Create link-bank-account function with Plaid structure
- [ ] 3.3. Create link-trading-account function with Deriv/Binance structure
- [ ] 3.4. Add proper error handling and validation
- [ ] 3.5. Document required API credentials in each function

### Wire Navigation for Account Linking (technical)
ID: navigation-update

**User Story:** As a user, I can navigate to account linking from multiple places in the app

**Specs:**
- [ ] 4.1. Add LinkAccount route to RootNavigator
- [ ] 4.2. Update HomeScreen Add button to navigate to LinkAccount
- [ ] 4.3. Update AccountsScreen Add button to navigate to LinkAccount

### Create Account Linking UI (screen)
ID: link-account-ui

**User Story:** As a user, I can link M-Pesa, bank accounts, and trading platforms through real forms

**Specs:**
- [ ] 2.1. Create LinkAccountScreen with tab navigation
- [ ] 2.2. Build M-Pesa linking form (phone, PIN validation)
- [ ] 2.3. Build bank account form (account number, bank selection, routing)
- [ ] 2.4. Build trading platform form (platform selection, API keys)
- [ ] 2.5. Add form validation and error handling

### Add Logo Throughout App (feature)
ID: logo-enhancement

**User Story:** As a user, I see the Payvex logo consistently across the app for brand recognition

**Specs:**
- [ ] 1.1. Add logo to ProfileScreen header
- [ ] 1.2. Add logo to empty states (accounts, transactions)
- [ ] 1.3. Add logo to SendMoneyScreen header

