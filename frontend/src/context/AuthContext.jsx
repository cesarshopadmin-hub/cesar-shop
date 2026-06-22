import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../Services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null;
  });

  const login = async (identifier, password) => {
    const response = await api.post('/auth/login', { identifier, password });
    const data = response.data; 

    const { token: newToken, ...userData } = data; 

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData); 
    return data;
  };

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    const data = response.data;
    
    const { token: newToken, ...savedUser } = data;
    
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(savedUser));
    setToken(newToken);
    setUser(savedUser);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };
  const updateUser = (newUserData) => {
  setUser((prevUser) => {
    const updated = { ...prevUser, ...newUserData };
    localStorage.setItem('user', JSON.stringify(updated));
    return updated;
  });
};

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};