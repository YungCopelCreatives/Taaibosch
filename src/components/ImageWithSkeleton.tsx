/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Skeleton } from './Skeleton';

export interface ImageWithSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
}

export const ImageWithSkeleton: React.FC<ImageWithSkeletonProps> = ({
  src,
  alt,
  className,
  wrapperClassName,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${wrapperClassName || 'w-full h-full'}`}>
      {/* Dynamic Network Skeleton */}
      {!isLoaded && !hasError && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-[inherit] z-10 animate-pulse bg-brand-ink/5" />
      )}
      
      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        className={`object-cover transition-all duration-500 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${className || ''}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        loading="lazy"
        referrerPolicy="no-referrer"
        {...props}
      />

      {/* Fallback pattern in case image fails to fetch */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-brand-grey text-brand-ink/20">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );
};
