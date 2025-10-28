import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // `user` is a boolean indicating authenticated state
  const [user, setUser] = useState(!!localStorage.getItem('accessToken'));
  // store the username so UI (avatar, etc.) can show it
  const [username, setUsername] = useState(localStorage.getItem('username') || '');

  // login accepts token and optional username
  const login = (token, name) => {
    localStorage.setItem('accessToken', token);
    if (name) {
      localStorage.setItem('username', name);
      setUsername(name);
    }
    setUser(true);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    setUser(false);
    setUsername('');
  };

  return (
    <AuthContext.Provider value={{ user, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
