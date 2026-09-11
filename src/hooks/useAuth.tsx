"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/types";
import { subscribeToAuthProfile, loginWithEmail, logoutUser } from "@/services/authService";
import { User as FirebaseUser } from "firebase/auth";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isFranchise: boolean;
  isDoctor: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  login: async () => {
    throw new Error("AuthContext not initialized");
  },
  logout: async () => {},
  isAdmin: false,
  isFranchise: false,
  isDoctor: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthProfile((profile, fbUser, isLoading) => {
      setUser(profile);
      setFirebaseUser(fbUser);
      setLoading(isLoading);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (email: string, pass: string) => {
    const profile = await loginWithEmail(email, pass);
    setUser(profile);
    return profile;
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setFirebaseUser(null);
  };

  const isAdmin = user?.role === "ADMIN";
  const isFranchise = user?.role === "FRANCHISE";
  const isDoctor = user?.role === "DOCTOR";

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        login: handleLogin,
        logout: handleLogout,
        isAdmin,
        isFranchise,
        isDoctor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
