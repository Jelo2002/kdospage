'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ActiveRole, AuthUser } from '@/lib/types';

interface RoleContextType {
  role: ActiveRole;
  setRole: (role: ActiveRole) => void;
  staffName: string;
  setStaffName: (name: string) => void;
  isOwnerOrDev: boolean; // True for Owner, Developer, Admin
  isAdmin: boolean;
  isStaff: boolean;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  loginSession: (user: AuthUser, remember?: boolean) => void;
  logout: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<ActiveRole>('Staff/Interviewer');
  const [staffName, setStaffNameState] = useState<string>('');
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  // Load cached authentication on initial mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem('kdos_auth_session');
      if (cached) {
        const parsed = JSON.parse(cached) as AuthUser;
        if (parsed && parsed.ign && parsed.role) {
          setUserState(parsed);
          setRoleState(parsed.role);
          setStaffNameState(parsed.ign);
          setIsAuthenticated(true);
        }
      }
    } catch (err) {
      console.warn('Error reading cached auth session:', err);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const loginSession = (authUser: AuthUser, remember: boolean = true) => {
    const sessionData: AuthUser = {
      ...authUser,
      loginTime: new Date().toISOString(),
      remember,
    };

    setUserState(sessionData);
    setRoleState(sessionData.role);
    setStaffNameState(sessionData.ign);
    setIsAuthenticated(true);

    if (remember) {
      localStorage.setItem('kdos_auth_session', JSON.stringify(sessionData));
    } else {
      sessionStorage.setItem('kdos_auth_session', JSON.stringify(sessionData));
    }
  };

  const logout = () => {
    setUserState(null);
    setIsAuthenticated(false);
    localStorage.removeItem('kdos_auth_session');
    sessionStorage.removeItem('kdos_auth_session');
  };

  const setRole = (newRole: ActiveRole) => {
    setRoleState(newRole);
    if (user) {
      const updatedUser = { ...user, role: newRole };
      setUserState(updatedUser);
      localStorage.setItem('kdos_auth_session', JSON.stringify(updatedUser));
    }
  };

  const setStaffName = (name: string) => {
    setStaffNameState(name);
    if (user) {
      const updatedUser = { ...user, ign: name };
      setUserState(updatedUser);
      localStorage.setItem('kdos_auth_session', JSON.stringify(updatedUser));
    }
  };

  const isOwnerOrDev = role === 'Owner' || role === 'Developer' || role === 'Admin';
  const isAdmin = role === 'Admin';
  const isStaff = role === 'Staff/Interviewer';

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        staffName,
        setStaffName,
        isOwnerOrDev,
        isAdmin,
        isStaff,
        isAuthenticated,
        isLoadingAuth,
        user,
        setUser: setUserState,
        loginSession,
        logout,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
