# leads

Manages customer leads submitted via the public listings portal.

## Structure

```
leads/
├── services/
│   └── leadsService.ts   # Fetch leads joined with asset names
├── hooks/
│   └── useLeads.ts       # SWR hook — key: 'leads'
└── README.md
```

## Data flow

Public form (`/listings/[id]`) → `POST /api/submit-lead` → `leads` table in Supabase
→ Email notification via Resend → displayed here in dashboard.

## Database table

`leads` — columns: `id`, `asset_id` (FK), `customer_name`, `customer_phone`,
`customer_line_id`, `message`, `created_at`.

RLS: anon can INSERT only; authenticated users can SELECT all.
