import React from 'react';

export interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    onClick?: () => void;
}

export function Card({
    children,
    className = '',
    padding = 'md',
    hover = false,
    onClick,
}: CardProps) {
    const paddingClasses = {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
    };

    const hoverClass = hover ? 'hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer' : '';
    const clickableClass = onClick ? 'cursor-pointer' : '';

    return (
        <div
            className={`
        bg-white dark:bg-warm-900 
        rounded-2xl 
        shadow-sm 
        border border-warm-200 dark:border-warm-800
        ${paddingClasses[padding]}
        ${hoverClass}
        ${clickableClass}
        ${className}
      `}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

export interface CardHeaderProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    className?: string;
}

export function CardHeader({ title, subtitle, action, className = '' }: CardHeaderProps) {
    return (
        <div className={`flex items-start justify-between mb-4 ${className}`}>
            <div>
                <h3 className="text-lg font-semibold text-warm-900 dark:text-warm-50">
                    {title}
                </h3>
                {subtitle && (
                    <p className="text-sm text-warm-600 dark:text-warm-400 mt-1">
                        {subtitle}
                    </p>
                )}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}

export interface CardContentProps {
    children: React.ReactNode;
    className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
    return (
        <div className={className}>
            {children}
        </div>
    );
}

export interface CardFooterProps {
    children: React.ReactNode;
    className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
    return (
        <div className={`mt-4 pt-4 border-t border-warm-200 dark:border-warm-800 ${className}`}>
            {children}
        </div>
    );
}
