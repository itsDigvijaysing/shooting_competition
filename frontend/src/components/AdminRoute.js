// src/components/AdminRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === 'admin';
  
  if (!isAdmin) {
    // Redirect non-admin users to home page
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default AdminRoute;