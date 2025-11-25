# Avvo MVP - Full Technical Design Specification

## 1. Project Overview

### 1.1 Project Identity

**Project Name:** Avvo - AI Helper for Avito

**Purpose:** Provide Avito sellers with an automated price optimizer, competitor analytics, and AI-powered chat agent to streamline operations and maximize revenue.

**Target Deployment:**
- Frontend: Netlify (static SPA deployment)
- Backend: Render or similar Node.js hosting platform
- Database: External PostgreSQL service

**Core Value Proposition:**
- Automate repetitive seller tasks on Avito marketplace
- Optimize pricing decisions using AI-driven competitor analysis
- Engage buyers automatically through intelligent chat responses
- Track performance metrics and analytics in real-time

### 1.2 Critical Language Requirement

**User Interface Language:** Russian (Русский)

All user-facing content must be in Russian:
- UI labels, buttons, navigation
- Error messages and validation feedback
- System notifications and alerts
- Dashboard statistics and analytics
- Chat messages and AI responses
- Email notifications
- Documentation visible to end-users

### 1.3 System Architecture Philosophy

The system follows a **decoupled SPA + REST API architecture**:

**Frontend Strategy:**
- Fully static React SPA with no server-side rendering
- All dynamic data fetched via REST API calls
- Environment-based backend URL configuration
- Client-side routing with fallback support

**Backend Strategy:**
- Stateless RESTful API
- Horizontal scalability through stateless design
- Database as single source of truth
- Background jobs for async operations

**Communication Pattern:**
- HTTPS-only in production
- JWT bearer token authentication
- CORS configuration for cross-origin requests
- JSON request/response format

### 1.4 Deployment Architecture

```mermaid
graph TB
    subgraph "User Access"
        Browser[Web Browser]
    end
    
    subgraph "Netlify CDN"
        Static[Static Assets<br/>HTML, JS, CSS]
    end
    
    subgraph "Render Platform"
        API[Express.js API<br/>Port: process.env.PORT]
        Jobs[Background Jobs<br/>node-cron]
    end
    
    subgraph "External Services"
        DB[(PostgreSQL<br/>Database)]
        Avito[Avito API]
        OpenAI[OpenAI API<br/>GPT-4o Mini]
    end
    
    Browser -->|HTTPS| Static
    Browser -->|REST API Calls| API
    API -->|SQL Queries| DB
    API -->|OAuth/REST| Avito
    API -->|Chat Completion| OpenAI
    Jobs -->|Periodic Polling| Avito
    Jobs -->|Update Records| DB
```

---

## 2. Frontend Design

### 2.1 Frontend Architecture Overview

**Technology Foundation:**
- React 18 with functional components and hooks
- Vite 5 as build tool and dev server
- TailwindCSS 3 for styling
- React Router v6 for navigation

**State Management Strategy:**
- Zustand for global client state (auth, UI preferences)
- TanStack Query v5 for server state management
- Local component state for UI-specific logic

**Key Architectural Decisions:**
- No server-side rendering (pure client-side SPA)
- Code splitting by route for optimal performance
- Lazy loading for non-critical components
- Progressive enhancement with loading states

### 2.2 Directory Structure

```
frontend/
├── public/
│   └── (static assets - images, icons)
├── src/
│   ├── assets/
│   │   └── (SVG, images used in code)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Layout.jsx
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   └── features/
│   │       ├── PriceChart.jsx
│   │       ├── CompetitorCard.jsx
│   │       ├── ChatBubble.jsx
│   │       └── ListingCard.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Listings.jsx
│   │   ├── PriceOptimizer.jsx
│   │   ├── Chat.jsx
│   │   ├── Analytics.jsx
│   │   └── Profile.jsx
│   ├── services/
│   │   ├── api.js (axios instance)
│   │   ├── auth.js
│   │   ├── listings.js
│   │   ├── competitors.js
│   │   ├── chat.js
│   │   └── analytics.js
│   ├── store/
│   │   ├── authStore.js
│   │   └── uiStore.js
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   └── constants.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── netlify.toml
├── .env.example
└── package.json
```

### 2.3 Core Pages and Features

#### 2.3.1 Dashboard Page

**Purpose:** Central hub displaying key metrics and quick actions

**Data Display:**
- Current subscription tier and expiry date
- Total active listings count
- Usage statistics (API calls, messages sent)
- Recent activity log (last 10 actions)
- Quick action buttons (add listing, view chats, run optimizer)

**Visual Components:**
- Statistics cards with icons
- Usage progress bars showing limits
- Mini charts for trends (last 7 days)
- Tariff upgrade prompts if near limits

**Data Sources:**
- GET /api/dashboard/stats - aggregated metrics
- GET /api/users/me - user profile and subscription
- GET /api/activity/recent - recent actions

#### 2.3.2 Listings Management

**Purpose:** View, filter, and manage synced Avito listings

**Features:**
- Display all listings in card or table view
- Filter by status (active, archived, pending)
- Search by title or ID
- Sort by price, views, date
- Sync button to refresh from Avito
- Individual listing actions (edit, archive, optimize price)

**Listing Card Information:**
- Thumbnail image
- Title
- Current price
- Competitor average price (if available)
- View count and message count
- Status badge
- Last updated timestamp

**Data Sources:**
- GET /api/listings - fetch all listings
- POST /api/listings/sync - trigger Avito sync
- PATCH /api/listings/:id - update listing

#### 2.3.3 Price Optimizer

**Purpose:** AI-powered price recommendations based on competitor analysis

**Workflow:**
1. User selects a listing from dropdown
2. System displays current price and competitor data
3. Chart shows price distribution among competitors
4. AI recommendation displayed with reasoning
5. User can accept or manually adjust suggested price
6. Apply button updates price on Avito

**Visual Components:**
- Listing selector (searchable dropdown)
- Current price display (large, prominent)
- Competitor price range chart (bar or scatter plot)
- AI recommendation card with explanation text
- Price adjustment input with validation
- Apply button with confirmation modal

**Data Visualizations:**
- Bar chart: competitor price distribution
- Line chart: price history over time
- Comparison indicators (red/green for below/above average)

**Data Sources:**
- GET /api/competitors?listing_id=X - competitor data
- POST /api/optimize/price - get AI recommendation
- PATCH /api/listings/:id/price - apply new price

#### 2.3.4 Chat Interface

**Purpose:** View and manage Avito chat messages with AI automation

**Layout:**
- Left sidebar: list of active chats (sorted by unread, then recent)
- Right panel: selected chat conversation thread
- Bottom input: reply composer with AI toggle

**Chat List Item:**
- Buyer name or ID
- Last message preview
- Timestamp
- Unread badge
- Listing thumbnail

**Conversation Thread:**
- Chat bubbles (distinct styling for buyer vs seller)
- Timestamp on each message
- AI-generated tag on auto-replies
- Loading indicator for pending messages

**AI Agent Controls:**
- Toggle switch: Enable/Disable AI for this chat
- Manual reply input field
- AI suggestion button (shows recommended reply)
- Send button (manual send or trigger AI)

**Data Sources:**
- GET /api/chats - list all chats
- GET /api/chats/:id/messages - fetch conversation
- POST /api/chats/:id/reply - send manual reply
- POST /api/chats/:id/ai-reply - trigger AI response

#### 2.3.5 Analytics Dashboard

**Purpose:** Visualize performance metrics and trends

**Metrics Displayed:**
- Total views per listing (bar chart)
- Message response rate (percentage)
- Price change impact on views (line chart)
- Competitor price changes over time (multi-line chart)
- AI message usage vs limit (progress bar)

**Filters:**
- Date range selector (last 7/30/90 days)
- Listing filter (all or specific)
- Export button (CSV download)

**Data Sources:**
- GET /api/analytics/listings - listing performance
- GET /api/analytics/chats - chat metrics
- GET /api/analytics/competitors - competitor trends

#### 2.3.6 Profile & Settings

**Purpose:** User account management and Avito API connection

**Sections:**

**Personal Information:**
- Email (display only)
- Full name (editable)
- Password change form

**Avito Integration:**
- Connection status indicator
- Token input field (encrypted on backend)
- Test connection button
- Disconnect button

**Subscription Information:**
- Current plan badge
- Expiry date
- Usage statistics
- Upgrade/downgrade buttons

**Data Sources:**
- GET /api/users/me - user profile
- PUT /api/users/profile - update profile
- POST /api/auth/avito-connect - save Avito token
- DELETE /api/auth/avito-disconnect - remove token

### 2.4 UI/UX Design Principles

**Visual Design:**
- Minimalist interface with ample whitespace
- Consistent color scheme:
  - Primary: Blue (#3B82F6)
  - Success: Green (#10B981)
  - Warning: Yellow (#F59E0B)
  - Danger: Red (#EF4444)
  - Neutral: Gray shades (#F3F4F6 to #1F2937)
- TailwindCSS utility classes for consistency

**Responsive Design Strategy:**
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Collapsible sidebar on mobile
- Stacked layouts for narrow screens
- Touch-friendly tap targets (min 44px)

**Interaction Patterns:**
- Loading skeletons during data fetch
- Optimistic UI updates where appropriate
- Confirmation modals for destructive actions
- Toast notifications for success/error feedback
- Disabled states with visual indicators

**Accessibility:**
- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus visible indicators
- Sufficient color contrast (WCAG AA)

### 2.5 Netlify Deployment Configuration

**Build Configuration (netlify.toml):**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

**Environment Variables (Netlify dashboard):**
- `VITE_API_URL` - Backend API base URL (e.g., https://avvo-api.onrender.com)
- `VITE_APP_NAME` - Application name
- `VITE_APP_VERSION` - Version identifier

**Build Process:**
1. Netlify detects push to main branch
2. Runs `npm install`
3. Executes `npm run build` (vite build)
4. Outputs static files to `/dist`
5. Deploys to CDN
6. Invalidates cache

**SPA Routing Support:**
The `redirects` rule ensures all routes (e.g., /dashboard, /listings) redirect to index.html, allowing React Router to handle navigation.

### 2.6 API Client Design

**Axios Instance Configuration:**

- Base URL from environment variable
- Automatic JWT token injection in Authorization header
- Request/response interceptors for error handling
- Retry logic for transient failures
- Request timeout configuration

**Error Handling Strategy:**

- Network errors: Show offline indicator
- 401 Unauthorized: Clear auth state, redirect to login
- 403 Forbidden: Show permission denied message
- 404 Not Found: Show not found page
- 429 Rate Limited: Show retry message with countdown
- 500 Server Error: Show generic error, log to console
- Validation errors (400): Display field-specific errors

**Request Flow:**

```mermaid
sequenceDiagram
    participant Component
    participant TanStack Query
    participant Axios Client
    participant Backend API
    
    Component->>TanStack Query: useQuery/useMutation
    TanStack Query->>Axios Client: HTTP Request
    Axios Client->>Axios Client: Add JWT Token
    Axios Client->>Backend API: HTTPS Request
    Backend API-->>Axios Client: Response
    Axios Client->>Axios Client: Handle Errors
    Axios Client-->>TanStack Query: Processed Data
    TanStack Query-->>Component: Update State
```

**Caching Strategy (TanStack Query):**

- Dashboard stats: Cache for 30 seconds
- Listings: Cache for 1 minute, refetch on focus
- Chat messages: Real-time polling every 10 seconds
- Analytics: Cache for 5 minutes
- User profile: Cache indefinitely, invalidate on update

### 2.7 State Management

**Zustand Store (authStore.js):**

Manages authentication state:
- Current user object
- JWT access token
- Refresh token
- Login/logout actions
- Token refresh mechanism
- Persistence to localStorage

**TanStack Query:**

Manages server state:
- Automatic caching
- Background refetching
- Stale-while-revalidate pattern
- Optimistic updates
- Mutation error rollback

**Local Component State:**

Used for:
- Form inputs
- Modal visibility
- Dropdown open/close
- UI toggles

---

## 3. Backend Design

### 3.1 Backend Architecture Overview

**Technology Foundation:**
- Node.js 18+ with ES Modules
- Express.js 4 framework
- PostgreSQL 14+ database
- JWT for authentication

**Architectural Principles:**
- Layered architecture: Routes → Controllers → Services → Models
- Separation of concerns
- Dependency injection where beneficial
- Error handling at middleware level

**Scalability Considerations:**
- Stateless API design (no session storage)
- Database connection pooling
- Background jobs decoupled from request cycle
- Horizontal scaling ready (multiple instances)

### 3.2 Directory Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── constants.js
│   │   └── migrate.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── listingsController.js
│   │   ├── chatController.js
│   │   ├── competitorController.js
│   │   ├── optimizerController.js
│   │   └── analyticsController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   └── validator.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Listing.js
│   │   ├── Competitor.js
│   │   ├── Chat.js
│   │   ├── Analytics.js
│   │   └── Subscription.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── listings.js
│   │   ├── chat.js
│   │   ├── competitors.js
│   │   ├── optimizer.js
│   │   └── analytics.js
│   ├── services/
│   │   ├── avitoApiService.js
│   │   ├── openaiService.js
│   │   ├── competitorParserService.js
│   │   └── priceOptimizerService.js
│   ├── jobs/
│   │   ├── competitorSync.js
│   │   ├── chatPoller.js
│   │   └── analyticsAggregator.js
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── encryption.js
│   │   ├── logger.js
│   │   └── validators.js
│   ├── app.js
│   └── server.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

### 3.3 API Endpoints Specification

#### 3.3.1 Authentication Endpoints

**POST /api/auth/register**

Purpose: Create new user account

| Aspect | Details |
|--------|--------|
| Request Body | `{ email: string, password: string, fullName?: string }` |
| Validation | Email format, password min 8 chars with uppercase/lowercase/digit |
| Success Response | `{ user: object, accessToken: string, refreshToken: string }` (201) |
| Side Effects | Create user record, create subscription with 14-day PRO trial |
| Error Cases | 400 (validation failed), 409 (email exists) |

**POST /api/auth/login**

Purpose: Authenticate existing user

| Aspect | Details |
|--------|--------|
| Request Body | `{ email: string, password: string }` |
| Process | Verify email exists, verify password with bcrypt |
| Success Response | `{ user: object, accessToken: string, refreshToken: string }` (200) |
| Error Cases | 401 (invalid credentials), 404 (user not found) |

**GET /api/auth/me**

Purpose: Retrieve current user profile

| Aspect | Details |
|--------|--------|
| Authentication | Required (JWT Bearer token) |
| Success Response | `{ id, email, fullName, createdAt, subscription }` (200) |
| Error Cases | 401 (not authenticated) |

**PUT /api/auth/profile**

Purpose: Update user profile

| Aspect | Details |
|--------|--------|
| Authentication | Required |
| Request Body | `{ fullName?: string, password?: string }` |
| Success Response | `{ user: object }` (200) |
| Side Effects | Hash new password if provided |
| Error Cases | 401 (not authenticated), 400 (validation failed) |

**POST /api/auth/avito-connect**

Purpose: Store and validate Avito API token

| Aspect | Details |
|--------|--------|
| Authentication | Required |
| Request Body | `{ avitoToken: string }` |
| Process | Validate token against Avito API, encrypt with AES-256-GCM, store |
| Success Response | `{ message: "Connected", accountInfo: object }` (200) |
| Error Cases | 401 (not authenticated), 400 (invalid token) |

#### 3.3.2 Listings Endpoints

**GET /api/listings**

Purpose: Fetch all user's listings

| Aspect | Details |
|--------|--------|
| Authentication | Required |
| Query Parameters | `status?: string, search?: string, sort?: string, page?: number, limit?: number` |
| Success Response | `{ listings: array, total: number, page: number }` (200) |
| Business Logic | Filter by user_id, apply status filter, search title, paginate |

**POST /api/listings/sync**

Purpose: Sync listings from Avito API

| Aspect | Details |
|--------|--------|
| Authentication | Required |
| Validation | User must have Avito token connected |
| Process | Fetch listings from Avito, upsert to database, return updated count |
| Success Response | `{ synced: number, updated: number }` (200) |
| Error Cases | 400 (no Avito token), 500 (Avito API error) |

**GET /api/listings/:id**

Purpose: Fetch single listing details

| Aspect | Details |
|--------|--------|
| Authentication | Required |
| Authorization | Listing must belong to authenticated user |
| Success Response | `{ listing: object, competitors: array }` (200) |
| Error Cases | 404 (not found), 403 (not owner) |

**PATCH /api/listings/:id**

Purpose: Update listing details

| Aspect | Details |
|--------|--------|
| Authentication | Required |
| Request Body | `{ title?: string, description?: string, price?: number, status?: string }` |
| Success Response | `{ listing: object }` (200) |
| Error Cases | 404 (not found), 403 (not owner), 400 (validation failed) |

**PATCH /api/listings/:id/price**

Purpose: Update listing price on Avito

| Aspect | Details |
|--------|--------|
| Authentication | Required |
| Request Body | `{ newPrice: number }` |
| Process | Validate price, update via Avito API, update database, log action |
| Success Response | `{ listing: object, updated: boolean }` (200) |
| Error Cases | 400 (invalid price), 500 (Avito API error) |

#### 3.3.3 Competitor Endpoints

**GET /api/competitors**

Purpose: Fetch competitor data for a listing

| Aspect | Details |
|--------|--------|
| Authentication | Required |
| Query Parameters | `listing_id: string (required)` |
| Success Response | `{ competitors: array, averagePrice: number, priceRange: object }` (200) |
| Business Logic | Fetch competitors for listing, calculate statistics |

**POST /api/competitors/parse**

Purpose: Trigger competitor price parsing

| Aspect | Details |
|--------|--------|
| Authentication | Required |
| Request Body | `{ listingId: string }` |
| Process | Parse Avito public search, extract competitor prices, store in DB |
| Success Response | `{ parsed: number, competitors: array }` (200) |
| Error Cases | 404 (listing not found), 429 (rate limited) |

#### 3.3.4 Price Optimizer Endpoints

**POST /api/optimize/price**

Purpose: Get AI price recommendation

| Aspect | Details |
|--------|--------|
| Authentication | Required |
| Request Body | `{ listingId: string }` |
| Process | Fetch listing, fetch competitors, call OpenAI, return recommendation |
| Success Response | `{ recommendedPrice: number, reasoning: string, confidence: string }` (200) |
| AI Prompt Strategy | Provide listing details, competitor prices, market context; request optimal price |
| Error Cases | 404 (listing not found), 500 (OpenAI error) |

#### 3.3.5 Chat Endpoints

**GET /api/chats**

Purpose: List all active chats

| Aspect | Details |
|--------|--------|
| Authentication | Required |
| Query Parameters | `unreadOnly?: boolean, page?: number, limit?: number` |
| Success Response | `{ chats: array, total: number }` (200) |
| Business Logic | Fetch chats from chat_logs, group by buyer, show latest message |

**GET /api/chats/:id/messages**

Purpose: Fetch conversation messages

| Aspect | Details |
|--------|--------|
| Authentication | Required |
| Success Response | `{ messages: array, listing: object }` (200) |
| Business Logic | Fetch messages ordered by timestamp, include sender type |

**POST /api/chats/:id/reply**

Purpose: Send manual reply to chat

| Aspect | Details |
|--------|--------|
| Authentication | Required |
| Request Body | `{ message: string }` |
| Process | Send message via Avito API, log to chat_logs, return confirmation |
| Success Response | `{ sent: boolean, messageId: string }` (200) |
| Error Cases | 400 (empty message), 500 (Avito API error) |

**POST /api/chats/:id/ai-reply**

Purpose: Generate and send AI reply

| Aspect | Details |
|--------|--------|
| Authentication | Required |
| Tariff Enforcement | Check AI message usage against subscription limit |
| Process | Fetch conversation history, call OpenAI, send via Avito API, log, increment usage |
| Success Response | `{ sent: boolean, message: string, messageId: string }` (200) |
| AI Prompt Strategy | Russian seller persona, context from listing and conversation, polite tone |
| Error Cases | 403 (quota exceeded), 500 (OpenAI/Avito error) |

#### 3.3.6 Analytics Endpoints

**GET /api/analytics/listings**

Purpose: Get listing performance metrics

| Aspect | Details |
|--------|--------|
| Authentication | Required |
| Query Parameters | `dateFrom?: string, dateTo?: string, listingId?: string` |
| Success Response | `{ metrics: array }` (200) |
| Metrics Included | Views, messages, price changes, conversion rate |

**GET /api/analytics/competitors**

Purpose: Get competitor price trends

| Aspect | Details |
|--------|--------|
| Authentication | Required |
| Query Parameters | `listingId: string, dateFrom?: string, dateTo?: string` |
| Success Response | `{ trends: array, averages: object }` (200) |
| Business Logic | Aggregate competitor data by date, calculate moving average |

**GET /api/dashboard/stats**

Purpose: Get dashboard overview statistics

| Aspect | Details |
|--------|--------|
| Authentication | Required |
| Success Response | `{ totalListings, activeChats, aiMessagesUsed, aiMessagesLimit, recentActions }` (200) |
| Business Logic | Aggregate counts from multiple tables |

### 3.4 Core Services

#### 3.4.1 Avito API Service

**Purpose:** Encapsulate all Avito API interactions

**Methods:**

**validateToken(token)**
- Makes test request to Avito API to verify token validity
- Returns account information if valid
- Throws error if invalid

**fetchListings(token, userId)**
- Retrieves all listings for authenticated account
- Maps Avito response to internal listing format
- Returns array of listing objects

**updateListingPrice(token, listingId, newPrice)**
- Sends price update request to Avito API
- Returns success boolean

**fetchChatMessages(token, chatId)**
- Retrieves messages for specific chat
- Returns array of messages with sender info

**sendChatMessage(token, chatId, message)**
- Sends message to Avito chat
- Returns message ID

**fetchAnalytics(token, listingId)**
- Retrieves view count, message count, and other metrics
- Returns analytics object

**Error Handling:**
- Retry logic for transient failures (3 attempts)
- Specific error messages for different HTTP status codes
- Token expiry detection and notification

#### 3.4.2 OpenAI Service

**Purpose:** Interface with OpenAI GPT-4o Mini API

**Methods:**

**generatePriceRecommendation(listingData, competitorData)**

Input Parameters:
- Listing title, description, current price, category
- Competitor prices array
- Market context

Prompt Structure:
```
Системная роль: Эксперт по ценообразованию на маркетплейсах.

Контекст:
- Товар: [title]
- Текущая цена: [currentPrice] ₽
- Цены конкурентов: [competitor prices]

Задача: Порекомендуйте оптимальную цену для максимизации продаж и прибыли.

Формат ответа JSON:
{
  "recommendedPrice": number,
  "reasoning": "string",
  "confidence": "high" | "medium" | "low"
}
```

Output: Parsed JSON with recommendation

**generateChatResponse(conversationHistory, listingContext, buyerMessage)**

Input Parameters:
- Array of previous messages
- Listing details
- Latest buyer message

Prompt Structure:
```
Системная роль: Вы — вежливый продавец на Avito. Отвечайте на вопросы покупателей по-русски.

Товар: [listing title]
Цена: [price] ₽
Описание: [description]

История переписки:
[conversation history]

Новое сообщение от покупателя: [buyer message]

Напишите краткий, вежливый ответ (максимум 150 слов).
```

Output: Generated reply string in Russian

**Error Handling:**
- Handle rate limits from OpenAI
- Retry on network failures
- Fallback to default responses if API unavailable

#### 3.4.3 Competitor Parser Service

**Purpose:** Extract competitor pricing from Avito public search

**Method: parseCompetitors(listing)**

Process Flow:
1. Construct search URL based on listing category and keywords
2. Fetch Avito search results page (public, no auth required)
3. Parse HTML to extract listing cards
4. Extract price, title, listing ID from each card
5. Filter results to similar products (similarity threshold)
6. Store competitor data with timestamp
7. Return array of competitor objects

Data Extraction:
- Price: Extract from price element, parse as number
- Title: Extract from title link
- Listing ID: Extract from URL
- Similarity score: Calculate based on title keywords

Storage:
- Upsert to competitors table
- Link to original listing via foreign key
- Store parsed_at timestamp

Error Handling:
- Handle HTML structure changes
- Retry on network failures
- Log parsing errors without crashing

#### 3.4.4 Price Optimizer Service

**Purpose:** Business logic for price optimization recommendations

**Method: calculateOptimalPrice(listing, competitors, userPreferences)**

Algorithm:
1. Calculate competitor statistics:
   - Average price
   - Median price
   - Standard deviation
   - Min/max range
2. Determine pricing strategy based on user preference:
   - Competitive (below average by 5-10%)
   - Market (at average)
   - Premium (above average by 5-15%)
3. Call OpenAI for AI recommendation
4. Combine statistical analysis with AI insight
5. Return recommendation object with confidence level

Output Structure:
```
{
  recommendedPrice: number,
  strategy: string,
  reasoning: string,
  confidence: "high" | "medium" | "low",
  marketData: {
    average: number,
    median: number,
    competitorCount: number
  }
}
```

### 3.5 Background Jobs

#### 3.5.1 Competitor Sync Job

**Purpose:** Periodically update competitor prices

**Schedule:** Every 6 hours using node-cron

**Process:**
1. Query all active listings from database
2. For each listing:
   - Check if competitor data is stale (> 6 hours old)
   - If stale, trigger competitor parser
   - Update last_synced timestamp
3. Log sync results

**Optimization:**
- Process in batches to avoid overwhelming Avito
- Add random delay between requests
- Skip listings with recent manual syncs

#### 3.5.2 Chat Poller Job

**Purpose:** Check for new messages and trigger AI responses

**Schedule:** Every 2 minutes using node-cron

**Process:**
1. Query users with Avito token and AI agent enabled
2. For each user:
   - Fetch new messages from Avito API
   - Compare with stored messages in chat_logs
   - Identify unread messages from buyers
3. For each unread message:
   - Check if chat has AI enabled
   - Check if user has AI message quota
   - Generate AI reply
   - Send via Avito API
   - Log message and increment usage counter

**Error Handling:**
- Skip users with invalid tokens
- Log failures but continue processing other users
- Respect rate limits

#### 3.5.3 Analytics Aggregator Job

**Purpose:** Collect analytics data from Avito

**Schedule:** Daily at 02:00 using node-cron

**Process:**
1. Query all listings with Avito connection
2. For each listing:
   - Fetch analytics from Avito API
   - Store in analytics table with date
3. Calculate daily aggregates
4. Purge analytics data older than 90 days

### 3.6 Database Design

#### 3.6.1 Schema Overview

**users**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email (login) |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hashed password |
| full_name | VARCHAR(255) | NULL | User's full name |
| avito_token_encrypted | TEXT | NULL | AES-256-GCM encrypted token |
| avito_token_iv | VARCHAR(32) | NULL | Initialization vector for encryption |
| status | ENUM | DEFAULT 'active' | active, suspended, deleted |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation date |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update date |

Indexes:
- PRIMARY KEY on id
- UNIQUE INDEX on email
- INDEX on status

**subscriptions**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Subscription ID |
| user_id | UUID | FOREIGN KEY (users.id), UNIQUE | One subscription per user |
| plan | ENUM | NOT NULL | START, PRO, BUSINESS, ENTERPRISE |
| status | ENUM | DEFAULT 'active' | active, expired, cancelled |
| started_at | TIMESTAMP | NOT NULL | Subscription start date |
| expires_at | TIMESTAMP | NOT NULL | Subscription expiry date |
| ai_messages_used | INTEGER | DEFAULT 0 | AI messages sent this period |
| ai_messages_limit | INTEGER | NOT NULL | Max AI messages per plan |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

Indexes:
- PRIMARY KEY on id
- UNIQUE INDEX on user_id
- INDEX on (user_id, status)

**listings**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Listing ID |
| user_id | UUID | FOREIGN KEY (users.id) | Owner |
| avito_listing_id | VARCHAR(255) | UNIQUE | Avito's internal ID |
| title | VARCHAR(500) | NOT NULL | Listing title |
| description | TEXT | NULL | Full description |
| price | DECIMAL(10,2) | NOT NULL | Current price |
| category | VARCHAR(255) | NULL | Avito category |
| status | ENUM | DEFAULT 'active' | active, archived, sold |
| image_url | TEXT | NULL | Primary image |
| url | TEXT | NULL | Avito listing URL |
| last_synced_at | TIMESTAMP | NULL | Last sync from Avito |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

Indexes:
- PRIMARY KEY on id
- UNIQUE INDEX on avito_listing_id
- INDEX on user_id
- INDEX on (user_id, status)

**competitors**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Competitor entry ID |
| listing_id | UUID | FOREIGN KEY (listings.id) | Related listing |
| avito_competitor_id | VARCHAR(255) | NOT NULL | Competitor's listing ID |
| title | VARCHAR(500) | NOT NULL | Competitor listing title |
| price | DECIMAL(10,2) | NOT NULL | Competitor price |
| url | TEXT | NULL | Competitor listing URL |
| similarity_score | DECIMAL(3,2) | NULL | 0.00 - 1.00 |
| parsed_at | TIMESTAMP | DEFAULT NOW() | When data was collected |
| created_at | TIMESTAMP | DEFAULT NOW() | |

Indexes:
- PRIMARY KEY on id
- INDEX on listing_id
- COMPOSITE INDEX on (listing_id, parsed_at)

**analytics**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Analytics entry ID |
| listing_id | UUID | FOREIGN KEY (listings.id) | Related listing |
| date | DATE | NOT NULL | Date of metrics |
| views | INTEGER | DEFAULT 0 | View count |
| messages | INTEGER | DEFAULT 0 | Message count |
| favorites | INTEGER | DEFAULT 0 | Favorite count |
| created_at | TIMESTAMP | DEFAULT NOW() | |

Indexes:
- PRIMARY KEY on id
- UNIQUE INDEX on (listing_id, date)
- INDEX on listing_id

**chat_logs**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Message ID |
| user_id | UUID | FOREIGN KEY (users.id) | Seller |
| listing_id | UUID | FOREIGN KEY (listings.id) | Related listing |
| avito_chat_id | VARCHAR(255) | NOT NULL | Avito's chat ID |
| buyer_id | VARCHAR(255) | NULL | Buyer identifier |
| sender_type | ENUM | NOT NULL | buyer, seller, ai_agent |
| message | TEXT | NOT NULL | Message content |
| sent_at | TIMESTAMP | NOT NULL | Message timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | |

Indexes:
- PRIMARY KEY on id
- INDEX on user_id
- INDEX on listing_id
- INDEX on avito_chat_id
- COMPOSITE INDEX on (user_id, sent_at)

#### 3.6.2 Data Relationships

```mermaid
erDiagram
    users ||--o{ listings : owns
    users ||--|| subscriptions : has
    users ||--o{ chat_logs : participates
    listings ||--o{ competitors : tracked_by
    listings ||--o{ analytics : measured_by
    listings ||--o{ chat_logs : discussed_in
    
    users {
        uuid id PK
        string email UK
        string password_hash
        string full_name
        text avito_token_encrypted
        enum status
    }
    
    subscriptions {
        uuid id PK
        uuid user_id FK
        enum plan
        enum status
        timestamp expires_at
        int ai_messages_used
        int ai_messages_limit
    }
    
    listings {
        uuid id PK
        uuid user_id FK
        string avito_listing_id UK
        string title
        decimal price
        enum status
    }
    
    competitors {
        uuid id PK
        uuid listing_id FK
        string avito_competitor_id
        decimal price
        timestamp parsed_at
    }
    
    analytics {
        uuid id PK
        uuid listing_id FK
        date date
        int views
        int messages
    }
    
    chat_logs {
        uuid id PK
        uuid user_id FK
        uuid listing_id FK
        string avito_chat_id
        enum sender_type
        text message
    }
```

#### 3.6.3 Database Initialization

The migration script creates:
1. ENUM types (user_status, listing_status, sender_type, subscription_plan)
2. All tables in dependency order
3. Foreign key constraints
4. Indexes for performance
5. Default tariff limits as constants

Connection Pooling:
- Minimum connections: 2
- Maximum connections: 10
- Idle timeout: 30 seconds

### 3.7 Security Implementation

#### 3.7.1 Authentication & Authorization

**JWT Token Strategy:**

Access Token:
- Payload: `{ userId, email }`
- Expiry: 24 hours
- Storage: Client-side (localStorage or memory)
- Usage: Authorization header `Bearer <token>`

Refresh Token:
- Payload: `{ userId, type: 'refresh' }`
- Expiry: 7 days
- Storage: Client-side (httpOnly cookie preferred, or localStorage)
- Usage: Refresh access token when expired

**Middleware Flow:**
```mermaid
sequenceDiagram
    participant Client
    participant Auth Middleware
    participant JWT Util
    participant Route Handler
    
    Client->>Auth Middleware: Request with JWT
    Auth Middleware->>JWT Util: Verify token
    alt Token valid
        JWT Util-->>Auth Middleware: Decoded payload
        Auth Middleware->>Route Handler: Attach user to request
        Route Handler-->>Client: Response
    else Token invalid/expired
        JWT Util-->>Auth Middleware: Error
        Auth Middleware-->>Client: 401 Unauthorized
    end
```

#### 3.7.2 Password Security

**Hashing:**
- Algorithm: bcrypt
- Salt rounds: 12
- No plaintext storage

**Validation Rules:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- Special characters encouraged but not required

#### 3.7.3 Sensitive Data Encryption

**Avito Token Encryption:**
- Algorithm: AES-256-GCM
- Key: 32-character encryption key from environment
- Initialization Vector: Random 16 bytes, stored with encrypted data
- Tag: Authentication tag for integrity verification

**Encryption Process:**
1. Generate random IV
2. Encrypt plaintext with key and IV
3. Store encrypted data, IV, and auth tag

**Decryption Process:**
1. Retrieve encrypted data, IV, and tag
2. Verify auth tag
3. Decrypt with key and IV
4. Return plaintext

#### 3.7.4 Rate Limiting

**Global Rate Limit:**
- 100 requests per 15 minutes per IP
- Purpose: Prevent abuse

**Auth Endpoints:**
- 5 requests per 15 minutes per IP
- Purpose: Prevent brute force attacks

**API Endpoints:**
- 60 requests per minute per user
- Purpose: Fair usage

**Response Headers:**
- X-RateLimit-Limit
- X-RateLimit-Remaining
- X-RateLimit-Reset

#### 3.7.5 Input Validation

**Validation Strategy:**
- Use express-validator for all inputs
- Sanitize strings to prevent XSS
- Validate email format
- Validate UUID format
- Validate numeric ranges
- Trim whitespace
- Escape HTML entities

**Error Response Format:**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

#### 3.7.6 CORS Configuration

**Allowed Origins:**
- Development: http://localhost:5173
- Production: https://<project-name>.netlify.app

**Allowed Methods:**
- GET, POST, PUT, PATCH, DELETE

**Allowed Headers:**
- Content-Type, Authorization

**Credentials:**
- Allow credentials: true (for cookies if used)

### 3.8 Deployment Configuration (Render)

**Environment Variables:**

| Variable | Description | Example |
|----------|-------------|----------|
| PORT | Server port (provided by Render) | 10000 |
| NODE_ENV | Environment | production |
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@host:5432/db |
| JWT_SECRET | Secret for access tokens | random-string-256-bits |
| JWT_REFRESH_SECRET | Secret for refresh tokens | another-random-string |
| ENCRYPTION_KEY | 32-char key for AES-256 | exactly-32-characters-long-key! |
| OPENAI_API_KEY | OpenAI API key | sk-... |
| AVITO_API_BASE_URL | Avito API base URL | https://api.avito.ru |
| FRONTEND_URL | Frontend URL for CORS | https://avvo.netlify.app |

**Start Command:**
```bash
npm start
```

**Build Command:**
```bash
npm install
```

**Health Check Endpoint:**
- GET /health
- Returns: `{ status: "ok", timestamp: ISO date }`
- Used by Render to verify service health

**Logging:**
- Winston logger outputs to stdout
- Render captures logs automatically
- Log levels: error, warn, info, debug

**Database Migration:**
- Run manually before first deployment:
  ```bash
  npm run migrate
  ```
- Or include in build step if safe

---

## 4. Integration Design

### 4.1 Avito API Integration

**Authentication Method:**
- OAuth 2.0 token-based authentication
- User provides token via UI
- Token stored encrypted in database
- Token included in Authorization header for all requests

**API Base URL:**
- Production: https://api.avito.ru (or actual Avito API URL)

**Key Endpoints Used:**

| Avito Endpoint | Purpose | Method |
|----------------|---------|--------|
| /user/profile | Validate token, get account info | GET |
| /items | Fetch user's listings | GET |
| /items/{id} | Get single listing details | GET |
| /items/{id}/price | Update listing price | PATCH |
| /messenger/chats | Fetch all chats | GET |
| /messenger/chats/{id}/messages | Get chat messages | GET |
| /messenger/chats/{id}/messages | Send message | POST |
| /items/{id}/stats | Get listing analytics | GET |

**Error Handling:**
- 401: Token expired or invalid → notify user to reconnect
- 403: Forbidden → check permissions
- 429: Rate limited → exponential backoff retry
- 500: Server error → retry with delay

**Rate Limits:**
- Respect Avito's rate limits (specific limits TBD)
- Implement request queuing if needed
- Add delays between batch operations

### 4.2 OpenAI API Integration

**Model:** gpt-4o-mini (or gpt-4-turbo if available)

**API Key:** Stored in environment variable

**Use Cases:**

**Price Optimization:**
- Endpoint: /v1/chat/completions
- Model: gpt-4o-mini
- Temperature: 0.3 (deterministic)
- Max tokens: 500
- System prompt: Expert pricing analyst role
- User prompt: Listing data + competitor prices
- Response format: JSON with price and reasoning

**Chat Agent:**
- Endpoint: /v1/chat/completions
- Model: gpt-4o-mini
- Temperature: 0.7 (more creative)
- Max tokens: 150
- System prompt: Polite Russian seller persona
- User prompt: Conversation history + buyer question
- Response format: Plain text in Russian

**Cost Optimization:**
- Use gpt-4o-mini for cost efficiency
- Limit max tokens to control costs
- Cache common responses if patterns emerge
- Monitor usage per user against subscription limits

**Error Handling:**
- 429: Rate limit → queue request and retry
- 500: Server error → fallback to default response
- Timeout: Retry once, then fallback

---

## 5. Subscription & Tariff System

### 5.1 Tariff Plans

| Plan | Price (₽/month) | Listings Limit | AI Messages/Month | Features |
|------|-----------------|----------------|-------------------|----------|
| START | 499 | 30 | 0 | Price optimizer, basic parser, action logs |
| PRO | 1,049 | 300 | 50 | START + competitor parser, AI chat agent |
| BUSINESS | 2,200 | 1,000 | 500 | PRO + advanced analytics, priority support |
| ENTERPRISE | 5,590 | Unlimited | Unlimited | BUSINESS + API access, custom integrations |

### 5.2 Tariff Enforcement Logic

**Listing Limit Check:**
- Before syncing listings from Avito, check count against limit
- If at limit, prevent sync and show upgrade prompt
- Display usage in dashboard (e.g., "25/30 listings")

**AI Message Limit Check:**
- Before generating AI reply, check `ai_messages_used` vs `ai_messages_limit`
- If at limit, return 403 error with upgrade message
- Reset counter monthly (handled by subscription renewal process)

**Feature Access Control:**
- Competitor parser: PRO and above
- AI chat agent: PRO and above
- Analytics dashboard: BUSINESS and above
- API access: ENTERPRISE only

### 5.3 Trial Period

**New User Trial:**
- Duration: 14 days
- Plan: PRO
- Automatic on registration
- No payment required
- After expiry: Downgrade to START unless upgraded

**Implementation:**
- On user registration, create subscription record:
  - plan: 'PRO'
  - started_at: NOW()
  - expires_at: NOW() + 14 days
  - status: 'active'
- Background job checks daily for expired trials
- Send notification email before expiry

### 5.4 Subscription Management

**Upgrade/Downgrade Process:**
1. User selects new plan in UI
2. Frontend sends upgrade request to backend
3. Backend updates subscription record:
   - Change plan
   - Update limits
   - Recalculate expiry (pro-rated if applicable)
4. Return updated subscription info
5. Frontend updates UI

**Renewal Process:**
- Handled externally (payment gateway integration not in MVP)
- Manual renewal flag in admin panel (future)
- For MVP: Subscriptions expire and require manual reactivation

### 5.5 Usage Tracking

**AI Messages:**
- Increment `ai_messages_used` in subscriptions table on each AI reply
- Display in dashboard: "Used 15 / 50 AI messages"
- Show warning at 80% usage

**Listings Count:**
- Count active listings for user
- Display in dashboard: "25 / 300 listings"
- Prevent adding more at limit

---

## 6. User Experience Design

### 6.1 Russian Language Requirements

**All UI text must be in Russian:**

**Navigation:**
- Dashboard → Панель управления
- Listings → Объявления
- Price Optimizer → Оптимизация цен
- Chat → Чаты
- Analytics → Аналитика
- Profile → Профиль

**Common Actions:**
- Login → Войти
- Register → Регистрация
- Logout → Выйти
- Save → Сохранить
- Cancel → Отмена
- Delete → Удалить
- Edit → Редактировать
- Apply → Применить
- Sync → Синхронизировать

**Error Messages:**
- "Invalid email or password" → "Неверный email или пароль"
- "Field is required" → "Поле обязательно для заполнения"
- "Connection failed" → "Ошибка подключения"

**Notifications:**
- "Price updated successfully" → "Цена успешно обновлена"
- "Sync completed" → "Синхронизация завершена"
- "AI message sent" → "Сообщение отправлено AI-агентом"

### 6.2 Chat Interface Design

**Visual Distinction:**

**Buyer Messages:**
- Background: Light gray (#F3F4F6)
- Alignment: Left
- Avatar: Generic buyer icon

**Seller Messages (Manual):**
- Background: Blue (#3B82F6)
- Text color: White
- Alignment: Right
- Avatar: User's initials

**AI Agent Messages:**
- Background: Green (#10B981)
- Text color: White
- Alignment: Right
- Badge: "AI" label
- Avatar: Bot icon

**Timestamp:**
- Small gray text below each bubble
- Format: "14:35" or "Вчера 18:20"

**Quick Actions:**
- On buyer message hover: "Reply" button, "AI Suggest" button
- On listing inquiry: "View Listing" link

### 6.3 Price Visualization

**Color Coding:**
- Your price below average: Green (good deal)
- Your price at average: Yellow (neutral)
- Your price above average: Red (expensive)

**Charts:**
- Bar chart for competitor price distribution
- Line chart for price history over time
- Scatter plot for price vs. views correlation

**Recommendation Display:**
- Large, prominent recommended price
- Explanation text in Russian
- Confidence indicator (high/medium/low)
- Expected impact estimate (e.g., "+15% views")

### 6.4 Responsive Design Breakpoints

**Mobile (< 640px):**
- Sidebar collapses to hamburger menu
- Single column layout
- Stacked statistics cards
- Simplified charts (fewer data points)

**Tablet (640px - 1024px):**
- Sidebar visible but narrower
- Two-column layout where appropriate
- Full-featured charts

**Desktop (> 1024px):**
- Full sidebar navigation
- Multi-column layouts
- Detailed charts and tables
- Side-by-side comparisons

### 6.5 Loading States & Feedback

**Loading Indicators:**
- Skeleton screens for initial page load
- Spinner for button actions
- Progress bar for long operations (sync, parse)

**Success Feedback:**
- Green toast notification (top-right)
- Checkmark icon
- Auto-dismiss after 3 seconds

**Error Feedback:**
- Red toast notification (top-right)
- Error icon
- Manual dismiss or auto after 5 seconds
- Detailed error message in Russian

**Optimistic UI:**
- Update UI immediately on user action
- Show loading state in background
- Revert on failure with error message

---

## 7. Testing & Quality Assurance Strategy

### 7.1 Testing Approach

**Backend Testing:**
- Unit tests for services and utilities (Jest)
- Integration tests for API endpoints (Supertest)
- Database transaction tests
- Mocking external APIs (Avito, OpenAI)

**Frontend Testing:**
- Component tests (React Testing Library)
- Integration tests for user flows (Vitest)
- E2E tests for critical paths (Playwright or Cypress)

**Manual Testing:**
- User acceptance testing for each feature
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile device testing (iOS, Android)
- Russian language verification by native speaker

### 7.2 Quality Metrics

**Performance:**
- API response time < 500ms (p95)
- Frontend initial load < 3 seconds
- Time to interactive < 5 seconds

**Reliability:**
- API uptime > 99.5%
- Database connection pool never exhausted
- Graceful degradation on external API failures

**Security:**
- No exposed secrets in code
- All inputs validated
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitized inputs)

---

## 8. Deployment & DevOps

### 8.1 Deployment Workflow

**Frontend (Netlify):**
```mermaid
graph LR
    A[Git Push to main] --> B[Netlify Webhook]
    B --> C[npm install]
    C --> D[npm run build]
    D --> E[Deploy to CDN]
    E --> F[Invalidate Cache]
    F --> G[Live on Netlify]
```

**Backend (Render):**
```mermaid
graph LR
    A[Git Push to main] --> B[Render Webhook]
    B --> C[npm install]
    C --> D[Build if needed]
    D --> E[Run npm start]
    E --> F[Health Check]
    F --> G[Live on Render]
```

### 8.2 Environment Configuration

**Development:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Database: Local PostgreSQL

**Production:**
- Frontend: https://<project-name>.netlify.app
- Backend: https://<project-name>.onrender.com
- Database: Managed PostgreSQL (Render or external)

### 8.3 Monitoring & Logging

**Backend Logging:**
- Winston logger with levels: error, warn, info, debug
- Structured JSON logs in production
- Logs sent to stdout (captured by Render)

**Frontend Error Tracking:**
- Console errors in development
- Consider Sentry or similar in production (future)

**Health Monitoring:**
- /health endpoint for uptime checks
- Database connection test in health check
- External monitoring service (UptimeRobot, Pingdom)

### 8.4 Backup & Recovery

**Database Backups:**
- Automated daily backups (provided by hosting)
- Manual backup before major migrations
- Retention: 30 days

**Disaster Recovery:**
- Database restore procedure documented
- Environment variables backed up securely
- Code in Git (GitHub/GitLab)

---

## 9. Future Enhancements (Post-MVP)

### 9.1 Payment Integration
- Integrate Stripe or Yookassa for subscriptions
- Automatic billing and renewal
- Invoice generation

### 9.2 Advanced Analytics
- Conversion funnel analysis
- A/B testing for prices
- Predictive analytics for optimal listing times

### 9.3 Mobile App
- React Native app for iOS and Android
- Push notifications for new messages
- Quick reply functionality

### 9.4 API for Enterprise
- RESTful API for enterprise clients
- API key authentication
- Rate limiting per API key
- Documentation with Swagger

### 9.5 Multi-Language Support
- Support for other languages beyond Russian
- Internationalization (i18n) framework
- Language toggle in UI

### 9.6 Additional Features
- Bulk price updates
- Scheduled price changes
- Competitor alerts (email/SMS)
- Listing templates
- Image optimization recommendations

---

## 10. Success Criteria

### 10.1 MVP Success Metrics

**Functional Completeness:**
- [ ] User can register, login, and manage profile
- [ ] User can connect Avito API token
- [ ] Listings sync from Avito and display correctly
- [ ] Competitor prices parse and display
- [ ] AI price recommendations generate successfully
- [ ] Chat messages fetch and display
- [ ] AI chat agent replies in Russian
- [ ] Analytics data displays accurately
- [ ] Tariff limits enforced correctly
- [ ] All UI text in Russian

**Deployment Success:**
- [ ] Frontend deploys to Netlify without errors
- [ ] Backend deploys to Render and runs stably
- [ ] Database migrations execute successfully
- [ ] Environment variables configured correctly
- [ ] CORS allows frontend-backend communication
- [ ] Health check endpoint returns 200 OK

**User Experience:**
- [ ] Application loads in < 5 seconds
- [ ] All pages responsive on mobile and desktop
- [ ] No critical bugs in core workflows
- [ ] Error messages display in Russian
- [ ] Loading states provide feedback

### 10.2 Performance Benchmarks

- API average response time: < 300ms
- Page load time: < 3 seconds
- Time to interactive: < 5 seconds
- Concurrent users supported: 100+
- Database query time: < 100ms (p95)

### 10.3 Security Validation

- No secrets in Git repository
- All API endpoints require authentication (except public)
- Passwords never stored in plaintext
- Avito tokens encrypted at rest
- Rate limiting active on all endpoints
- HTTPS enforced in production

---

## 11. Risk Assessment & Mitigation

### 11.1 Technical Risks

**Risk: Avito API changes or deprecation**
- Impact: High (core functionality breaks)
- Likelihood: Medium
- Mitigation: Monitor Avito API updates, implement version detection, maintain fallback logic

**Risk: OpenAI cost overruns**
- Impact: Medium (budget exceeded)
- Likelihood: Medium
- Mitigation: Enforce strict usage limits per tier, cache common responses, use cheaper model

**Risk: Database performance degradation**
- Impact: High (slow application)
- Likelihood: Low
- Mitigation: Proper indexing, connection pooling, query optimization, monitoring

**Risk: Netlify/Render downtime**
- Impact: High (service unavailable)
- Likelihood: Low
- Mitigation: Choose reliable providers, implement health monitoring, have backup deployment plan

### 11.2 Business Risks

**Risk: Low user adoption**
- Impact: High (project fails)
- Likelihood: Medium
- Mitigation: Generous trial period, competitive pricing, excellent UX, marketing

**Risk: Competitor launches similar product**
- Impact: Medium (market share loss)
- Likelihood: Medium
- Mitigation: Rapid iteration, unique features (AI agent quality), customer lock-in

### 11.3 Compliance Risks

**Risk: Data privacy violations (GDPR, Russian laws)**
- Impact: High (legal issues)
- Likelihood: Low
- Mitigation: Encrypt sensitive data, clear privacy policy, user data export/delete features

**Risk: Avito terms of service violations**
- Impact: High (API access revoked)
- Likelihood: Low
- Mitigation: Follow Avito API guidelines, respect rate limits, ethical scraping practices

---

## 12. Appendices

### 12.1 Glossary

- **Avito**: Russian classified ads platform (similar to Craigslist)
- **SPA**: Single Page Application
- **JWT**: JSON Web Token
- **AES-256-GCM**: Advanced Encryption Standard with 256-bit key in Galois/Counter Mode
- **bcrypt**: Password hashing algorithm
- **CORS**: Cross-Origin Resource Sharing
- **CDN**: Content Delivery Network
- **Tariff**: Subscription plan/tier

### 12.2 Technology Versions

| Technology | Version | Reason |
|------------|---------|--------|
| Node.js | 18+ | LTS, modern features |
| React | 18 | Latest stable, concurrent features |
| PostgreSQL | 14+ | JSON support, performance |
| Vite | 5 | Fast build, modern |
| TailwindCSS | 3 | Utility-first CSS |
| Express | 4.18 | Stable, widely used |

### 12.3 External Dependencies

**Backend:**
- express: Web framework
- pg: PostgreSQL client
- bcrypt: Password hashing
- jsonwebtoken: JWT implementation
- dotenv: Environment variables
- cors: CORS middleware
- express-rate-limit: Rate limiting
- express-validator: Input validation
- axios: HTTP client
- node-cron: Job scheduling
- winston: Logging

**Frontend:**
- react: UI library
- react-dom: React rendering
- react-router-dom: Routing
- axios: HTTP client
- zustand: State management
- @tanstack/react-query: Server state
- lucide-react: Icons
- recharts: Charts
- date-fns: Date utilities

### 12.4 Environment Variables Reference

**Backend (.env):**
```
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/avvo_db

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
ENCRYPTION_KEY=exactly-32-characters-long-key!

# External APIs
OPENAI_API_KEY=sk-...
AVITO_API_BASE_URL=https://api.avito.ru

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Avvo
VITE_APP_VERSION=1.0.0
```

### 12.5 API Response Format Standards

**Success Response:**
```json
{
  "data": { /* response payload */ },
  "message": "Success message in Russian"
}
```

**Error Response:**
```json
{
  "error": "Error type",
  "message": "User-friendly message in Russian",
  "details": [ /* validation errors if applicable */ ]
}
```

**Paginated Response:**
```json
{
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Document Metadata

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** Final MVP Specification  
**Target Completion:** 8-10 weeks  
**Maintained By:** Development Team