'use client';

import { useState } from 'react';
import { AssetImage, ImageCategory } from '@/types/database';

interface TimelinePhase {
  id: string;
  title: string;
  titleTh: string;
  categories: ImageCategory[];
  icon: string;
}

const timelinePhases: TimelinePhase[] = [
  {
    id: 'original',
    title: 'Original State',
    titleTh: 'สภาพเดิม',
    categories: ['purchase', 'before_renovation'],
    icon: '📷',
  },
  {
    id: 'in_progress',
    title: 'During Construction/Renovation',
    titleTh: 'ระหว่างดำเนินการ',
    categories: ['in_progress'],
    icon: '🏗️',
  },
  {
    id: 'completed',
    title: 'Completed',
    titleTh: 'เสร็จสิ้น',
    categories: ['after_renovation', 'final'],
    icon: '✅',
  },
];

interface ProjectTimelineGalleryProps {
  images: AssetImage[];
  onImageClick: (url: string) => void;
  onDeleteImage: (image: AssetImage) => void;
  imageCategoryLabels: Record<ImageCategory, { label: string; color: string }>;
}

export default function ProjectTimelineGallery({
  images,
  onImageClick,
  onDeleteImage,
  imageCategoryLabels,
}: ProjectTimelineGalleryProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(
    new Set(timelinePhases.map((p) => p.id))
  );

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(phaseId)) {
        newSet.delete(phaseId);
      } else {
        newSet.add(phaseId);
      }
      return newSet;
    });
  };

  const getPhaseImages = (phase: TimelinePhase): AssetImage[] => {
    return images.filter((img) => phase.categories.includes(img.category));
  };

  return (
    <div className="space-y-0">
      {timelinePhases.map((phase, index) => {
        const phaseImages = getPhaseImages(phase);
        const isExpanded = expandedPhases.has(phase.id);
        const isLast = index === timelinePhases.length - 1;

        return (
          <div key={phase.id} className="relative">
            {/* Timeline connector line */}
            {!isLast && (
              <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-warm-200 dark:bg-warm-700" />
            )}

            {/* Phase header */}
            <button
              onClick={() => togglePhase(phase.id)}
              className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-warm-50 dark:hover:bg-warm-800/50 transition-colors"
            >
              {/* Timeline dot with icon */}
              <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-warm-900 border-2 border-warm-200 dark:border-warm-700 text-lg">
                {phase.icon}
              </div>

              {/* Phase title */}
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-warm-900 dark:text-warm-50">
                  {phase.titleTh}
                </h3>
                <p className="text-sm text-warm-500 dark:text-warm-400">
                  {phase.title}
                </p>
              </div>

              {/* Image count and expand indicator */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-sm font-medium rounded-full bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-300">
                  {phaseImages.length} รูป
                </span>
                <svg
                  className={`w-5 h-5 text-warm-400 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {/* Phase content */}
            {isExpanded && (
              <div className="ml-14 pb-6">
                {phaseImages.length === 0 ? (
                  <div className="py-8 text-center text-warm-500 dark:text-warm-400 bg-warm-50 dark:bg-warm-800/30 rounded-xl">
                    <svg
                      className="w-12 h-12 mx-auto mb-3 text-warm-300 dark:text-warm-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm font-medium">ยังไม่มีรูปในช่วงนี้</p>
                    <p className="text-xs mt-1">
                      อัปโหลดรูปประเภท{' '}
                      {phase.categories
                        .map((cat) => imageCategoryLabels[cat]?.label)
                        .join(' หรือ ')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {phaseImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <div
                          className="aspect-square rounded-xl overflow-hidden bg-warm-100 dark:bg-warm-800 cursor-pointer"
                          onClick={() => onImageClick(image.url)}
                        >
                          <img
                            src={image.url}
                            alt={image.caption || 'Asset image'}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                        <span
                          className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium ${
                            imageCategoryLabels[image.category]?.color
                          }`}
                        >
                          {imageCategoryLabels[image.category]?.label}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteImage(image);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Total images summary */}
      {images.length === 0 && (
        <div className="text-center py-12 text-warm-500 dark:text-warm-400">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-warm-300 dark:text-warm-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-lg font-medium mb-2">ยังไม่มีรูปภาพ</p>
          <p className="text-sm">
            เลือกประเภทและอัปโหลดรูปภาพของทรัพย์สินเพื่อดูไทม์ไลน์
          </p>
        </div>
      )}
    </div>
  );
}
