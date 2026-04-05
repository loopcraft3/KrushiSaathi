// pages/RoleSelector.tsx
// Shown when user visits /rental — asks if they are farmer or vendor
import React from 'react';
import { useRole } from '@/contexts/RoleContext';
import { Tractor, Store } from 'lucide-react';

const RoleSelector: React.FC = () => {
  const { setRole } = useRole();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-foreground mb-2">Equipment Rental</h1>
        <p className="text-muted-foreground text-lg">How would you like to continue today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Farmer Card */}
        <button
          onClick={() => setRole('farmer')}
          className="group p-8 rounded-2xl border-2 border-border hover:border-primary bg-card hover:bg-primary/5 transition-all duration-300 hover:shadow-xl text-left"
        >
          <div className="h-16 w-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Tractor className="h-9 w-9 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">I am a Farmer</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Browse available equipment, book by the hour, view your bookings and history
          </p>
          <div className="mt-4 text-primary font-semibold text-sm group-hover:translate-x-1 transition-transform duration-200">
            Browse Equipment →
          </div>
        </button>

        {/* Vendor Card */}
        <button
          onClick={() => setRole('vendor')}
          className="group p-8 rounded-2xl border-2 border-border hover:border-primary bg-card hover:bg-primary/5 transition-all duration-300 hover:shadow-xl text-left"
        >
          <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Store className="h-9 w-9 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">I am a Vendor</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            List your equipment for rent, manage listings, and track all bookings
          </p>
          <div className="mt-4 text-primary font-semibold text-sm group-hover:translate-x-1 transition-transform duration-200">
            Manage Equipment →
          </div>
        </button>
      </div>
    </div>
  );
};

export default RoleSelector;