import { createContext, useState, useEffect } from "react";
import api from "../services/api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);

      const res = await api.post("/auth/login", { email, password });

      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));

    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      throw err;
    }
  };

  const register = async (name, email, password) => {
    try {
      setError(null);

      const res = await api.post("/auth/register", {
        name,
        email,
        password
      });

      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));

    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};