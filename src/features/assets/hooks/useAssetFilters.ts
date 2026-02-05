import { useState, useMemo, useEffect, useCallback } from 'react';
import { Asset, AssetStatus } from '@/types/database';

interface UseAssetFiltersReturn {
    filteredAssets: Asset[];
    statusFilter: AssetStatus | 'all';
    setStatusFilter: (status: AssetStatus | 'all') => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    statusCounts: Record<AssetStatus | 'all', number>;
    currentPage: number;
    setCurrentPage: (page: number | ((prev: number) => number)) => void;
    paginatedAssets: Asset[];
    totalPages: number;
    itemsPerPage: number;
}

/**
 * Custom hook for filtering and paginating assets
 * @param assets - Array of assets to filter
 * @param itemsPerPage - Number of items per page (default: 20)
 * @returns Filtered assets, pagination state, and filter controls
 */
export function useAssetFilters(
    assets: Asset[],
    itemsPerPage: number = 20
): UseAssetFiltersReturn {
    const [statusFilter, setStatusFilter] = useState<AssetStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Filter assets based on status and search
    const filteredAssets = useMemo(() => {
        let filtered = assets;

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(asset => asset.status === statusFilter);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(asset =>
                asset.name.toLowerCase().includes(query) ||
                asset.title_deed_number.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [assets, statusFilter, searchQuery]);

    // Calculate status counts
    const statusCounts = useMemo(() => ({
        all: assets.length,
        developing: assets.filter(a => a.status === 'developing').length,
        ready_for_sale: assets.filter(a => a.status === 'ready_for_sale').length,
        ready_for_rent: assets.filter(a => a.status === 'ready_for_rent').length,
        rented: assets.filter(a => a.status === 'rented').length,
        sold: assets.filter(a => a.status === 'sold').length,
    }), [assets]);

    // Paginate filtered assets
    const paginatedAssets = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredAssets.slice(startIndex, endIndex);
    }, [filteredAssets, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, searchQuery]);

    // Memoize setters to prevent unnecessary re-renders
    const handleSetStatusFilter = useCallback((status: AssetStatus | 'all') => {
        setStatusFilter(status);
    }, []);

    const handleSetSearchQuery = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    const handleSetCurrentPage = useCallback((page: number | ((prev: number) => number)) => {
        setCurrentPage(page);
    }, []);

    return {
        filteredAssets,
        statusFilter,
        setStatusFilter: handleSetStatusFilter,
        searchQuery,
        setSearchQuery: handleSetSearchQuery,
        statusCounts,
        currentPage,
        setCurrentPage: handleSetCurrentPage,
        paginatedAssets,
        totalPages,
        itemsPerPage,
    };
}
