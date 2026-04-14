// components/PageHeader.tsx
// Reusable green-tint header — same style as Crop Health page
// Usage: <PageHeader icon="🌾" title="Page Title" subtitle="Page subtitle" />

import React from 'react'

interface PageHeaderProps {
  icon: string | React.ReactNode
  title: string
  subtitle?: string
  children?: React.ReactNode // optional right-side content e.g. buttons
}

export default function PageHeader({ icon, title, subtitle, children }: PageHeaderProps) {
  return (
    <div
      className="relative w-full rounded-2xl mb-6 px-6 py-8 flex items-center justify-between overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 60%, #bbf7d0 100%)',
        borderBottom: '1px solid #bbf7d0',
      }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)',
          transform: 'translate(30%, -30%)',
        }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full opacity-10 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #16a34a 0%, transparent 70%)',
          transform: 'translateY(50%)',
        }}
      />

      {/* Left — icon + title */}
      <div className="flex items-center gap-4 relative z-10">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-md flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
        >
          {icon}
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-green-900">{title}</h1>
          {subtitle && (
            <p className="text-green-700/70 text-sm mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right — optional slot */}
      {children && (
        <div className="relative z-10 flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  )
}