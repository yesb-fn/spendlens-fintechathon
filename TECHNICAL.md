# Technical documentation

## Data flow
User PDF/Excel/CSV/JSON → local parser → normalized transactions → pure analysis → report → user-reviewed JSON export → optional external agent.

## Components and core logic
- CSV state machine supports BOM, quoted delimiters/newlines and escaped quotes. Semicolon format is recognized.
- Header aliases, amount normalization and calendar-date validation produce consistent records. Invalid rows and excluded income counts are disclosed.
- User-supplied categories take precedence; otherwise merchant keywords assign categories.
- Merchant normalization removes payment descriptors and long numeric identifiers. It is heuristic and may merge unrelated merchants; users should inspect transactions.
- Expense groups track payment count, total, median and distinct calendar months. Likely monthly bills require regular intervals and stable amounts. Recognized subscription keywords provide a second signal.
- Savings targets use disclosed illustrative percentages rather than fabricated vendor prices. Rent and unavoidable utilities are excluded from generic plan changes.
- Export schema `spendlens.savings-plan.v1` includes user approval for research only, required confirmation actions and untrusted-data instructions.

## Deployment
Static web application with ES modules; serve `dist/` over HTTP. No build, backend, bank credentials or API keys. Host static assets on any ordinary static web host. App navigation uses hash routes so both screens work without server rewrites.

## Limitations
One currency per report; no FX conversion. No PDF/XLSX input, hosted LLM, live-offer retrieval, automatic bank connections, real financial execution or background agents. Monthly averages use observed months rather than complete billing periods. Categories and merchant identity can be wrong. No guarantees of equal value or actual achievable savings.

## Execution evidence
`npm test` runs deterministic input-to-output checks. In the UI, select “Explore a sample report” to reproduce the fictional multi-month analysis. Export the categorized CSV and agent JSON as inspectable evidence. No real account or external financial action is executed.

PDF and Excel import: dist/importers.js, with bundled local PDF.js and SheetJS dependencies and licenses in dist/vendor. PDF extraction groups text by page position and accepts explicit dated transaction rows; unsupported layouts show an error. No OCR or remote document service.
