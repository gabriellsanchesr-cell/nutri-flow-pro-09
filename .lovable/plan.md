

# Fix: App stuck on "Carregando..." (loading screen)

## Root Cause

The `useAuth` hook has a race condition: both `onAuthStateChange` and `getSession` run concurrently, each calling `setLoading(false)`. The `onAuthStateChange` callback fires with `INITIAL_SESSION` event, and inside it `await fetchRole()` can hang if the RPC call stalls (network issue, cold start, etc.). Since `setLoading(false)` is after the `await`, loading stays `true` forever.

Additionally, the `getSession().then(async ...)` path has the same vulnerability.

## Fix

Restructure `useAuth.tsx` to:
1. Set up `onAuthStateChange` **without** awaiting inside the callback (use `setTimeout` to defer to avoid Supabase deadlock)
2. Use `getSession` as the single initial load path
3. Add a safety timeout (5s) that forces `setLoading(false)` if auth never resolves
4. Wrap `fetchRole` with `Promise.race` to add a 5-second timeout

## Changes

### `src/hooks/useAuth.tsx`
- In `onAuthStateChange`: don't `await` fetchRole directly — use `fetchRole(id).finally(() => setLoading(false))` pattern
- In `getSession`: same pattern
- Add a `setTimeout(() => setLoading(false), 5000)` safety net so the app never hangs forever
- This ensures users always get past the loading screen (redirected to login if unauthenticated, or proceed if authenticated)

Single file change, no database changes needed.

