# Security self-assessment

## Permission tiers
1. Read-only local analysis: parsing and reporting have no bank connection or credential access.
2. Explicit export: user clicks to download financial summaries to their own device.
3. Research approval: checkboxes mark individual suggestions `approved_for_research_only` in the exported JSON.
4. External execution: not implemented. A downstream agent must ask the user before logging in, changing plans, cancelling subscriptions, purchasing or paying. Exported research approval does not authorize those actions.

## Controls
- Transaction files remain in browser-tab memory; they are not posted to a server, persisted to localStorage or synced.
- User text is escaped before HTML insertion. Merchant text is not executable HTML or agent instructions.
- No API keys or private data committed. No bank passwords collected.
- File size and per-file row limits; invalid dates and amounts rejected; CSV errors are shown.
- External research links open separately with `noopener noreferrer`.
- Export includes untrusted-data instructions, estimates, safety policy and explicit confirmation requirements.

## Known risks and boundaries
- Browser memory can be visible to malicious extensions or others with device access.
- The JSON/CSV exports contain financial information; users must review recipients and agent permissions.
- Heuristic merchant matching, recurrence and categories may be wrong. User-supplied categories are unverified.
- CSV export quotes every value, but spreadsheet formula injection remains a risk if merchant names begin with formula characters; consumers should import as text. The CSV exporter neutralizes formula prefixes.
- A downstream agent might ignore the consent policy; this app cannot enforce permissions inside another system. Never give that system blanket bank access.
- Public cloud hosting hosts only static app code. It does not receive uploaded files. Google Fonts is an external styling resource; system-font fallback is available.
- All alternatives and monthly savings are hypothetical scenarios until independently verified. There is no live market data or investment advice.

## Test coverage
Quoted CSV edge cases, locale numbers, missing headers, invalid dates, signed bank debits, recurrence versus duplicate-like transactions, exclusion of rent plan changes, and research-only consent serialization.
