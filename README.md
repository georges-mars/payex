# Payvex

**Exported from Magically.life**
**Project ID:** `90baa289-0ae1-421e-b59c-4e9e60105c6e`
**Export Date:** 2026-01-02T23:55:28.125Z

## 🎉 What You Got

This is a **complete, working React Native/Expo application** exported from Magically. You can:

- ✅ **Run immediately** with `npm start` or `expo start`
- ✅ **Deploy to app stores** using Expo Application Services (EAS)
- ✅ **Modify and customize** all source code
- ✅ **Use the Magically SDK** (already included in package.json)

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun start

# Or use Expo CLI
npx expo start
```

## 📱 What's Included

### App Structure
- **`src/`** - Your generated app code
- **`assets/`** - Images, icons, and other assets
- **`package.json`** - All dependencies including Magically SDK
- **`app.json`** - Expo configuration
- **`magically.json`** - Project manifest and file hashes

### Key Features
- **Magically SDK** - Pre-configured and ready to use
- **Authentication** - OAuth integration with Magically platform
- **Data Management** - MongoDB operations with user isolation
- **LLM Integration** - AI capabilities for text, chat, and images
- **File Management** - Upload and manage files with metadata

## 🔧 Current Configuration

Your app is currently configured to use **Magically's hosted services**:

- **Authentication:** Magically OAuth (`https://magically.life`)
- **Database:** Magically MongoDB (project-scoped)
- **LLM Services:** Magically AI proxy (OpenAI, etc.)
- **File Storage:** Magically file storage (Vercel Blob)

## 🏗️ Self-Hosting (Advanced)

Want to run your own backend? Here's what you'll need to set up:

### 1. Authentication Service
- **Option A:** Firebase Auth, Supabase Auth, Auth0
- **Option B:** Custom OAuth server
- **Required:** JWT token generation compatible with Magically SDK

### 2. Database
- **Option A:** MongoDB Atlas, MongoDB self-hosted
- **Option B:** PostgreSQL with Supabase, PlanetScale
- **Required:** User isolation, standard fields (`_id`, `creator`, `createdAt`, `updatedAt`)

### 3. LLM Services
- **Option A:** Direct OpenAI API, Anthropic API
- **Option B:** Azure OpenAI, AWS Bedrock
- **Required:** Text generation, chat, image generation endpoints

### 4. File Storage
- **Option A:** AWS S3, Google Cloud Storage
- **Option B:** Cloudinary, Vercel Blob
- **Required:** Upload, list, delete operations with metadata

### 5. Backend API
You'll need to implement these API endpoints to match the Magically SDK interface:

```
/api/project/[projectId]/auth/refresh     # Token refresh
/api/project/[projectId]/data/query       # Data queries
/api/project/[projectId]/data/insert      # Data insertion
/api/project/[projectId]/data/update      # Data updates
/api/project/[projectId]/data/delete      # Data deletion
/api/project/[projectId]/data/aggregate   # Aggregation
/api/project/[projectId]/data/raw         # Raw operations
/api/project/[projectId]/llm/invoke       # Text generation
/api/project/[projectId]/llm/chat         # Chat completion
/api/project/[projectId]/llm/image        # Image generation
/api/project/[projectId]/data/files       # File operations
```

## 🔐 Environment Variables

If self-hosting, you'll need these environment variables:

```bash
# Database
MONGODB_CONNECTION_STRING=mongodb://...
# or
DATABASE_URL=postgresql://...

# Authentication
GOOGLE_OAUTH_CLIENT_ID=your_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
JWT_SECRET=your_jwt_secret

# LLM Services
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...

# File Storage
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket
# or
VERCEL_BLOB_READ_WRITE_TOKEN=vercel_...

# Email (optional)
RESEND_API_KEY=re_...
```

## 📚 Documentation

- **Magically SDK Docs:** [https://docs.magically.life](https://docs.magically.life)
- **Expo Documentation:** [https://docs.expo.dev](https://docs.expo.dev)
- **React Native Docs:** [https://reactnative.dev](https://reactnative.dev)

## 🤔 Why Self-Host?

**Pros:**
- Complete control over your infrastructure
- No vendor lock-in concerns
- Custom integrations and modifications
- Data sovereignty

**Cons:**
- Complex setup and maintenance
- Security and compliance responsibility
- No automatic updates or improvements
- Higher operational overhead

## 🆘 Need Help?

- **Magically Support:** [support@magically.life](mailto:support@magically.life)
- **Community Discord:** [https://discord.gg/magically](https://discord.gg/magically)
- **Documentation:** [https://docs.magically.life](https://docs.magically.life)

---

**Built with ❤️ by Magically**
*Making mobile app development magical*
