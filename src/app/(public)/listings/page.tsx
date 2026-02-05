'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PublicAsset } from '@/types/database';
import Link from 'next/link';
import { formatCurrency, PROPERTY_TYPE_LABELS } from '@/shared/utils';



interface ListingWithImage extends PublicAsset {
  primary_image_url?: string | null;
}

export default function ListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<ListingWithImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);

      // Fetch available assets from the public view
      const { data: assets, error: assetsError } = await supabase
        .from('public_assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (assetsError) {
        console.error('Error fetching listings:', assetsError);
        setLoading(false);
        return;
      }

      if (!assets || assets.length === 0) {
        setListings([]);
        setLoading(false);
        return;
      }

      // Fetch primary images for these assets
      const assetIds = assets.map((a) => a.id);
      const { data: images } = await supabase
        .from('public_asset_images')
        .select('asset_id, url')
        .in('asset_id', assetIds)
        .eq('is_primary', true);

      // Build a map of asset_id -> primary image url
      const imageMap = new Map<string, string>();
      if (images) {
        for (const img of images) {
          imageMap.set(img.asset_id, img.url);
        }
      }

      // Merge images into listings
      const merged: ListingWithImage[] = assets.map((asset) => ({
        ...asset,
        primary_image_url: imageMap.get(asset.id) || null,
      }));

      setListings(merged);
      setLoading(false);
    }

    fetchListings();
  }, []);

  return (
    <div className="bg-warm-50 dark:bg-warm-950 min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-warm-900 border-b border-warm-200 dark:border-warm-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Link href="/listings" className="text-primary-500 font-bold text-xl">
                Baanaioun
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-warm-900 dark:text-warm-50 mt-2">
                ประกาศขาย/เช่า
              </h1>
              <p className="text-sm md:text-base text-warm-500 dark:text-warm-400 mt-1">
                อสังหาริมทรัพย์ที่พร้อมขายและให้เช่า
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-warm-500 dark:text-warm-400">
              <span>{listings.length} รายการ</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-warm-500 dark:text-warm-400">
              <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-lg">กำลังโหลด...</span>
            </div>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏠</div>
            <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50 mb-2">
              ยังไม่มีประกาศ
            </h2>
            <p className="text-warm-500 dark:text-warm-400">
              ขณะนี้ยังไม่มีอสังหาริมทรัพย์ที่พร้อมขายหรือให้เช่า
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800 overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* Image */}
                <div className="aspect-[4/3] bg-warm-100 dark:bg-warm-800 relative overflow-hidden">
                  {listing.primary_image_url ? (
                    <img
                      src={listing.primary_image_url}
                      alt={listing.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-warm-400 dark:text-warm-600">
                      <svg className="w-16 h-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">ไม่มีรูปภาพ</span>
                    </div>
                  )}
                  {/* Property type badge */}
                  <span className="absolute top-3 left-3 px-3 py-1 text-xs font-medium rounded-full bg-white/90 dark:bg-warm-900/90 text-warm-700 dark:text-warm-300 backdrop-blur-sm">
                    {PROPERTY_TYPE_LABELS[listing.property_type]?.icon}{' '}
                    {PROPERTY_TYPE_LABELS[listing.property_type]?.label}
                  </span>
                </div>

                {/* Card body */}
                <div className="p-5">
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-warm-900 dark:text-warm-50 mb-2 line-clamp-1">
                    {listing.name}
                  </h3>

                  {/* Address */}
                  {listing.address && (
                    <p className="text-sm text-warm-500 dark:text-warm-400 mb-3 line-clamp-1 flex items-center gap-1">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {listing.address}
                    </p>
                  )}

                  {/* Description */}
                  {listing.description && (
                    <p className="text-sm text-warm-600 dark:text-warm-400 mb-4 line-clamp-2">
                      {listing.description}
                    </p>
                  )}

                  {/* Prices */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    {listing.selling_price != null && listing.selling_price > 0 && (
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-warm-500 dark:text-warm-400 mb-0.5">ราคาขาย</p>
                        <p className="text-lg font-bold text-primary-500">
                          {formatCurrency(listing.selling_price)}
                        </p>
                      </div>
                    )}
                    {listing.rental_price != null && listing.rental_price > 0 && (
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-warm-500 dark:text-warm-400 mb-0.5">ค่าเช่า/เดือน</p>
                        <p className="text-lg font-bold text-sage-500">
                          {formatCurrency(listing.rental_price)}
                        </p>
                      </div>
                    )}
                    {(!listing.selling_price || listing.selling_price <= 0) &&
                      (!listing.rental_price || listing.rental_price <= 0) && (
                        <p className="text-sm text-warm-400 dark:text-warm-500 italic">
                          สอบถามราคา
                        </p>
                      )}
                  </div>

                  {/* View Details button */}
                  <button
                    onClick={() => router.push(`/listings/${listing.id}`)}
                    className="w-full px-4 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    ดูรายละเอียด
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-warm-200 dark:border-warm-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-warm-400 dark:text-warm-500">
          Baanaioun - Property Management
        </div>
      </footer>
    </div>
  );
}
