// contexts/RoleContext.tsx
// Stores whether current user is acting as Farmer or Vendor
import React, { createContext, useContext, useState } from 'react';

type Role = 'farmer' | 'vendor' | null;

interface RoleContextType {
  role: Role;
  userId: string;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextType>({
  role: null,
  userId: 'demo_user_001',
  setRole: () => {},
});

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>(null);
  // Fixed demo user ID — same user can be farmer or vendor
  const userId = 'krushi_demo_user_001';

  return (
    <RoleContext.Provider value={{ role, userId, setRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => useContext(RoleContext);