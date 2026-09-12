# AegisAI Security Specification & Firestore Hardening Spec

## 1. Data Invariants
1. **Telemetry Integrity**: Telemetry and audit event documents are immutable once created; users cannot alter prior risk scores or forged timestamps.
2. **Identity Linkage**: User-created prompts and telemetry events must tie back to an authenticated session (`request.auth.uid`) or authorized system agent.
3. **Role-Based Privilege Gate**: Analysts can read and contribute telemetry logs and scans; User role escalation (e.g. Setting `role: admin`) in `/users/{userId}` is strictly locked against self-assignment.
4. **Boundary Limits**: Document IDs, string lengths, and numeric limits must adhere strictly to schema validation boundaries to protect against payload poisoning and resource exhaustion attacks.

## 2. The "Dirty Dozen" Threat Payloads (Verification Invariants)
1. **Unauthenticated Write to Telemetry**: Anonymous or unverified user attempts write to `/telemetry_events/test1`. (Expected: DENIED)
2. **Telemetry Mutation Attack**: User attempts to update or delete existing audit record `/telemetry_events/{eventId}` to erase security history. (Expected: DENIED)
3. **Ghost Field Injection**: Adding unwhitelisted field `ghostKey: "exploit"` to `scanned_prompts`. (Expected: DENIED)
4. **Huge ID / Buffer Overflow**: Writing to an ID with 2KB string length `a...a`. (Expected: DENIED by `isValidId`)
5. **Self-Escalating Admin Role**: Normal user attempts to register `/users/{userId}` with `role: "admin"`. (Expected: DENIED)
6. **Cross-User Prompt Deletion**: User B tries to delete a `scanned_prompts` record authored by User A. (Expected: DENIED)
7. **Negative Risk Score / Type Confusion**: Storing `risk_score: -50` or `risk_score: "safe"`. (Expected: DENIED)
8. **Forged Author UID**: User A writes a record setting `created_by: "user_B"`. (Expected: DENIED)
9. **Missing Required Fields**: Creating `scanned_prompts` without `prompt_text` or `risk_score`. (Expected: DENIED)
10. **Oversized Prompt Payload**: Writing `prompt_text` exceeding 4096 characters limit. (Expected: DENIED)
11. **Direct Modification of System User Record**: Tampering with another user's profile document. (Expected: DENIED)
12. **Blanket Query Scraping**: Unauthorized collection scraping without filtered query. (Expected: Protected by schema and role invariants)
