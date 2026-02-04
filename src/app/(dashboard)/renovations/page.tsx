'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Asset, RenovationProjectWithAsset, Expense, RenovationStatus, ExpenseCategory, ProjectType, PropertyType, AssetStatus } from '@/types/database';
import AddRenovationProjectModal from '@/components/AddRenovationProjectModal';
import AddExpenseModal from '@/components/AddExpenseModal';

const statusLabels: Record<RenovationStatus, { label: string; color: string }> = {
  planned: { label: 'วางแผน', color: 'bg-warm-100 text-warm-800 dark:bg-warm-700 dark:text-warm-300' },
  in_progress: { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  completed: { label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: 'ยกเลิก', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

const categoryLabels: Record<ExpenseCategory, { label: string; color: string; group: 'general' | 'construction' }> = {
  // General categories
  materials: { label: 'ค่าวัสดุ', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', group: 'general' },
  labor: { label: 'ค่าแรง', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', group: 'general' },
  service: { label: 'ค่าบริการช่าง', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', group: 'general' },
  electricity: { label: 'ค่าไฟฟ้า', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', group: 'general' },
  // Construction-specific categories
  land_filling: { label: 'ถมดิน', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', group: 'construction' },
  building_permit: { label: 'ขออนุญาต', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400', group: 'construction' },
  foundation: { label: 'งานฐานราก', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', group: 'construction' },
  architect_fee: { label: 'ค่าสถาปนิก', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400', group: 'construction' },
};

const projectTypeLabels: Record<ProjectType, { label: string; color: string; icon: string }> = {
  renovation: { label: 'ปรับปรุง', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: '🔧' },
  new_construction: { label: 'สร้างใหม่', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: '🏗️' },
};

const propertyTypeLabels: Record<PropertyType, string> = {
  land: 'ที่ดิน',
  house: 'บ้านเดี่ยว',
  semi_detached_house: 'บ้านแฝด',
  condo: 'คอนโดมิเนียม',
  townhouse: 'ทาวน์เฮ้าส์',
  commercial: 'อาคารพาณิชย์',
  other: 'อื่นๆ',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface ProjectCardProps {
  project: RenovationProjectWithAsset;
  isExpanded: boolean;
  totalExpenses: number;
  budgetUsedPercent: number;
  expensesByCategory: Record<ExpenseCategory, number>;
  expenses: Record<string, Expense[]>;
  onToggle: () => void;
  onMarkComplete: () => void;
  onStartProgress: () => void;
  onAddExpense: () => void;
}

function ProjectCard({
  project,
  isExpanded,
  totalExpenses,
  budgetUsedPercent,
  expensesByCategory,
  expenses,
  onToggle,
  onMarkComplete,
  onStartProgress,
  onAddExpense,
}: ProjectCardProps) {
  return (
    <div className="bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800 overflow-hidden">
      {/* Project Header */}
      <div
        className="p-6 cursor-pointer hover:bg-warm-50 dark:hover:bg-warm-800/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-warm-900 dark:text-warm-50">
                {project.name}
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${projectTypeLabels[project.project_type || 'renovation'].color}`}>
                {projectTypeLabels[project.project_type || 'renovation'].icon} {projectTypeLabels[project.project_type || 'renovation'].label}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusLabels[project.status].color}`}>
                {statusLabels[project.status].label}
              </span>
              {project.project_type === 'new_construction' && project.target_property_type && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                  → {propertyTypeLabels[project.target_property_type]}
                </span>
              )}
            </div>
            <p className="text-sm text-warm-500 dark:text-warm-400 mb-2">
              {project.assets?.name} ({project.assets?.title_deed_number})
            </p>
            {project.description && (
              <p className="text-sm text-warm-600 dark:text-warm-400">
                {project.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-warm-500 dark:text-warm-400">งบประมาณ</p>
              <p className="text-lg font-semibold text-warm-900 dark:text-warm-50">
                {formatCurrency(project.budget)}
              </p>
            </div>
            <svg
              className={`w-5 h-5 text-warm-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Budget Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-warm-500 dark:text-warm-400">ใช้ไปแล้ว</span>
            <span className={`font-medium ${budgetUsedPercent > 100 ? 'text-red-600 dark:text-red-400' : 'text-warm-900 dark:text-warm-50'}`}>
              {formatCurrency(totalExpenses)} ({budgetUsedPercent.toFixed(1)}%)
            </span>
          </div>
          <div className="h-2 bg-warm-200 dark:bg-warm-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                budgetUsedPercent > 100
                  ? 'bg-red-500'
                  : budgetUsedPercent > 80
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="mt-3 flex gap-4 text-sm text-warm-500 dark:text-warm-400">
          <span>เริ่ม: {formatDate(project.start_date)}</span>
          {project.end_date && <span>สิ้นสุด: {formatDate(project.end_date)}</span>}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-warm-200 dark:border-warm-800">
          {/* Action Buttons */}
          {project.status !== 'completed' && project.status !== 'cancelled' && (
            <div className="p-4 bg-warm-50 dark:bg-warm-800/50 border-b border-warm-200 dark:border-warm-700 flex gap-2">
              <button
                onClick={e => {
                  e.stopPropagation();
                  onMarkComplete();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                ทำเครื่องหมายว่าเสร็จสิ้น
              </button>
              {project.status === 'planned' && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onStartProgress();
                  }}
                  className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  เริ่มดำเนินการ
                </button>
              )}
            </div>
          )}

          {/* Budget vs Actual Summary */}
          <div className="p-6 bg-gradient-to-r from-primary-50 to-gold-50 dark:from-primary-900/20 dark:to-gold-900/20 border-b border-warm-200 dark:border-warm-700">
            <h4 className="text-sm font-medium text-warm-700 dark:text-warm-300 mb-4">
              งบประมาณ vs ค่าใช้จ่ายจริง
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white dark:bg-warm-900 rounded-xl p-4 border border-warm-200 dark:border-warm-700">
                <p className="text-xs text-warm-500 dark:text-warm-400 mb-1">งบประมาณทั้งหมด</p>
                <p className="text-xl font-bold text-warm-900 dark:text-warm-50">{formatCurrency(project.budget)}</p>
              </div>
              <div className="bg-white dark:bg-warm-900 rounded-xl p-4 border border-warm-200 dark:border-warm-700">
                <p className="text-xs text-warm-500 dark:text-warm-400 mb-1">ใช้ไปแล้ว</p>
                <p className={`text-xl font-bold ${budgetUsedPercent > 100 ? 'text-red-600 dark:text-red-400' : 'text-primary-500 dark:text-primary-400'}`}>
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
              <div className="bg-white dark:bg-warm-900 rounded-xl p-4 border border-warm-200 dark:border-warm-700">
                <p className="text-xs text-warm-500 dark:text-warm-400 mb-1">คงเหลือ</p>
                <p className={`text-xl font-bold ${project.budget - totalExpenses < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {formatCurrency(project.budget - totalExpenses)}
                </p>
              </div>
            </div>
            {/* Enhanced Progress Bar */}
            <div className="bg-white dark:bg-warm-900 rounded-xl p-4 border border-warm-200 dark:border-warm-700">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-warm-600 dark:text-warm-400">ความคืบหน้าการใช้งบประมาณ</span>
                <span className={`font-semibold ${
                  budgetUsedPercent > 100 ? 'text-red-600 dark:text-red-400' :
                  budgetUsedPercent > 80 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {budgetUsedPercent.toFixed(1)}%
                </span>
              </div>
              <div className="h-4 bg-warm-200 dark:bg-warm-700 rounded-full overflow-hidden relative">
                {/* Warning threshold markers */}
                <div className="absolute top-0 left-[80%] w-px h-full bg-yellow-400 dark:bg-yellow-500 z-10" />
                <div className="absolute top-0 left-full w-px h-full bg-red-400 dark:bg-red-500 z-10" style={{ left: '100%' }} />
                <div
                  className={`h-full transition-all duration-500 ${
                    budgetUsedPercent > 100 ? 'bg-red-500' :
                    budgetUsedPercent > 80 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-warm-500 dark:text-warm-400 mt-1">
                <span>0%</span>
                <span className="text-yellow-600 dark:text-yellow-400">80%</span>
                <span className="text-red-600 dark:text-red-400">100%</span>
              </div>
            </div>
          </div>

          {/* Category Summary */}
          <div className="p-6 bg-warm-50 dark:bg-warm-800/50">
            <h4 className="text-sm font-medium text-warm-700 dark:text-warm-300 mb-3">
              สรุปค่าใช้จ่ายตามหมวดหมู่
            </h4>

            {/* General Categories */}
            <p className="text-xs text-warm-500 dark:text-warm-400 mb-2">ทั่วไป</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {(Object.entries(categoryLabels) as [ExpenseCategory, { label: string; color: string; group: string }][])
                .filter(([, { group }]) => group === 'general')
                .map(([key, { label, color }]) => (
                  <div
                    key={key}
                    className="bg-white dark:bg-warm-900 rounded-xl p-3 border border-warm-200 dark:border-warm-700"
                  >
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color} mb-2`}>
                      {label}
                    </span>
                    <p className="text-lg font-semibold text-warm-900 dark:text-warm-50">
                      {formatCurrency(expensesByCategory[key] || 0)}
                    </p>
                  </div>
                ))}
            </div>

            {/* Construction Categories */}
            <p className="text-xs text-warm-500 dark:text-warm-400 mb-2">งานก่อสร้าง</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(Object.entries(categoryLabels) as [ExpenseCategory, { label: string; color: string; group: string }][])
                .filter(([, { group }]) => group === 'construction')
                .map(([key, { label, color }]) => (
                  <div
                    key={key}
                    className="bg-white dark:bg-warm-900 rounded-xl p-3 border border-warm-200 dark:border-warm-700"
                  >
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color} mb-2`}>
                      {label}
                    </span>
                    <p className="text-lg font-semibold text-warm-900 dark:text-warm-50">
                      {formatCurrency(expensesByCategory[key] || 0)}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* Expenses List */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium text-warm-700 dark:text-warm-300">
                รายการค่าใช้จ่าย
              </h4>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onAddExpense();
                }}
                className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                เพิ่มค่าใช้จ่าย
              </button>
            </div>

            {!expenses[project.id] ? (
              <p className="text-center text-warm-500 dark:text-warm-400 py-4">กำลังโหลด...</p>
            ) : expenses[project.id].length === 0 ? (
              <div className="text-center py-8 text-warm-500 dark:text-warm-400">
                <svg className="w-12 h-12 mx-auto mb-2 text-warm-300 dark:text-warm-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
                <p>ยังไม่มีรายการค่าใช้จ่าย</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-warm-500 dark:text-warm-400 uppercase tracking-wider">
                      <th className="pb-3">วันที่</th>
                      <th className="pb-3">หมวดหมู่</th>
                      <th className="pb-3">รายละเอียด</th>
                      <th className="pb-3">ร้านค้า/ผู้รับเหมา</th>
                      <th className="pb-3 text-right">จำนวนเงิน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-200 dark:divide-warm-700">
                    {expenses[project.id].map(expense => (
                      <tr key={expense.id} className="text-sm">
                        <td className="py-3 text-warm-600 dark:text-warm-400">
                          {formatDate(expense.date)}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryLabels[expense.category as ExpenseCategory]?.color || 'bg-warm-100 text-warm-800'}`}>
                            {categoryLabels[expense.category as ExpenseCategory]?.label || expense.category}
                          </span>
                        </td>
                        <td className="py-3 text-warm-900 dark:text-warm-50">
                          {expense.description || '-'}
                        </td>
                        <td className="py-3 text-warm-600 dark:text-warm-400">
                          {expense.vendor || '-'}
                        </td>
                        <td className="py-3 text-right font-medium text-warm-900 dark:text-warm-50">
                          {formatCurrency(expense.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RenovationsPage() {
  const [projects, setProjects] = useState<RenovationProjectWithAsset[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [expenses, setExpenses] = useState<Record<string, Expense[]>>({});
  const [loading, setLoading] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [expenseModalProject, setExpenseModalProject] = useState<{ id: string; assetId: string } | null>(null);
  const [filterType, setFilterType] = useState<'all' | ProjectType>('all');
  const [completionModal, setCompletionModal] = useState<{
    project: RenovationProjectWithAsset;
    show: boolean;
    newAssetName: string;
    updateAssetName: boolean;
  } | null>(null);

  const fetchAssets = async () => {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching assets:', error);
    } else {
      setAssets(data || []);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('renovation_projects')
      .select('*, assets(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const fetchExpenses = async (projectId: string) => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('renovation_project_id', projectId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
    } else {
      setExpenses(prev => ({ ...prev, [projectId]: data || [] }));
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchProjects();
  }, []);

  const toggleProject = async (projectId: string) => {
    if (expandedProject === projectId) {
      setExpandedProject(null);
    } else {
      setExpandedProject(projectId);
      if (!expenses[projectId]) {
        await fetchExpenses(projectId);
      }
    }
  };

  const handleAddExpense = (projectId: string, assetId: string) => {
    setExpenseModalProject({ id: projectId, assetId });
  };

  const getTotalExpenses = (projectId: string): number => {
    const projectExpenses = expenses[projectId] || [];
    return projectExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  const getExpensesByCategory = (projectId: string): Record<ExpenseCategory, number> => {
    const projectExpenses = expenses[projectId] || [];
    return projectExpenses.reduce(
      (acc, exp) => {
        acc[exp.category as ExpenseCategory] = (acc[exp.category as ExpenseCategory] || 0) + exp.amount;
        return acc;
      },
      {
        materials: 0,
        labor: 0,
        service: 0,
        electricity: 0,
        land_filling: 0,
        building_permit: 0,
        foundation: 0,
        architect_fee: 0,
      } as Record<ExpenseCategory, number>
    );
  };

  const handleMarkComplete = (project: RenovationProjectWithAsset) => {
    // If it's a new construction project with target_property_type, show confirmation modal
    if (project.project_type === 'new_construction' && project.target_property_type) {
      // Suggest a new name based on property type
      const suggestedName = project.assets?.name
        ? project.assets.name.replace(/ที่ดิน|Land/gi, propertyTypeLabels[project.target_property_type])
        : `${propertyTypeLabels[project.target_property_type]} - ${project.name}`;
      setCompletionModal({
        project,
        show: true,
        newAssetName: suggestedName,
        updateAssetName: true,
      });
    } else {
      // Just update status to completed
      updateProjectStatus(project.id, 'completed');
    }
  };

  const updateProjectStatus = async (projectId: string, status: RenovationStatus) => {
    const { error } = await supabase
      .from('renovation_projects')
      .update({ status, end_date: status === 'completed' ? new Date().toISOString().split('T')[0] : null })
      .eq('id', projectId);

    if (error) {
      console.error('Error updating project status:', error);
    } else {
      fetchProjects();
    }
  };

  const handleCompleteWithAssetUpdate = async (updateAsset: boolean) => {
    if (!completionModal) return;

    const { project, newAssetName, updateAssetName } = completionModal;

    // Update project status to completed
    const { error: projectError } = await supabase
      .from('renovation_projects')
      .update({ status: 'completed', end_date: new Date().toISOString().split('T')[0] })
      .eq('id', project.id);

    if (projectError) {
      console.error('Error updating project:', projectError);
      setCompletionModal(null);
      return;
    }

    // If user chose to update asset
    if (updateAsset && project.target_property_type) {
      const assetUpdate: {
        property_type: PropertyType;
        status: AssetStatus;
        name?: string;
      } = {
        property_type: project.target_property_type,
        status: 'ready_for_sale', // Mark as ready for sale after renovation/construction completes
      };

      // Include name update if user wants to update it
      if (updateAssetName && newAssetName.trim()) {
        assetUpdate.name = newAssetName.trim();
      }

      const { error: assetError } = await supabase
        .from('assets')
        .update(assetUpdate)
        .eq('id', project.asset_id);

      if (assetError) {
        console.error('Error updating asset:', assetError);
      }
    }

    setCompletionModal(null);
    fetchProjects();
    fetchAssets();
  };

  const filteredProjects = filterType === 'all'
    ? projects
    : projects.filter(p => p.project_type === filterType);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-warm-900 dark:text-warm-50">โปรเจกต์ก่อสร้างและปรับปรุง</h1>
          <p className="text-warm-600 dark:text-warm-400 mt-1">
            จัดการโปรเจกต์สร้างใหม่และปรับปรุง พร้อมติดตามค่าใช้จ่าย
          </p>
        </div>
        <button
          onClick={() => setIsProjectModalOpen(true)}
          className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          สร้างโปรเจกต์ใหม่
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            filterType === 'all'
              ? 'bg-warm-900 text-white dark:bg-white dark:text-warm-900'
              : 'bg-warm-100 text-warm-600 hover:bg-warm-200 dark:bg-warm-800 dark:text-warm-400 dark:hover:bg-warm-700'
          }`}
        >
          ทั้งหมด ({projects.length})
        </button>
        <button
          onClick={() => setFilterType('new_construction')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
            filterType === 'new_construction'
              ? 'bg-green-600 text-white'
              : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
          }`}
        >
          <span>🏗️</span>
          สร้างใหม่ ({projects.filter(p => p.project_type === 'new_construction').length})
        </button>
        <button
          onClick={() => setFilterType('renovation')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
            filterType === 'renovation'
              ? 'bg-primary-500 text-white'
              : 'bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50'
          }`}
        >
          <span>🔧</span>
          ปรับปรุง ({projects.filter(p => p.project_type === 'renovation' || !p.project_type).length})
        </button>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800">
          <div className="p-6 text-center text-warm-500 dark:text-warm-400">
            <p>กำลังโหลด...</p>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800">
          <div className="p-6 text-center text-warm-500 dark:text-warm-400">
            <svg className="w-16 h-16 mx-auto mb-4 text-warm-300 dark:text-warm-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-lg font-medium mb-2">
              {filterType === 'all' ? 'ยังไม่มีโปรเจกต์' : filterType === 'new_construction' ? 'ยังไม่มีโปรเจกต์สร้างใหม่' : 'ยังไม่มีโปรเจกต์ปรับปรุง'}
            </p>
            <p className="text-sm">สร้างโปรเจกต์ใหม่เพื่อเริ่มติดตามงานก่อสร้างและค่าใช้จ่าย</p>
          </div>
        </div>
      ) : filterType === 'all' ? (
        // Grouped view when showing all projects
        <div className="space-y-8">
          {/* New Construction Section */}
          {filteredProjects.filter(p => p.project_type === 'new_construction').length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <span className="text-lg">🏗️</span>
                  <h2 className="text-lg font-semibold text-green-800 dark:text-green-400">
                    โปรเจกต์สร้างใหม่ (New Construction)
                  </h2>
                  <span className="px-2 py-0.5 bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-200 rounded-full text-sm font-medium">
                    {filteredProjects.filter(p => p.project_type === 'new_construction').length}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                {filteredProjects.filter(p => p.project_type === 'new_construction').map(project => {
                  const isExpanded = expandedProject === project.id;
                  const totalExpenses = getTotalExpenses(project.id);
                  const budgetUsedPercent = project.budget > 0 ? (totalExpenses / project.budget) * 100 : 0;
                  const expensesByCategory = getExpensesByCategory(project.id);

                  return (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      isExpanded={isExpanded}
                      totalExpenses={totalExpenses}
                      budgetUsedPercent={budgetUsedPercent}
                      expensesByCategory={expensesByCategory}
                      expenses={expenses}
                      onToggle={() => toggleProject(project.id)}
                      onMarkComplete={() => handleMarkComplete(project)}
                      onStartProgress={() => updateProjectStatus(project.id, 'in_progress')}
                      onAddExpense={() => handleAddExpense(project.id, project.asset_id)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Renovation Section */}
          {filteredProjects.filter(p => p.project_type === 'renovation' || !p.project_type).length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                  <span className="text-lg">🔧</span>
                  <h2 className="text-lg font-semibold text-primary-700 dark:text-primary-400">
                    โปรเจกต์ปรับปรุง (Renovation)
                  </h2>
                  <span className="px-2 py-0.5 bg-primary-200 dark:bg-primary-800 text-primary-900 dark:text-primary-200 rounded-full text-sm font-medium">
                    {filteredProjects.filter(p => p.project_type === 'renovation' || !p.project_type).length}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                {filteredProjects.filter(p => p.project_type === 'renovation' || !p.project_type).map(project => {
                  const isExpanded = expandedProject === project.id;
                  const totalExpenses = getTotalExpenses(project.id);
                  const budgetUsedPercent = project.budget > 0 ? (totalExpenses / project.budget) * 100 : 0;
                  const expensesByCategory = getExpensesByCategory(project.id);

                  return (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      isExpanded={isExpanded}
                      totalExpenses={totalExpenses}
                      budgetUsedPercent={budgetUsedPercent}
                      expensesByCategory={expensesByCategory}
                      expenses={expenses}
                      onToggle={() => toggleProject(project.id)}
                      onMarkComplete={() => handleMarkComplete(project)}
                      onStartProgress={() => updateProjectStatus(project.id, 'in_progress')}
                      onAddExpense={() => handleAddExpense(project.id, project.asset_id)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Filtered view (single type)
        <div className="space-y-4">
          {filteredProjects.map(project => {
            const isExpanded = expandedProject === project.id;
            const totalExpenses = getTotalExpenses(project.id);
            const budgetUsedPercent = project.budget > 0 ? (totalExpenses / project.budget) * 100 : 0;
            const expensesByCategory = getExpensesByCategory(project.id);

            return (
              <ProjectCard
                key={project.id}
                project={project}
                isExpanded={isExpanded}
                totalExpenses={totalExpenses}
                budgetUsedPercent={budgetUsedPercent}
                expensesByCategory={expensesByCategory}
                expenses={expenses}
                onToggle={() => toggleProject(project.id)}
                onMarkComplete={() => handleMarkComplete(project)}
                onStartProgress={() => updateProjectStatus(project.id, 'in_progress')}
                onAddExpense={() => handleAddExpense(project.id, project.asset_id)}
              />
            );
          })}
        </div>
      )}

      {/* Add Project Modal */}
      <AddRenovationProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSuccess={fetchProjects}
        assets={assets}
      />

      {/* Add Expense Modal */}
      {expenseModalProject && (
        <AddExpenseModal
          isOpen={true}
          onClose={() => setExpenseModalProject(null)}
          onSuccess={() => {
            fetchExpenses(expenseModalProject.id);
            setExpenseModalProject(null);
          }}
          renovationProjectId={expenseModalProject.id}
          assetId={expenseModalProject.assetId}
        />
      )}

      {/* Construction Completion Modal */}
      {completionModal?.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-warm-900 rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-warm-200 dark:border-warm-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-50">
                    โปรเจกต์สร้างใหม่เสร็จสิ้น
                  </h2>
                  <p className="text-sm text-warm-500 dark:text-warm-400">
                    {completionModal.project.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Asset Evolution Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">การเปลี่ยนแปลงทรัพย์สิน</h4>
                <div className="flex items-center gap-3 text-sm">
                  <div className="text-center">
                    <p className="text-warm-500 dark:text-warm-400 text-xs mb-1">ประเภทเดิม</p>
                    <span className="px-2 py-1 bg-warm-200 dark:bg-warm-700 rounded text-warm-800 dark:text-warm-200">
                      {propertyTypeLabels[completionModal.project.assets?.property_type || 'land']}
                    </span>
                  </div>
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className="text-center">
                    <p className="text-warm-500 dark:text-warm-400 text-xs mb-1">ประเภทใหม่</p>
                    <span className="px-2 py-1 bg-green-200 dark:bg-green-900/50 rounded text-green-800 dark:text-green-200">
                      {propertyTypeLabels[completionModal.project.target_property_type!]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Change Info */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <h4 className="font-medium text-amber-900 dark:text-amber-300 mb-2">สถานะทรัพย์สิน</h4>
                <div className="flex items-center gap-3 text-sm">
                  <div className="text-center">
                    <p className="text-warm-500 dark:text-warm-400 text-xs mb-1">สถานะเดิม</p>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-800 dark:text-blue-200">
                      กำลังปรับปรุง
                    </span>
                  </div>
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <div className="text-center">
                    <p className="text-warm-500 dark:text-warm-400 text-xs mb-1">สถานะใหม่</p>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded text-green-800 dark:text-green-200">
                      พร้อมใช้งาน
                    </span>
                  </div>
                </div>
              </div>

              {/* Asset Name Update */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-warm-700 dark:text-warm-300">
                    ชื่อทรัพย์สินใหม่
                  </label>
                  <label className="flex items-center gap-2 text-sm text-warm-600 dark:text-warm-400">
                    <input
                      type="checkbox"
                      checked={completionModal.updateAssetName}
                      onChange={(e) => setCompletionModal(prev => prev ? { ...prev, updateAssetName: e.target.checked } : null)}
                      className="rounded border-warm-300 dark:border-warm-600 text-primary-500 focus:ring-primary-500"
                    />
                    อัปเดตชื่อ
                  </label>
                </div>
                <input
                  type="text"
                  value={completionModal.newAssetName}
                  onChange={(e) => setCompletionModal(prev => prev ? { ...prev, newAssetName: e.target.value } : null)}
                  disabled={!completionModal.updateAssetName}
                  className="w-full px-4 py-2 border border-warm-300 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-800 text-warm-900 dark:text-warm-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="ชื่อทรัพย์สินใหม่"
                />
                <p className="mt-1 text-xs text-warm-500 dark:text-warm-400">
                  ชื่อเดิม: {completionModal.project.assets?.name}
                </p>
              </div>

              <div className="bg-warm-50 dark:bg-warm-800 rounded-xl p-4">
                <p className="text-sm text-warm-600 dark:text-warm-400">
                  เมื่อคลิก &quot;อัปเดตทรัพย์สิน&quot; ระบบจะ:
                </p>
                <ul className="mt-2 text-sm text-warm-600 dark:text-warm-400 list-disc list-inside space-y-1">
                  <li>เปลี่ยนประเภททรัพย์สินเป็น <strong className="text-green-600 dark:text-green-400">{propertyTypeLabels[completionModal.project.target_property_type!]}</strong></li>
                  <li>เปลี่ยนสถานะเป็น <strong className="text-green-600 dark:text-green-400">พร้อมใช้งาน (owned)</strong></li>
                  {completionModal.updateAssetName && completionModal.newAssetName.trim() && (
                    <li>เปลี่ยนชื่อเป็น <strong className="text-green-600 dark:text-green-400">{completionModal.newAssetName}</strong></li>
                  )}
                </ul>
              </div>
            </div>

            <div className="p-6 border-t border-warm-200 dark:border-warm-800 flex gap-3">
              <button
                onClick={() => setCompletionModal(null)}
                className="flex-1 px-4 py-2 border border-warm-300 dark:border-warm-700 rounded-xl text-warm-700 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleCompleteWithAssetUpdate(false)}
                className="flex-1 px-4 py-2 bg-warm-200 dark:bg-warm-700 text-warm-800 dark:text-warm-200 rounded-xl hover:bg-warm-300 dark:hover:bg-warm-600 transition-colors"
              >
                เสร็จสิ้นเท่านั้น
              </button>
              <button
                onClick={() => handleCompleteWithAssetUpdate(true)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                อัปเดตทรัพย์สิน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
