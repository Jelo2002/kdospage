'use client';

import React, { useState } from 'react';

interface SkinAvatarProps {
  ign: string;
  size?: number;
  className?: string;
}

export default function SkinAvatar({ ign, size = 36, className = '' }: SkinAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const cleanIgn = ign?.trim() || 'User';
  const avatarUrl = `https://mc-heads.net/avatar/${encodeURIComponent(cleanIgn)}/${size}`;

  if (hasError || !cleanIgn) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-zinc-800 border border-zinc-700/60 rounded-md flex items-center justify-center font-mono text-[11px] font-semibold text-zinc-300 select-none flex-shrink-0 ${className}`}
      >
        {cleanIgn ? cleanIgn.substring(0, 2).toUpperCase() : 'MC'}
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 flex-shrink-0 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarUrl}
        alt={`${cleanIgn}`}
        width={size}
        height={size}
        className="w-full h-full object-contain image-pixelated"
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </div>
  );
}
