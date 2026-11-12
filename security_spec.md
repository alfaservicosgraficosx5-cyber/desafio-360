# Firestore Security Specification

## 1. Data Invariants
1. **Strict Ownership & PII Isolation**: A `UserProfile` document at `/users/{userId}` contains PII (`email`, `displayName`, `photoURL`) and can only be read (`get`), created, or updated by the verified authenticated user whose `request.auth.uid == userId`. Collection `list` on `/users` is denied.
2. **Master Gate & Relational Integrity**:
   - Every `ChallengeInstance` at `/users/{userId}/challenges/{challengeId}` requires the parent `/users/{userId}` document to exist and belong to `request.auth.uid`.
   - Every `MovementEntry` at `/users/{userId}/challenges/{challengeId}/movements/{movementId}` requires the parent challenge to exist and belong to `request.auth.uid`, and is immutable (`allow update: if false`).
   - Every `BackupSnapshot` at `/users/{userId}/backups/{backupId}` requires `/users/{userId}` to exist and belong to `request.auth.uid`, and is immutable (`allow update: if false`).
3. **Immutability & Temporal Integrity**: `uid`, `id`, `ownerId`, `challengeId`, and `createdAt` are immutable after creation. `createdAt` and `updatedAt` must equal `request.time`.
4. **Volumetric & Type Safety**: `paidDeposits` and `customNotes` maps are bounded to `size() <= 365`. `layoutPrefs` lists are bounded (`<= 50` participant IDs, `<= 10` static-allowlisted UI keys). All string fields have explicit `.size()` bounds. All IDs match `^[a-zA-Z0-9_\-]+$` with length `<= 128`.
5. **Action-Based Updates & Zero Ghost Fields**: `hasAll()` + `hasOnly()` on creation/validation, combined with `affectedKeys().hasOnly(...)` on every update action.
6. **Verified Email Gate**: All write operations require `request.auth.token.email_verified == true`.

## 2. The "Dirty Dozen" Adversarial Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated Read**: `get(/users/uid1/challenges/c1)` with `auth == null` -> DENIED.
2. **Cross-User Profile Read (PII Leak)**: `get(/users/uid2)` as `uid1` -> DENIED.
3. **User Collection Scraping**: `list(/users)` as `uid1` -> DENIED.
4. **Cross-User Challenge/Backup/Movement List**: `list(/users/uid2/challenges)` or `list(/users/uid2/backups)` as `uid1` -> DENIED.
5. **Identity Spoofing on Create**: `create(/users/uid1/challenges/c1)` with `ownerId: "uid2"` -> DENIED.
6. **Shadow / Ghost Field Injection**: `create(/users/uid1)` with `{ ..., isAdmin: true }` -> DENIED.
7. **Unverified Email Write**: `create(/users/uid1/challenges/c1)` with `auth.token.email_verified: false` -> DENIED.
8. **ID Poisoning (Resource Exhaustion)**: `create(/users/uid1/challenges/${'a'.repeat(200)})` -> DENIED.
9. **Client Timestamp Forgery**: `create(/users/uid1/challenges/c1)` with `createdAt: Timestamp(2020-01-01)` != `request.time` -> DENIED.
10. **Immutable Field / Movement History Mutation**: `update(/users/uid1/challenges/c1/movements/m1)` or changing `ownerId`/`createdAt` -> DENIED.
11. **Oversized Map / DoW Attack**: `update(/users/uid1/challenges/c1)` with `paidDeposits` containing 366 entries -> DENIED.
12. **Orphaned Subcollection Create**: `create(/users/uid1/challenges/c1/movements/m1)` when parent challenge does not exist -> DENIED.
