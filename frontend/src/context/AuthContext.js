import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(localStorage.getItem('accessToken') ? true : false);

  const login = (token) => {
    localStorage.setItem('accessToken', token);
    setUser(true);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
