# Assets Feature

## Overview
Manages property assets including CRUD operations, filtering, pagination, and status tracking.

## Structure
```
assets/
├── components/         # Asset-specific components (to be migrated)
├── hooks/             # Custom hooks for asset logic
│   ├── useAssets.ts           # Fetch assets
│   ├── useAssetMutations.ts   # Create, update, delete
│   └── useAssetFilters.ts     # Filter and paginate
├── services/          # Data access layer
│   └── assetService.ts        # Supabase queries
└── README.md          # This file
```

## Hooks

### `useAssets(filters?)`
Fetches assets with optional filters.

**Parameters:**
- `filters` (optional): `{ status?, propertyType?, search? }`

**Returns:**
- `assets`: Array of assets
- `loading`: Loading state
- `error`: Error object if any
- `refetch`: Function to refetch data

**Example:**
```tsx
import { useAssets } from '@/features/assets/hooks';

function MyComponent() {
  const { assets, loading, error, refetch } = useAssets({ status: 'all' });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{assets.map(asset => ...)}</div>;
}
```

### `useAssetMutations()`
Provides functions for creating, updating, and deleting assets.

**Returns:**
- `creating`, `updating`, `deleting`: Loading states
- `error`: Error object if any
- `createAsset(input)`: Create new asset
- `updateAsset(id, input)`: Update existing asset
- `deleteAsset(id)`: Delete asset

**Example:**
```tsx
import { useAssetMutations } from '@/features/assets/hooks';

function MyComponent() {
  const { createAsset, creating, error } = useAssetMutations();
  
  const handleCreate = async () => {
    const asset = await createAsset({
      name: 'New Asset',
      // ... other fields
    });
    
    if (asset) {
      console.log('Created:', asset);
    }
  };
  
  return <button onClick={handleCreate} disabled={creating}>Create</button>;
}
```

### `useAssetFilters(assets, itemsPerPage?)`
Filters and paginates assets.

**Parameters:**
- `assets`: Array of assets to filter
- `itemsPerPage` (optional): Items per page (default: 20)

**Returns:**
- `filteredAssets`: Filtered assets
- `paginatedAssets`: Current page assets
- `statusFilter`, `setStatusFilter`: Status filter state
- `searchQuery`, `setSearchQuery`: Search state
- `currentPage`, `setCurrentPage`: Pagination state
- `totalPages`: Total number of pages
- `statusCounts`: Count of assets per status

**Example:**
```tsx
import { useAssets, useAssetFilters } from '@/features/assets/hooks';

function MyComponent() {
  const { assets } = useAssets();
  const {
    paginatedAssets,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    totalPages,
  } = useAssetFilters(assets);
  
  return (
    <div>
      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
        <option value="all">All</option>
        <option value="developing">Developing</option>
      </select>
      
      {paginatedAssets.map(asset => ...)}
      
      <Pagination page={currentPage} total={totalPages} onChange={setCurrentPage} />
    </div>
  );
}
```

## Services

### `assetService`
Centralized data access layer for assets.

**Methods:**
- `getAssets(filters?)`: Fetch all assets
- `getAssetById(id)`: Fetch single asset
- `createAsset(input)`: Create new asset
- `updateAsset(id, input)`: Update asset
- `deleteAsset(id)`: Delete asset

**Example:**
```tsx
import { assetService } from '@/features/assets/services/assetService';

// Direct usage (not recommended in components, use hooks instead)
const assets = await assetService.getAssets({ status: 'all' });
```

## Best Practices

1. **Use hooks in components** - Don't call services directly
2. **Handle errors** - Always check for errors from hooks
3. **Show loading states** - Use loading flags for better UX
4. **Memoize callbacks** - Prevent unnecessary re-renders
5. **Use TypeScript** - Leverage type safety

## Migration Guide

To migrate existing code to use these hooks:

**Before:**
```tsx
const [assets, setAssets] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchAssets = async () => {
    const { data } = await supabase.from('assets').select('*');
    setAssets(data);
    setLoading(false);
  };
  fetchAssets();
}, []);
```

**After:**
```tsx
const { assets, loading } = useAssets();
```

Much cleaner! 🎉
