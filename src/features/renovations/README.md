# Renovations Feature

This feature handles all renovation project-related functionality in the application.

## Structure

```
renovations/
├── services/
│   └── renovationService.ts    # Data access layer for renovations
└── hooks/
    ├── useRenovations.ts        # Hook for fetching renovations
    ├── useRenovationMutations.ts # Hook for create/update/delete
    └── index.ts
```

## Services

### RenovationService

Centralized service for all renovation project database operations.

**Methods:**
- `getRenovations(filters?)` - Fetch renovations with optional filters
- `getRenovationById(id)` - Get a single renovation by ID
- `createRenovation(input)` - Create a new renovation
- `updateRenovation(id, input)` - Update an existing renovation
- `deleteRenovation(id)` - Delete a renovation

**Features:**
- ✅ Comprehensive error handling
- ✅ Structured logging
- ✅ Type-safe with TypeScript
- ✅ Filtering by status, asset, project type

## Hooks

### useRenovations

Fetches renovation projects with optional filters.

**Usage:**
```typescript
import { useRenovations } from '@/features/renovations/hooks';

function RenovationsPage() {
  const { renovations, loading, error, refetch } = useRenovations({
    status: 'in_progress',
    assetId: 'asset-123'
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {renovations.map(renovation => (
        <div key={renovation.id}>{renovation.name}</div>
      ))}
    </div>
  );
}
```

**Returns:**
- `renovations` - Array of renovation projects
- `loading` - Loading state
- `error` - Error object if any
- `refetch(showLoading?)` - Function to refetch data

### useRenovationMutations

Handles create, update, and delete operations for renovations.

**Usage:**
```typescript
import { useRenovationMutations } from '@/features/renovations/hooks';

function RenovationForm() {
  const { createRenovation, updateRenovation, deleteRenovation, creating } = useRenovationMutations();

  const handleCreate = async () => {
    const renovation = await createRenovation({
      asset_id: 'asset-123',
      name: 'Kitchen Renovation',
      start_date: '2024-01-01',
      budget: 500000,
      status: 'planned',
      project_type: 'renovation'
    });

    if (renovation) {
      console.log('Created:', renovation.id);
    }
  };

  return (
    <button onClick={handleCreate} disabled={creating}>
      {creating ? 'Creating...' : 'Create Renovation'}
    </button>
  );
}
```

**Returns:**
- `createRenovation(input)` - Create function
- `updateRenovation(id, input)` - Update function
- `deleteRenovation(id)` - Delete function
- `creating` - Creating state
- `updating` - Updating state
- `deleting` - Deleting state
- `error` - Error object if any

## Filters

```typescript
interface RenovationFilters {
  status?: RenovationStatus;      // 'planned' | 'in_progress' | 'completed' | 'cancelled'
  assetId?: string;               // Filter by asset
  projectType?: ProjectType;      // 'renovation' | 'new_construction'
}
```

## Examples

### Fetch all in-progress renovations
```typescript
const { renovations } = useRenovations({ status: 'in_progress' });
```

### Fetch renovations for a specific asset
```typescript
const { renovations } = useRenovations({ assetId: 'asset-123' });
```

### Create a new renovation
```typescript
const { createRenovation } = useRenovationMutations();
const renovation = await createRenovation({
  asset_id: 'asset-123',
  name: 'Bathroom Renovation',
  start_date: '2024-02-01',
  budget: 300000,
  status: 'planned',
  project_type: 'renovation'
});
```

### Update renovation status
```typescript
const { updateRenovation } = useRenovationMutations();
await updateRenovation('renovation-id', {
  status: 'completed',
  end_date: '2024-03-01'
});
```
