'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Asset, RenovationProjectWithAsset, Expense, RenovationStatus, ExpenseCategory } from '@/types/database';
import AddRenovationProjectModal from '@/components/AddRenovationProjectModal';
import AddExpenseModal from '@/components/AddExpenseModal';

const statusLabels: Record<RenovationStatus, { label: string; color: string }> = {
  planned: { label: 'วางแผน', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
  in_progress: { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  completed: { label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: 'ยกเลิก', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

const categoryLabels: Record<ExpenseCategory, { label: string; color: string }> = {
  materials: { label: 'ค่าวัสดุ', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  labor: { label: 'ค่าแรง', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  service: { label: 'ค่าบริการช่าง', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  electricity: { label: 'ค่าไฟฟ้า', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
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

export default function RenovationsPage() {
  const [projects, setProjects] = useState<RenovationProjectWithAsset[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [expenses, setExpenses] = useState<Record<string, Expense[]>>({});
  const [loading, setLoading] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [expenseModalProject, setExpenseModalProject] = useState<{ id: string; assetId: string } | null>(null);

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
      { materials: 0, labor: 0, service: 0, electricity: 0 } as Record<ExpenseCategory, number>
    );
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">โปรเจกต์ปรับปรุง</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            จัดการโปรเจกต์ปรับปรุงและติดตามค่าใช้จ่าย
          </p>
        </div>
        <button
          onClick={() => setIsProjectModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          สร้างโปรเจกต์ใหม่
        </button>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p>กำลังโหลด...</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-lg font-medium mb-2">ยังไม่มีโปรเจกต์ปรับปรุง</p>
            <p className="text-sm">สร้างโปรเจกต์ใหม่เพื่อเริ่มติดตามงานปรับปรุงและค่าใช้จ่าย</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map(project => {
            const isExpanded = expandedProject === project.id;
            const totalExpenses = getTotalExpenses(project.id);
            const budgetUsedPercent = project.budget > 0 ? (totalExpenses / project.budget) * 100 : 0;
            const expensesByCategory = getExpensesByCategory(project.id);

            return (
              <div
                key={project.id}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden"
              >
                {/* Project Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  onClick={() => toggleProject(project.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {project.name}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusLabels[project.status].color}`}>
                          {statusLabels[project.status].label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {project.assets?.name} ({project.assets?.title_deed_number})
                      </p>
                      {project.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">งบประมาณ</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(project.budget)}
                        </p>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
                      <span className="text-gray-500 dark:text-gray-400">ใช้ไปแล้ว</span>
                      <span className={`font-medium ${budgetUsedPercent > 100 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                        {formatCurrency(totalExpenses)} ({budgetUsedPercent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
                  <div className="mt-3 flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>เริ่ม: {formatDate(project.start_date)}</span>
                    {project.end_date && <span>สิ้นสุด: {formatDate(project.end_date)}</span>}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-800">
                    {/* Category Summary */}
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        สรุปค่าใช้จ่ายตามหมวดหมู่
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(Object.entries(categoryLabels) as [ExpenseCategory, { label: string; color: string }][]).map(
                          ([key, { label, color }]) => (
                            <div
                              key={key}
                              className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                            >
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color} mb-2`}>
                                {label}
                              </span>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(expensesByCategory[key] || 0)}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Expenses List */}
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          รายการค่าใช้จ่าย
                        </h4>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleAddExpense(project.id, project.asset_id);
                          }}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          เพิ่มค่าใช้จ่าย
                        </button>
                      </div>

                      {!expenses[project.id] ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">กำลังโหลด...</p>
                      ) : expenses[project.id].length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                          </svg>
                          <p>ยังไม่มีรายการค่าใช้จ่าย</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <th className="pb-3">วันที่</th>
                                <th className="pb-3">หมวดหมู่</th>
                                <th className="pb-3">รายละเอียด</th>
                                <th className="pb-3">ร้านค้า/ผู้รับเหมา</th>
                                <th className="pb-3 text-right">จำนวนเงิน</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {expenses[project.id].map(expense => (
                                <tr key={expense.id} className="text-sm">
                                  <td className="py-3 text-gray-600 dark:text-gray-400">
                                    {formatDate(expense.date)}
                                  </td>
                                  <td className="py-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryLabels[expense.category as ExpenseCategory]?.color || 'bg-gray-100 text-gray-800'}`}>
                                      {categoryLabels[expense.category as ExpenseCategory]?.label || expense.category}
                                    </span>
                                  </td>
                                  <td className="py-3 text-gray-900 dark:text-white">
                                    {expense.description || '-'}
                                  </td>
                                  <td className="py-3 text-gray-600 dark:text-gray-400">
                                    {expense.vendor || '-'}
                                  </td>
                                  <td className="py-3 text-right font-medium text-gray-900 dark:text-white">
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
    </div>
  );
}
