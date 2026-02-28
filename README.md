# DailyLogger

A modern, full-stack time tracking and productivity intelligence application built with Next.js. Track your daily activities with a built-in stopwatch, organize with colored tags, and gain insights through analytics.

## Features

### Core Functionality

- **Stopwatch Timer**: Accurate timer using `elapsed = now - startedAt` (no drift from setInterval)
- **Activity Logging**: Log activities with optional descriptions and multiple tags
- **Multi-Tag System**: Organize activities with colored tags (many-to-many relationship)
- **URL Embedding**: Add URLs to descriptions - automatically detected and displayed as clickable links
- **Materialized Duration**: Duration computed once on stop, stored for fast aggregations
- **Single Running Log Protection**: Prevents starting a second activity while one is running

### Analytics Dashboard (`/analytics`)

- **Daily Activity Chart**: Bar chart showing time spent per day
- **Tag Distribution**: Pie chart showing time breakdown by tag
- **Key Metrics**:
  - Total time tracked
  - Daily average
  - Current streak
  - Longest session
- **Tag Breakdown**: Detailed list with percentage bars

### Daily Summary

- **Progress Tracking**: Shows daily total with progress bar toward goal
- **Activity Count**: Number of activities logged today
- **Goal Progress**: Percentage toward daily goal (default 8 hours)

### Recent Activities Panel

- **Collapsible Sidebar**: Sleek panel fixed to the right side
- **Last 7 Days**: Shows recent activities with tags and durations
- **Quick Overview**: Relative timestamps ("2 hours ago")

### History Page (`/history`)

- **Full History**: Browse all activities with pagination
- **Tag Filtering**: Filter activities by specific tag
- **Search**: Search through descriptions
- **Table/Card Views**: Persistent layout preference (localStorage)

## Architecture

### Domain-Driven Design

```
UI Components
    ↓
React Query Hooks
    ↓
Server Actions
    ↓
Domain Logic (pure functions)
    ↓
Prisma ORM
    ↓
MongoDB
```

### Key Architectural Decisions

1. **No `status` field**: Running state derived from `finishedAt === null`
2. **Materialized `duration`**: Computed once on stop, stored in minutes
3. **Tags over Categories**: Many-to-many relationship with colors
4. **Database Indexes**: On `userId + startedAt`, `userId + finishedAt`
5. **Pure Domain Functions**: Time math isolated in `lib/domain.ts`
6. **Validation**: `finishedAt > startedAt` enforced on updates

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Radix UI** - Accessible UI components
- **Lucide React** - Icons
- **Recharts** - Charts and data visualization
- **TanStack Query** - Server state management

### Backend
- **Next.js Server Actions** - Server-side mutations
- **NextAuth.js 5** - Authentication
- **Prisma** - Type-safe ORM
- **MongoDB** - Database

## Database Schema

```prisma
model User {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  name      String?
  email     String   @unique
  password  String?
  dailyGoal Int?     @default(480) // 8 hours in minutes
  logs      Log[]
  tags      Tag[]
}

model Log {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  description String?
  startedAt   DateTime
  finishedAt  DateTime? // null = running
  duration    Int?      // materialized, in minutes
  userId      String    @db.ObjectId
  tagIds      String[]  @db.ObjectId
  tags        Tag[]

  @@index([userId, startedAt])
  @@index([userId, finishedAt])
}

model Tag {
  id     String   @id @default(auto()) @map("_id") @db.ObjectId
  name   String
  color  String   @default("#6366f1")
  userId String   @db.ObjectId
  logIds String[] @db.ObjectId
  logs   Log[]

  @@unique([userId, name])
  @@index([userId])
}
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main timer page
│   ├── history/page.tsx      # Activity history
│   ├── analytics/page.tsx    # Analytics dashboard
│   ├── signin/page.tsx
│   └── signup/page.tsx
├── components/
│   ├── analytics/
│   │   └── analyticsPage.tsx
│   ├── logs/
│   │   ├── createLogs.tsx    # Timer with tag selection
│   │   ├── dailySummary.tsx  # Daily progress bar
│   │   ├── recentActivities.tsx
│   │   ├── timer/
│   │   │   ├── logPage.tsx
│   │   │   └── logDisplay.tsx
│   │   └── history/
│   │       └── historyPage.tsx
│   ├── layout/
│   └── ui/
└── lib/
    ├── actions/
    │   ├── createLog.ts      # With single-running protection
    │   ├── updateLog.ts      # With time validation
    │   ├── updateLogStatus.ts # Computes duration
    │   ├── getRunningLog.ts
    │   ├── getFinishedLogs.ts
    │   ├── getRecentLogs.ts
    │   ├── getAllLogs.ts
    │   ├── tags.ts           # Tag CRUD
    │   └── analytics.ts      # Analytics queries
    ├── domain.ts             # Pure functions
    ├── types.ts
    ├── db.ts
    └── auth.ts
```

## Domain Logic (`lib/domain.ts`)

Pure functions for time tracking:

```typescript
calculateDuration(start, end)   // Returns minutes
calculateElapsed(startedAt)     // Returns milliseconds
validateTimeRange(start, end)   // Returns boolean
isRunning(finishedAt)          // Returns boolean
formatDuration(minutes)         // "2h 30m"
formatRelativeTime(date)        // "2 hours ago"
calculateProgress(current, goal) // Percentage
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB database
- npm, yarn, pnpm, or bun

### Environment Variables

```env
DATABASE_URL="mongodb+srv://..."
AUTH_SECRET="your-secret-key"
```

### Installation

```bash
# Clone and install
git clone <repository-url>
cd dailylogger
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

### Starting an Activity

1. (Optional) Select tags or create new ones
2. (Optional) Add a description
3. Click "Start"
4. Click "Finish" when done

### Viewing Analytics

Navigate to `/analytics` to see:
- Time trends over 30 days
- Distribution across tags
- Streak and productivity metrics

### Managing Tags

- Create tags from the timer page
- Filter history by tag
- Tags have colors for visual organization

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
```

## Future Enhancements

- Daily timeline view
- Keyboard shortcuts (spacebar to start/stop)
- Pomodoro mode
- Auto-stop safety (midnight cutoff)
- URL metadata preview (fetch titles)
- Weekly review summaries

## License

MIT
