# Payvex - Project Architecture Guide

## Overview
Payvex is a professional fintech mobile application that unifies multiple financial accounts (M-Pesa, banks, trading platforms like Deriv) into one secure hub. Users can view balances, manage accounts, send/request money, and track transactions with a premium subscription model.

## Design System

### Color Palette
- **Primary**: `#0A3B7F` (Deep Blue) - Trust, security, professionalism
- **Secondary/Accent**: `#00D4FF` (Teal) - Modern, forward-thinking
- **Success**: `#10B981` (Green) - Completed transactions
- **Warning**: `#F59E0B` (Orange) - Pending transactions
- **Destructive**: `#EF4444` (Red) - Failed transactions

### Design Principles
- Professional fintech aesthetic with generous whitespace
- Status-coded elements (green/orange/red for transaction states)
- Modern sans-serif typography with clear hierarchy
- Trustworthy visual design with consistent iconography
- Mobile-first responsive design for iOS and Android

## Data Architecture

### Entities

#### LinkedAccount
Collection: `linked_accounts`
- User's connected financial accounts
- Account types: M-Pesa, bank, Deriv, Binance
- Stores balance, currency, status, account number (masked)
- User-scoped by default (private to each user)

#### Transaction  
Collection: `transactions`
- All money movements (send, receive, deposit, withdrawal, request)
- Links to LinkedAccount via `accountId`
- Stores amount, currency, status, recipient/sender info
- User-scoped by default (private to each user)

#### KYCDocument
Collection: `kyc_documents`
- User verification documents
- Document types: national_id, passport, drivers_license, proof_of_address
- Tracks verification status (pending, verified, rejected)

#### UserProfile
Collection: `user_profiles`
- User profile information
- Subscription tier (free, premium)
- KYC status
- Notification and security preferences
- Idempotent (one profile per user)

### Data Patterns
```typescript
// Query user's accounts
const accounts = await LinkedAccounts.query({}, { sort: { linkedDate: -1 } });

// Query user's transactions
const transactions = await Transactions.query({}, { 
  sort: { transactionDate: -1 }, 
  limit: 50 
});

// Create transaction
const transaction = await Transactions.create({
  transactionType: 'send',
  amount: 5000,
  currency: 'KES',
  status: 'completed',
  recipientName: 'John Doe',
  accountId: account._id,
  accountName: account.accountName,
  transactionDate: new Date().toISOString(),
  reference: `TXN-${Date.now()}`
});
```

## State Management

### Zustand Store: `payvexStore.ts`
Centralized state for financial data:
- `accounts[]` - All linked accounts
- `transactions[]` - Transaction history
- `isLoadingAccounts/isLoadingTransactions` - Loading states
- `selectedAccount` - Currently selected account for operations

**Methods:**
- `getTotalBalance()` - Calculates combined balance across all accounts (converts USD to KES)
- `getRecentTransactions(limit)` - Returns most recent transactions

**Pattern:**
```typescript
const { accounts, transactions, getTotalBalance, setTransactions } = usePayvexStore();

// Load data
const result = await LinkedAccounts.query();
setAccounts(result.data);

// Calculate total
const total = getTotalBalance();
```

## Navigation Architecture

### Tab Navigation (MainTabNavigator)
4 main tabs (no params allowed):
1. **Home** - Dashboard with balance overview and quick actions
2. **Accounts** - Manage linked accounts
3. **Transactions** - Transaction history with filters
4. **Profile** - User profile, settings, subscription

### Stack Navigation (RootNavigator)
Detail screens in stack (can have params):
- **SendMoney** - Transfer money flow
- **Feedback** - User feedback screen

**Flow:**
```
Auth: Login → MainTabs (Home)
Action: Home → SendMoney (stack) → Back to Home
```

## Screen Architecture

### HomeScreen.tsx (Dashboard)
- Personalized greeting with user name
- Total balance card (gradient design)
- Quick action buttons (Send, Request, Add)
- Connected accounts preview (top 3)
- Recent transactions preview (last 5)
- Pull-to-refresh support
- Empty states for no accounts/transactions

### AccountsScreen.tsx
- Combined balance summary with visibility toggle
- List of all linked accounts with details
- Account status indicators (active/inactive/pending)
- Default account highlighting
- Add account button (placeholder)
- Balance visibility toggle (show/hide)

### TransactionsScreen.tsx
- Comprehensive transaction history
- Type filters (all, send, receive, deposit, withdrawal)
- Status filters (all, completed, pending, failed)
- Color-coded status badges
- Transaction details dialog
- Empty state with filter reset

### SendMoneyScreen.tsx
- Account selection (visual cards)
- Recipient name input
- Amount input with balance validation
- Optional description field
- Processing state with spinner
- Creates transaction and updates store
- Success confirmation with navigation back

### ProfileScreen.tsx
- User info card with avatar
- Subscription tier badge (Free/Premium)
- Upgrade to Premium CTA
- Menu items: Feedback, Notifications, Security
- Sign out button
- Delete account button (with confirmation)
- App version footer

### LoginScreen.tsx
- Professional auth UI (pre-built)
- Google, Apple, Email authentication
- Animated entrance effects
- Security badges (Secure, Private, Verified)

## Component Patterns

### Theme Usage
```typescript
const theme = useTheme();

// Colors
<View style={{ backgroundColor: theme.cardBackground }}>
<Text style={{ color: theme.text }}>

// Consistent values
borderRadius: 18,
shadowColor: theme.cardShadowColor,
borderColor: theme.borderLight
```

### Status Colors
```typescript
const getStatusColor = (status: string) => {
  switch(status) {
    case 'completed': return '#10B981'; // Green
    case 'pending': return '#F59E0B';    // Orange
    case 'failed': return '#EF4444';     // Red
    default: return theme.textMuted;
  }
};
```

### Icons
From `lucide-react-native`:
- **Wallet**: Generic accounts, M-Pesa, banks
- **TrendingUp**: Trading platforms (Deriv, Binance)
- **ArrowUpRight**: Send, outgoing transactions
- **ArrowDownLeft**: Receive, incoming transactions
- **CheckCircle2**: Completed status
- **Clock**: Pending status
- **AlertCircle**: Failed status

### Haptics
```typescript
import * as Haptics from 'expo-haptics';

// Light tap feedback
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium feedback for important actions
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
```

### Alerts
```typescript
import { MagicallyAlert } from '../components/ui/MagicallyAlert';

MagicallyAlert.alert('Title', 'Message');

MagicallyAlert.alert('Confirm?', 'Are you sure?', [
  { text: 'Cancel', style: 'cancel' },
  { text: 'OK', onPress: () => handleAction() }
]);
```

## Business Logic

### Transaction Creation
1. Validate inputs (recipient, amount, account)
2. Check sufficient balance
3. Create transaction with `Transactions.create()`
4. Update store with new transaction
5. Show success message
6. Navigate back

### Balance Calculation
- Converts all balances to KES for total
- USD to KES rate: 1 USD = 130 KES
- Individual accounts show in their native currency

### Currency Display
```typescript
{account.currency} {account.balance.toLocaleString('en-US', { 
  minimumFractionDigits: 2,
  maximumFractionDigits: 2 
})}
```

## Future Features (Roadmap)

### Planned Enhancements
1. Additional trading platform integrations (Binance, eToro)
2. AI-powered spending insights and recommendations
3. Recurring payments and scheduled transfers
4. Multi-currency support with live exchange rates
5. Bill payment integrations
6. P2P payment requests with QR codes
7. Expense categorization and budgeting
8. Export transaction history (CSV/PDF)

### Premium Features ($9.99-$14.99/month)
- Unlimited linked accounts (vs 3 on free)
- Trading platform integrations
- Advanced analytics dashboard
- Priority customer support
- Higher transaction limits
- Premium badge

## Technical Stack

- **Framework**: React Native (Expo)
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State Management**: Zustand
- **Authentication**: Magically SDK (Google, Apple, Email)
- **Data**: MongoDB-style collections via Magically SDK
- **Theme**: Custom theme system with light/dark modes
- **Icons**: lucide-react-native
- **UI**: Custom components with inline styles

## Development Guidelines

### Screen Size Limit
Keep screens under 300 lines. Extract:
- Complex logic → services/
- Reusable UI → components/
- State → stores/

### Naming Conventions
- Screens: `PascalCase.tsx` (e.g., `HomeScreen.tsx`)
- Components: `PascalCase.tsx` (e.g., `Button.tsx`)
- Stores: `camelCase.ts` (e.g., `payvexStore.ts`)
- Services: `camelCase.ts` (e.g., `transactionService.ts`)

### Data Operations
```typescript
// Always use entity methods
await LinkedAccounts.create({ ... })  // ✅
await Transactions.query({ ... })     // ✅

// NOT MongoDB methods
await magically.data.insert(...)      // ❌
```

### Reactive Updates
```typescript
// Screens don't call each other
// Data flows through stores

// ✅ Good: Update store, other screens react
const newTransaction = await Transactions.create(...);
setTransactions([newTransaction, ...transactions]);

// ❌ Bad: Manually refresh other screens
navigation.navigate('Transactions', { refresh: true });
```

## Security Considerations

- User data is private by default (user-scoped collections)
- No `isPublic: true` needed for financial data
- Account numbers are masked (****5432)
- KYC documents stored securely with verification status
- Authentication required for all app features
- Account deletion follows platform guidelines

## Testing Checklist

- [ ] Login with Google/Apple/Email works
- [ ] Dashboard shows total balance correctly
- [ ] Accounts list shows all linked accounts
- [ ] Transaction history displays with correct filters
- [ ] Send money validates amount and balance
- [ ] Transaction appears immediately after creation
- [ ] ProfileScreen shows subscription options
- [ ] Feedback link navigates correctly
- [ ] Account deletion confirmation works
- [ ] Sign out returns to login screen
- [ ] Pull-to-refresh updates data
- [ ] Empty states display appropriately

## Common Patterns

### Loading State
```typescript
const [isLoading, setIsLoading] = useState(false);

// Show skeleton
{isLoading ? (
  <Skeleton width="100%" height={80} />
) : (
  <AccountCard />
)}
```

### Empty State
```typescript
{items.length === 0 ? (
  <View style={{ padding: 48, alignItems: 'center' }}>
    <Icon size={48} color={theme.textLight} />
    <Text style={{ color: theme.textMuted }}>
      No items found
    </Text>
  </View>
) : (
  <ItemList />
)}
```

### Refresh Pattern
```typescript
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  await loadData();
  setRefreshing(false);
};

<ScrollView
  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
>
```

This guide ensures consistent development patterns and maintains the professional fintech aesthetic throughout the Payvex application.
