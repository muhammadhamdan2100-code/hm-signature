import React from "react";
import { Navigate } from "react-router-dom";

export const AdminLogin: React.FC = () => {
  return <Navigate to="/login?next=/admin" replace />;
};
