# Expenses Feature

This feature handles all expense-related functionality in the application.

## Structure

```
expenses/
├── services/
│   └── expenseService.ts    # Data access layer for expenses
└── hooks/
    ├── useExpenses.ts       # Hook for fetching expenses
    ├── useExpenseMutations.ts # Hook for create/update/delete
    └── index.ts
```

## Services

### ExpenseService

Centralized service for all expense database operations.

**Methods:**
- `getExpenses(filters?)` - Fetch expenses with optional filters
- `getExpenseById(id)` - Get a single expense by ID
- `createExpense(input)` - Create a new expense
- `updateExpense(id, input)` - Update an existing expense
- `deleteExpense(id)` - Delete an expense
- `getTotalByCategory(filters?)` - Get totals grouped by category

**Features:**
- ✅ Comprehensive error handling
- ✅ Structured logging
- ✅ Type-safe with TypeScript
- ✅ Filtering by category, asset, renovation, date range
- ✅ Category totals calculation

## Hooks

### useExpenses

Fetches expenses with optional filters.

**Usage:**
```typescript
import { useExpenses } from '@/features/expenses/hooks';

function ExpensesPage() {
  const { expenses, loading, error, refetch } = useExpenses({
    category: 'materials',
    assetId: 'asset-123'
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {expenses.map(expense => (
        <div key={expense.id}>
          {expense.description}: {expense.amount}
        </div>
      ))}
    </div>
  );
}
```

**Returns:**
- `expenses` - Array of expenses
- `loading` - Loading state
- `error` - Error object if any
- `refetch(showLoading?)` - Function to refetch data

### useExpenseMutations

Handles create, update, and delete operations for expenses.

**Usage:**
```typescript
import { useExpenseMutations } from '@/features/expenses/hooks';

function ExpenseForm() {
  const { createExpense, creating } = useExpenseMutations();

  const handleCreate = async () => {
    const expense = await createExpense({
      asset_id: 'asset-123',
      category: 'materials',
      amount: 50000,
      date: '2024-01-15',
      description: 'Cement and bricks',
      vendor: 'ABC Building Supplies'
    });

    if (expense) {
      console.log('Created:', expense.id);
    }
  };

  return (
    <button onClick={handleCreate} disabled={creating}>
      {creating ? 'Creating...' : 'Add Expense'}
    </button>
  );
}
```

## Filters

```typescript
interface ExpenseFilters {
  category?: ExpenseCategory;     // 'materials' | 'labor' | 'service' | etc.
  assetId?: string;               // Filter by asset
  renovationProjectId?: string;   // Filter by renovation project
  startDate?: string;             // Filter by date range (start)
  endDate?: string;               // Filter by date range (end)
}
```

## Expense Categories

- `materials` - Construction materials
- `labor` - Labor costs
- `service` - Service fees
- `electricity` - Electricity costs
- `land_filling` - Land filling costs
- `building_permit` - Permit fees
- `foundation` - Foundation work
- `architect_fee` - Architect fees

## Examples

### Fetch material expenses
```typescript
const { expenses } = useExpenses({ category: 'materials' });
```

### Fetch expenses for a date range
```typescript
const { expenses } = useExpenses({
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
```

### Create a new expense
```typescript
const { createExpense } = useExpenseMutations();
await createExpense({
  asset_id: 'asset-123',
  category: 'labor',
  amount: 75000,
  date: '2024-01-20',
  description: 'Construction workers - Week 1'
});
```
