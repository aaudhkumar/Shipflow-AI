# Project: Mobile Analytics Screen Implementation

## Architecture
- **tRPC API Service**: Backed by `packages/services/src/organization/organization.repository.ts` providing analytics data via `getAnalytics` query.
- **Mobile Screen**: Located at `apps/mobile/src/screens/dashboard/AnalyticsScreen.tsx` consuming the tRPC router and rendering components.
- **Design Engineering**: Uses `react-native-reanimated` for smooth and snappy UI transitions, entry staggers, and custom spring animations.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration | Analyze data model, design variables, and dependencies. | None | DONE |
| 2 | UI Implementation | Refactor `AnalyticsScreen.tsx` using flexbox heatmaps, severity bars, and timelines. | M1 | DONE |
| 3 | Verification | Run build/test, verify motion curves, run Forensic Audit. | M2 | DONE |

## Code Layout
- `apps/mobile/src/screens/dashboard/AnalyticsScreen.tsx` - Main screen component.
- `apps/mobile/src/components/PressableScale.tsx` - Scale-down on press wrapper component.
- `apps/mobile/src/theme/tokens.ts` - Theme colors and design tokens.
- `packages/services/src/organization/organization.repository.ts` - Backend repository fetching the data.

## Interface Contracts
### Mobile Screen ↔ tRPC getAnalytics Endpoint
- Query: `trpc.organization.getAnalytics.useQuery({ orgId: string, days: number })`
- Response Type:
  - `volumeTrend`: `{ date: string; analyses: number }[]`
  - `reviewTimeBySeverity`: `{ severity: string; avgHours: number }[]`
  - `featureTimeline`: `{ id: string; title: string; durationDays: number; shippedAt: Date }[]`
  - `productivityHeatmap`: `{ date: string; count: number }[]`
  - `securityTrends`: `{ date: string; blocking: number; nonBlocking: number }[]`
  - `aiAccuracy`: `{ truePositives: number; falsePositives: number; open: number; total: number; accuracyRate: number }`
  - `userReviewFeedback`: `{ correct: number; incorrect: number; unmarked: number; total: number; approvalRate: number }`
  - `sourceChannelBreakdown`: `{ name: string; value: number; fill: string }[]`
