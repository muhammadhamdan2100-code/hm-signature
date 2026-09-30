import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, isStaffRole } from "../context/AuthContext";

export const StaffRouteGuard: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isStaffRole(user.role)) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export const CustomerRouteGuard: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    const nextPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${nextPath}`} replace />;
  }

  return <Outlet />;
};

export const PublicOnlyRouteGuard: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    if (isStaffRole(user.role)) {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/account" replace />;
    }
  }

  return <Outlet />;
};
