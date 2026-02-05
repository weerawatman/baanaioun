# Income Feature

This feature handles all income-related functionality in the application.

## Structure

```
income/
├── services/
│   └── incomeService.ts    # Data access layer for income
└── hooks/
    ├── useIncome.ts        # Hook for fetching income
    ├── useIncomeMutations.ts # Hook for create/update/delete
    └── index.ts
```

## Services

### IncomeService

Centralized service for all income database operations.

**Methods:**
- `getIncome(filters?)` - Fetch income with optional filters
- `getIncomeById(id)` - Get a single income entry by ID
- `createIncome(input)` - Create a new income entry
- `updateIncome(id, input)` - Update an existing income entry
- `deleteIncome(id)` - Delete an income entry
- `getTotalByAsset(assetId, filters?)` - Get total income for an asset

**Features:**
- ✅ Comprehensive error handling
- ✅ Structured logging
- ✅ Type-safe with TypeScript
- ✅ Filtering by asset, source, date range
- ✅ Total income calculation

## Hooks

### useIncome

Fetches income with optional filters.

**Usage:**
```typescript
import { useIncome } from '@/features/income/hooks';

function IncomePage() {
  const { income, loading, error, refetch } = useIncome({
    assetId: 'asset-123'
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {income.map(entry => (
        <div key={entry.id}>
          {entry.source}: {entry.amount}
        </div>
      ))}
    </div>
  );
}
```

**Returns:**
- `income` - Array of income entries
- `loading` - Loading state
- `error` - Error object if any
- `refetch(showLoading?)` - Function to refetch data

### useIncomeMutations

Handles create, update, and delete operations for income.

**Usage:**
```typescript
import { useIncomeMutations } from '@/features/income/hooks';

function IncomeForm() {
  const { createIncome, creating } = useIncomeMutations();

  const handleCreate = async () => {
    const income = await createIncome({
      asset_id: 'asset-123',
      source: 'Rental Income',
      amount: 15000,
      date: '2024-01-01',
      description: 'Monthly rent - January 2024'
    });

    if (income) {
      console.log('Created:', income.id);
    }
  };

  return (
    <button onClick={handleCreate} disabled={creating}>
      {creating ? 'Creating...' : 'Add Income'}
    </button>
  );
}
```

## Filters

```typescript
interface IncomeFilters {
  assetId?: string;      // Filter by asset
  source?: string;       // Filter by source (partial match)
  startDate?: string;    // Filter by date range (start)
  endDate?: string;      // Filter by date range (end)
}
```

## Examples

### Fetch income for a specific asset
```typescript
const { income } = useIncome({ assetId: 'asset-123' });
```

### Fetch income for a date range
```typescript
const { income } = useIncome({
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});
```

### Create a new income entry
```typescript
const { createIncome } = useIncomeMutations();
await createIncome({
  asset_id: 'asset-123',
  source: 'Rental Income',
  amount: 15000,
  date: '2024-02-01',
  description: 'Monthly rent - February 2024'
});
```

### Get total income for an asset
```typescript
import { incomeService } from '@/features/income/services/incomeService';

const total = await incomeService.getTotalByAsset('asset-123', {
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});
console.log('Total income:', total);
```
