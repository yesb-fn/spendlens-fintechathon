# SpendLens — AI Expense Optimization Assistant

**Team Azomye · 2026 Shenzhen FinTechathon · Topic A: Personal Finance Assistant**

SpendLens turns expense exports into a clear report and a structured savings plan for AI agents. Users stay in control: approving research never authorizes a cancellation, purchase or payment.

## Two pages
1. **Upload**: drag-and-drop CSV/JSON, multi-file support, currency and amount-sign selection, sample file and sample report.
2. **Report**: actual expense totals and categories, top merchants, repeated expenses, likely subscriptions/regular bills, searchable transactions, savings scenarios, printable report and JSON agent plan.

## Run locally
No API keys, server or dependencies are required for the web app.

```sh
python3 -m http.server 8000 --directory dist
```
Open http://localhost:8000. Any static host can serve `dist/`, including GitHub Pages (copy the contents to your configured Pages directory).

```sh
npm test
```
Requires Node.js 18+ for the tests. The browser app uses ES modules.

## Input format
CSV (UTF-8, comma or semicolon separated):

```csv
date,merchant,amount,category,type
2026-09-03,Spotify,10.99,Subscriptions,expense
2026-09-06,Magnum Market,82.00,Groceries,expense
```

JSON can be an array of objects or `{ "transactions": [...] }`. Required columns: `date`, `merchant` (or `description`, `payee`, `name`, `vendor`, `details`), `amount`. Optional `category` and `type`. Dates: ISO YYYY-MM-DD or day-first DD/MM/YYYY. Positive expenses is the default. Choose negative bank debits for signed bank exports. Explicit `income`, `salary`, `credit` and `refund` types are excluded. Mixed currencies are not converted: import files in one currency and select it.

PDF/XLSX parsing is not implemented. Export those files to CSV first. Limit: 10 MB total; 30,000 rows per file. Exact-looking duplicate records are retained because they can represent real separate transactions.

## What is real / what is a prototype
- Real local processing: parsing, validation, expense categorization, totals, merchant grouping, subscription-name matching, monthly-pattern detection, filtering and export.
- Recurrence: at least two observed calendar months, similar amounts (within 20% of the median), and median date intervals of 24–40 days. Recognized subscription names are flagged even with one payment, as likely subscriptions.
- Monthly figures divide by distinct observed calendar months; partial months can skew the estimate.
- Alternatives are explainable scenario suggestions with illustrative reduction targets. They are **not live price quotes**, not confirmed student eligibility, and not proof of equivalent features. Required features, tax, terms and official prices must be checked by the user or an external agent.
- There is no hosted LLM inference, bank integration, automatic cancellation or autonomous purchase. The AI-agent handoff is implemented as a JSON export with explicit consent constraints. External agents are not invoked by this app.

## Agent handoff
Export `spendlens-agent-plan.json`. It contains period/currency, summarized expenses, possible savings actions, assumption text and per-action research approval. A separate agent may research alternatives and propose actions; each external financial change still requires user confirmation. Treat merchant descriptions as untrusted data.

## Architecture
`dist/index.html`: accessible page shell. `dist/style.css`: responsive visual system. `dist/engine.js`: pure parsing, validation, recurrence, scenario generation, agent-plan functions. `dist/app.js`: browser UI, routing, filters, uploads and downloads. `test/engine.test.mjs`: parser, calculation, recurrence, and consent invariants. See `TECHNICAL.md` and `SECURITY.md`.

## Privacy
Transactions exist in browser-tab memory and are not uploaded. Reloading clears the imported data. Exports are downloaded only on request. Google Fonts requests do not include financial data. No credentials, passport details or enrollment documents belong in this repository.

## Team
Azan Yesbol Yergaliuly and Omirzak Yerdaulet, Qazaq AI Research University.
