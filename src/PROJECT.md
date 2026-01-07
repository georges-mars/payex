# PROJECT CONTEXT

<!-- METADATA_START -->
Last-Summarized-Message: ffabbd1a-ae13-49c7-80c5-e5647381a83a
Last-Updated: 2026-01-02T23:35:39.942Z
Summarization-Version: 1.0
<!-- METADATA_END -->

## DECISION TREE
<!-- DECISION_TREE_START -->
Payvex
├── [2026-01-02T23:22:23.116Z] Product: A professional, production-ready UI for Payvex, a modern fintech mobile payment platform
├── [2026-01-02T23:25:28.149Z] Target Audience: Professionals and individuals aged 25-45 managing multiple payment accounts (M-Pesa, banks, trading apps like Deriv)
├── [2026-01-02T23:25:28.149Z] Core Value Proposition: Unified platform to manage multiple financial accounts securely with streamlined money management
├── [2026-01-02T23:25:28.149Z] Major Features: Authentication system, unified dashboard, multiple account linking (M-Pesa, bank, trading apps), money transfer, transaction history, deposits & withdrawals, KYC verification, notifications, subscription management
├── [2026-01-02T23:25:28.149Z] Business Model: Monthly subscription with free tier and premium tier ($9.99-$14.99/month) unlocking advanced features
└── [2026-01-02T23:25:28.149Z] Design Style: Modern fintech aesthetic with professional blue (#0A3B7F), teal accents, bold sans-serif typography, and WCAG 2.1 AA accessibility compliance
<!-- DECISION_TREE_END -->

## PROJECT SPECIFICATIONS
<!-- PROJECT_SPECS_START -->
1. CORE FEATURES
- Comprehensive authentication: email/password, Google OAuth, secure session, "Remember me", logout
- Dashboard: personalized greeting, total balance of all linked accounts, quick action buttons (Send, Request, Deposit, Withdraw), recent transactions with status badges, account summary
- Accounts management: view linked accounts (M-Pesa, bank, trading apps), validation, linking new accounts, detailed account and transaction history views
- Transactions: full history with filters (date, type, status, amount), detailed receipts, retry for failed transactions
- Money transfer: send and request money with recipient selection, amount and currency input, payment method, notes, confirmation
- Deposits & withdrawals: select method, input amount, view instructions, confirmation, status tracking
- User profile: personal info, KYC with document upload and verification progress, security settings (password, 2FA, login history), preferences (currency, notifications, language, theme)
- Notifications: in-app toasts/banners, notification center with timestamps
- Subscription management: free and premium tiers with feature gating and upgrades

2. USER FLOWS
- Default app flow: Splash → Auth (if not logged in) → Onboarding (KYC for first-time) → Main Dashboard → Link Accounts
- Authentication flow with sign-up, sign-in, Google OAuth, persistent sessions, logout
- Account linking with forms and validation, including M-Pesa phone and bank account verification
- Money transfers: send/request with recipient input, confirmation screens
- Deposit and withdrawal workflows with method selection, confirmation, and real-time status updates
- Profile management including KYC document uploads and security preferences
- Notification interaction via toasts and notification center
- Subscription upgrade prompts with premium feature access

3. BUSINESS RULES
- Minimum password length: 6 characters
- KYC verification required for withdrawals and high-value transfers
- Subscription tiers with different transaction limits and feature access
- Session handling must be secure with persistent login

4. UI/UX REQUIREMENTS
- Modern fintech professional look with deep blue primary (#0A3B7F) and teal accent (#00D4FF)
- Typography: bold modern sans-serif for headlines, readable sans-serif for body, monospace for amounts and IDs
- Generous whitespace and clear visual hierarchy
- Consistent iconography (Lucide, Feather or similar)
- Responsive, mobile-first design
- WCAG 2.1 AA accessibility compliance (color contrast, keyboard navigation, screen reader support)
- Fast load times and smooth animations
- Clear error handling and user help feedback
<!-- PROJECT_SPECS_END -->
