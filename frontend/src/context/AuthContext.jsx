import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../Services/api';
import { signInWithCustomToken, signOut } from 'firebase/auth';
import { auth } from '../Services/firebase';

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
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);

  // Handle Firebase custom token authentication
  useEffect(() => {
    if (!token) {
      signOut(auth)
        .catch((err) => console.error("Firebase signOut error:", err))
        .finally(() => setIsFirebaseLoading(false));
      return;
    }

    const authenticateFirebase = async () => {
      setIsFirebaseLoading(true);
      try {
        const res = await api.get('/chat/firebase-token');
        const { firebaseToken } = res.data;
        if (firebaseToken) {
          const userCredential = await signInWithCustomToken(auth, firebaseToken);
          console.log("Firebase Auth signed in successfully. User UID:", userCredential.user?.uid);
          console.log("auth.currentUser immediately after sign-in:", auth.currentUser ? auth.currentUser.uid : "null");
        }
      } catch (err) {
        console.error("Failed to authenticate with Firebase custom token:", err);
      } finally {
        setIsFirebaseLoading(false);
      }
    };

    authenticateFirebase();
  }, [token]);

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
    signOut(auth).catch((err) => console.error("Firebase signOut error:", err));
  };

  const updateUser = (newUserData) => {
    setUser((prevUser) => {
      const updated = { ...prevUser, ...newUserData };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser, isFirebaseLoading }}>
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