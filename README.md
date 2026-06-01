# Jewellars Partner App (Frontend)

**Product:** Mobile partner application for jewellery retailers (branded in-app as **GEHNAHUB**)  
**Platform:** React Native · Expo SDK 54 · Expo Router 6  
**Backend:** [`jewellars-backend`](../jewellars-backend/README.md) (Express + Supabase)  
**Last updated:** 1 June 2026

---

## Table of contents

1. [Executive summary](#executive-summary)
2. [Current project status](#current-project-status)
3. [Tech stack](#tech-stack)
4. [Repository layout](#repository-layout)
5. [Getting started](#getting-started)
6. [Implementation progress](#implementation-progress)
7. [Architectural decisions](#architectural-decisions)
8. [Subscription feature (built, UI disabled)](#subscription-feature-built-ui-disabled)
9. [Known issues and technical debt](#known-issues-and-technical-debt)
10. [Pending work](#pending-work)
11. [Verification checklist](#verification-checklist)

---

## Executive summary

The Jewellars Partner app lets jewellery store owners register, complete multi-step onboarding (business verification, branding, product catalogue), and operate a live storefront after admin approval. The main app provides a **dashboard**, **inventory management**, **leads/appointments**, **notifications**, and **profile/store settings**.

**Backend integration** is complete for authentication, onboarding, products, store profile, analytics, leads, and notifications. **Paid subscription flows are implemented in code but hidden from users** (June 2026): approved jewellers go straight to the dashboard; the free plan is assigned automatically on the server when products are submitted for review.

---

## Current project status

| Area | Status | Notes |
|------|--------|--------|
| Landing & welcome | ✅ Complete | Register / login entry |
| Phone OTP auth | ✅ Complete | Integrated with backend |
| Session persistence | ✅ Complete | SecureStore + in-memory token cache |
| Onboarding (steps 1–4, products, review) | ✅ Complete | API-backed |
| Post-approval store-live screen | ✅ Complete | Routes to dashboard (not subscription) |
| Main app tabs (Home, Inventory, Leads, Profile) | ✅ Complete | |
| Inventory CRUD | ✅ Complete | Add / edit / list |
| Leads | ✅ Complete | List, detail, status |
| Notifications | ✅ Complete | |
| Storefront preview | ✅ Complete | |
| My Live Store | ✅ Complete | Plan UI hidden |
| Subscription selection UI | ⏸ Disabled | Code retained; screens redirect to dashboard |
| Paid checkout (Razorpay/mock) | ⏸ Disabled | `step6-checkout` redirects |
| Sales report | 🔲 Placeholder | Screen exists; limited backend wiring |

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | React Native 0.81, React 19 |
| Tooling | Expo 54, TypeScript 5.9 |
| Navigation | Expo Router (file-based) |
| Styling | NativeWind 4 (Tailwind) |
| Server state | TanStack React Query 5 |
| Client state | Zustand 5 |
| Forms | React Hook Form + Zod |
| HTTP | Axios (envelope unwrapping, 401 logout) |
| Secure storage | `expo-secure-store` |

---

## Repository layout

```
app/
  index.tsx                 # Landing (GEHNAHUB)
  _layout.tsx               # Root: auth bootstrap, cold-start routing
  (auth)/                   # Login, OTP verify
  (onboarding)/             # Steps 1–4, products, review, store-live, subscription* 
  (app)/                    # Tab app: dashboard, inventory, leads, profile, stacks
components/                 # UI, onboarding headers, inventory form, PlanCard*
constants/                  # Theme, config, profile, leads
hooks/                      # Font scale, categories, onboarding guard
lib/                        # getResumeRoute, onboarding meta, navigation helpers
services/                   # API clients per domain
store/                      # Zustand: auth, onboarding, inventory, leads, profile
types/                      # Shared TypeScript types
```

\* Subscription-related routes and components remain in the repo but are not reachable in normal user flows.

---

## Getting started

### Prerequisites

- Node.js 18+
- npm
- Expo Go or a development build (iOS / Android)
- Running [`jewellars-backend`](../jewellars-backend/README.md) on port **5001** (default)

### Environment

Copy `.env.example` to `.env` (optional in dev):

```bash
EXPO_PUBLIC_API_URL=http://<your-lan-ip>:5001/api/jeweller
EXPO_PUBLIC_APP_ENV=development
```

If `EXPO_PUBLIC_API_URL` is unset, dev builds auto-detect the Metro host and use `http://<host>:5001/api/jeweller`.

### Commands

```bash
npm install
npm start          # Expo dev server
npm run typecheck  # TypeScript
npm run lint       # ESLint
```

---

## Implementation progress

Progress is grouped by feature. Each entry documents **what changed**, **why**, **impact**, **implementation notes**, and **pending items**.

---

### 1. Project foundation

**What changed**

- Expo Router app scaffold with route groups: `(auth)`, `(onboarding)`, `(app)`.
- Path aliases (`@components`, `@services`, `@lib`, etc.) via `babel-plugin-module-resolver`.
- Shared design tokens (`constants/colors.ts`, `theme.ts`), responsive typography (`useFontScale`).
- Global providers: React Query, dialog system, gesture handler, safe area.

**Why**

Establish a scalable structure before feature work and keep navigation/file boundaries clear for onboarding vs authenticated app.

**Impact**

New screens follow a consistent layout; API and state layers are separated from UI.

**Implementation notes**

- API base URL resolution lives in `constants/config.ts` (env override → dev host detection → production URL).

**Pending**

- None for foundation.

---

### 2. Authentication (phone OTP)

**What changed**

- Landing → login/register → OTP verification (`app/(auth)/login.tsx`, `verify.tsx`).
- `services/authService.ts`: `sendOtp`, `verifyOtp`, `getMe`, `logout`.
- `store/useAuthStore.ts`: session, onboarding flags, logout with store resets.
- `services/api.ts`: Bearer token injection, in-memory cache, 401 → logout, response envelope unwrap.
- `components/auth/AuthBootstrap.tsx`: guards unauthenticated access.

**Why**

Jewellers authenticate with phone OTP only; JWT sessions must survive app restarts and fail safely on expiry.

**Impact**

Users can register, log in, and remain signed in across restarts. Invalid tokens clear local state and return to landing.

**Implementation notes**

- Token stored in SecureStore (`auth_token`); warmed in memory on first request to avoid repeated disk reads.
- Customer-role phones are rejected at login (backend enforces; UI shows API error).
- After OTP success, navigation uses `lib/getResumeRoute.ts` from auth response fields.

**Pending**

- None critical; optional: biometric unlock, refresh tokens (not implemented).

---

### 3. Cold-start routing and resume flow

**What changed**

- `app/_layout.tsx`: after `checkPersistedAuth`, routes using local meta then reconciles with `GET /onboarding/status` in the background.
- `lib/getResumeRoute.ts`: single source of truth for post-login / post-approval destinations.
- `app/(onboarding)/resume-choice.tsx`: “Welcome back” card when resuming mid-onboarding step screens.
- `lib/onboardingMeta.ts` + SecureStore: persists `currentOnboardingStep`, `isOnboardingComplete`, `storeStatus`.

**Why**

Users must land on the correct screen after kill/reopen without flashing the wrong flow; server status can correct stale local state.

**Impact**

Faster time-to-interactive (local route first, splash hidden immediately). Background sync updates route only when server disagrees with local.

**Implementation notes**

- Onboarding **step** routes are redirected through `resume-choice` when detected (`isOnboardingStepRoute` in `_layout.tsx`).
- `needsSubscription` is no longer used for routing (see [Subscription feature](#subscription-feature-built-ui-disabled)).

**Pending**

- Align fully with backend `getStatus` once backend stops returning unused `needsSubscription` (see backend README).

---

### 4. Onboarding — business setup and verification

**What changed**

| Step | Screen | Backend endpoint |
|------|--------|------------------|
| 1 | `step1-business-info` | `POST /onboarding/step1` |
| 2 | `step2-gst` | `POST /onboarding/step2` (multipart GST doc) |
| 3 | `step3-bis` | `POST /onboarding/step3` (multipart BIS doc) |
| 4 | `step4-branding` | `POST /onboarding/step4` (logo/cover uploads) |
| 5 | `step5-products` / `add-product` | Product APIs + `POST /onboarding/step6-products` |
| Review | `review-pending` | Polls status; shows review/rejected states |
| Approved | `store-live` | Celebration screen → **dashboard** |

**Why**

Regulatory and brand data must be collected before the store goes to admin review; minimum product count enforced server-side (5 products).

**Impact**

End-to-end jeweller registration without admin app dependency on the client; store enters `review` then `approved` via admin backend.

**Implementation notes**

- `useOnboardingStore` mirrors step data locally for UX; server is authoritative for `onboarding_step` and `store_status`.
- Location permission and address capture on step 1 (`expo-location`).
- Hardware back handlers per step with exit confirmation where needed.
- On approval, `review-pending` navigates to `store-live`.

**Pending**

- Rejection UX: ensure copy and re-submit path are product-approved.
- Admin approval flow is backend-only (documented in backend README).

---

### 5. Main application (post-onboarding)

**What changed**

- Tab layout: **Home**, **Inventory**, **Leads**, **Profile** (`app/(app)/_layout.tsx`).
- **Dashboard** (`index.tsx`): analytics overview (views, appointments), date range filter, quick actions.
- **Inventory**: list, add, edit (`inventory/`), shared `InventoryProductForm`, categories hook.
- **Leads** (`leads.tsx`): appointments from `/appointments`, badges on tab.
- **Profile** (`profile.tsx`): business info, documents, address, logout; cover/logo upload.
- **My Live Store**, **Storefront**, **All Products**, **Product Detail**, **Notifications**, **Business Profile/Documents**.

**Why**

Approved jewellers need day-to-day operations in one app after onboarding.

**Impact**

Core partner workflows are usable against live APIs.

**Implementation notes**

- `useRequireOnboardingComplete` redirects incomplete onboarding back via `getResumeRoute`.
- React Query keys centralized where applicable (`lib/inventoryQueryKeys.ts`).
- Inventory tab resets stack to index on tab press (avoids stale “add product” stack).

**Pending**

- **Sales report**: UI present; confirm analytics endpoints and product requirements.
- Share store / some “Manage store” actions show “coming soon” alerts (`utils/storeAlerts.ts`).

---

### 6. Backend integration milestone

**What changed** (commits: `90c5f01`, `0893c90`, `188b3b0`, `f490bf7`, `c39d16a`)

- Replaced mock/local-only flows with `services/*` calling `/api/jeweller/*`.
- Unified error handling (`utils/handleApiError.ts`, `ApiError`).
- Store and profile mapping in `types/store.ts` (includes subscription shape for future use).

**Why**

Production data must live in Supabase via the Express API.

**Impact**

All primary flows read/write real data; Swagger at backend `/api-docs` documents contracts.

**Pending**

- Keep frontend `OnboardingStatus` type in sync if backend status payload changes.

---

### 7. Subscription feature (built, UI disabled)

**Date:** 1 June 2026  
**Decision:** Hide all subscription UX; keep implementation for a future release. Do **not** delete files.

#### 7.1 Business context

Subscription screens (plan pick, Razorpay checkout) were blocking approved jewellers from reaching the dashboard when no paid plan existed. Product decision: **all approved stores use the free tier automatically** until paid plans are launched in the UI.

#### 7.2 What changed

| Location | Change |
|----------|--------|
| `app/(onboarding)/store-live.tsx` | Primary CTA → `router.replace('/(app)')`; label **View Store →** |
| `app/(onboarding)/step5-subscription.tsx` | Early `useEffect` redirect to `/(app)`, `return null` |
| `app/(onboarding)/post-approval-subscription.tsx` | Same redirect guard |
| `app/(onboarding)/step6-checkout.tsx` | Same redirect guard |
| `lib/getResumeRoute.ts` | `storeStatus === 'approved'` always → `/(app)` |
| `app/(app)/profile.tsx` | Subscription settings row commented out |
| `app/(app)/index.tsx` | Plan stat card commented out |
| `app/(app)/my-live-store.tsx` | Plan tier badge block commented out; Visit Storefront kept |
| `app/_layout.tsx` | Removed `needsSubscription` from routing / meta save |
| `app/(auth)/verify.tsx` | Stopped passing `needsSubscription` to auth helpers |
| `store/useAuthStore.ts` | Commented `needsSubscription` in persisted meta |
| `components/onboarding/OnboardingScreenHeader.tsx` | Fallback route → `step5-products` (not subscription) |

**Backend (paired change):** `auth.service.js` — `verifyOtpAndLogin` no longer returns `needsSubscription`; `isOnboardingComplete` = `is_onboarding_done && store_status === 'approved'` only.

**Why**

- Remove subscription as a **gate** to the dashboard.
- Avoid duplicate/confusing plan UI before monetization is ready.
- Preserve `PlanCard`, payment services, and onboarding step-5 API for fast re-enable.

**Impact**

| User journey | Before | After |
|--------------|--------|--------|
| Store approved → store-live | → post-approval subscription | → dashboard |
| Login with approved store, no sub row in DB | Could route to subscription | → dashboard |
| Profile / dashboard | Plan row & stat card visible | Hidden |
| Deep link to subscription routes | Full UI | Immediate redirect to dashboard |

**Implementation notes**

- Search marker in code: `SUBSCRIPTION DISABLED` (comments only).
- Dead code after `return null` in subscription screens is intentional (preserves full UI for re-enable).
- `components/subscription/PlanCard.tsx` and `constants/subscriptionPlans.ts` unchanged.
- Free plan still created in backend `step6Products()` when jeweller submits ≥5 products (no frontend change required).

**Pending**

- Re-enable UI: remove redirect guards, uncomment profile/dashboard/my-live-store blocks, restore `store-live` CTA target if product wants post-approval plan selection again.
- Update `getResumeRoute` and auth meta when re-enabling.
- Backend: remove or align `needsSubscription` in `onboarding.service.js` `getStatus()` (still computed today; frontend ignores it).
- Real Razorpay integration (currently mock payment service) when monetization ships.
- Run full regression from [Verification checklist](#verification-checklist).

---

### 8. Auth / onboarding alignment fix

**What changed** (commits: `f490bf7` / `fd409d4`, `c39d16a` / `3f508ea`)

- Frontend and backend agreement on when onboarding is “complete”.
- Resume routing respects `store_status` (review, approved, rejected).

**Why**

Mismatch caused users to bounce between subscription, onboarding, and dashboard after OTP login.

**Impact**

Stable post-login destination; fewer support edge cases.

**Pending**

- Single definition of `isOnboardingComplete` on `GET /onboarding/status` (backend currently uses `is_onboarding_done` only, without requiring `approved` — see backend README).

---

## Architectural decisions

| Decision | Rationale |
|----------|-----------|
| **Expo Router route groups** | Clear separation: public auth, onboarding wizard, tab app. |
| **`getResumeRoute` centralization** | One function for verify, cold start, and guards; avoids divergent rules. |
| **Local-first cold start** | Show correct screen from SecureStore before network; reconcile status in background. |
| **Zustand + React Query** | Zustand for session/onboarding flags; React Query for server lists and cache. |
| **Subscription disable via comment + redirect** | No file deletion; easy diff for re-enable; deep links cannot surface billing UI. |
| **Free plan on server at product submit** | Jewellers always have a subscription row for future billing without UI gate. |

---

## Known issues and technical debt

- `tsc --noEmit` reports errors in `step6-checkout.tsx` (unreachable code after early `return null`) and some inventory form resolver types — pre-existing or introduced by disable pattern; safe at runtime for disabled routes.
- `OnboardingStatus` type omits `needsSubscription` but API may still return it.
- `services/onboardingService.ts` `RESUME_ROUTE_MAP` still lists `step5-subscription` (unused while UI disabled).

---

## Pending work

### High priority

1. **Re-enable subscriptions (when product ready)** — follow checklist in [§7](#subscription-feature-built-ui-disabled).
2. **Backend status API alignment** — `getStatus` / `isOnboardingComplete` semantics vs auth login (documented in backend README).
3. **Sales report** — define metrics and wire to analytics API.

### Medium priority

4. Share store / deep linking from My Live Store.
5. E2E test plan for onboarding → approval → dashboard path.
6. Production env: set `EXPO_PUBLIC_API_URL` and EAS build profiles (`eas.json`).

### Low priority

7. Remove unreachable subscription screen code behind a feature flag instead of dual `return` blocks (cleanup).
8. Customer app separation (backend already blocks customer role on jeweller login).

---

## Verification checklist

Use after subscription-related or routing changes:

1. **Onboarding → approval:** Complete onboarding → admin approves → `store-live` → **View Store** → lands on **dashboard** (not subscription).
2. **Profile:** No “Subscription Plan” row.
3. **Dashboard:** No plan name / renewal stat card.
4. **My Live Store:** No plan tier label; Visit Storefront works.
5. **Deep routes:** Open `/(onboarding)/step5-subscription`, `post-approval-subscription`, `step6-checkout` → immediate redirect to dashboard.
6. **Regression:** Auth, onboarding steps 1–4, add products, review pending, inventory, leads, notifications, profile edit, logout/login.

---

## Related documentation

- **Backend API & server progress:** [`../jewellars-backend/README.md`](../jewellars-backend/README.md)
- **API reference (Swagger):** `http://localhost:5001/api-docs` when backend is running

---

## Contact / handoff

For environment secrets (Supabase, OTP provider, JWT), use backend `.env` — never commit secrets. Frontend only requires `EXPO_PUBLIC_*` variables.

When onboarding a new developer: read [Current project status](#current-project-status), run [Getting started](#getting-started), then trace one flow (OTP login → `getResumeRoute` → dashboard) in `app/_layout.tsx` and `lib/getResumeRoute.ts`.
