/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div 
      className={cn(
        "animate-pulse bg-brand-ink/5 rounded-md",
        className
      )} 
    />
  );
};

export const ProductSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-full space-y-4">
      <Skeleton className="aspect-square rounded-2xl w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/4" />
        <div className="flex gap-1">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <Skeleton className="h-5 w-1/3 mt-2" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl md:hidden" />
    </div>
  );
};
