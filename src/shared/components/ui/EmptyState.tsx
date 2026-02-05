import React from 'react';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="bg-white dark:bg-warm-900 rounded-2xl shadow-sm border border-warm-200 dark:border-warm-800">
            <div className="p-8 text-center">
                {icon && <div className="text-4xl mb-4">{icon}</div>}
                <p className="text-warm-500 dark:text-warm-400 text-lg font-medium">
                    {title}
                </p>
                {description && (
                    <p className="text-sm text-warm-400 dark:text-warm-500 mt-1">
                        {description}
                    </p>
                )}
                {action && <div className="mt-4">{action}</div>}
            </div>
        </div>
    );
}
