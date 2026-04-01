import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('cyclos_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [userProfile, setUserProfile] = useState(() => {
    const stored = localStorage.getItem('cyclos_profile');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (userData, clearProfile = false) => {
    const u = { ...userData, id: Date.now() };
    setUser(u);
    localStorage.setItem('cyclos_user', JSON.stringify(u));
    
    if (clearProfile) {
      setUserProfile(null);
      localStorage.removeItem('cyclos_profile');
    }
  };

  const logout = () => {
    setUser(null);
    setUserProfile(null);
    localStorage.removeItem('cyclos_user');
    localStorage.removeItem('cyclos_profile');
  };

  const updateProfile = (profile) => {
    const p = { ...userProfile, ...profile };
    setUserProfile(p);
    localStorage.setItem('cyclos_profile', JSON.stringify(p));
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
