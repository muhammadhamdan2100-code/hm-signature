import React, { useState } from "react";
import { useAdminData, type Customer } from "../context/AdminDataContext";
import { DataTable, type Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Eye, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CustomersList: React.FC = () => {
  const { customers } = useAdminData();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState("all");

  const filteredCustomers = customers.filter((c) => {
    if (statusFilter === "all") return true;
    return c.status === statusFilter;
  });

  const columns: Column<Customer>[] = [
    {
      header: "Client Name",
      accessor: (c) => (
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-gold/15 border border-gold flex items-center justify-center text-gold font-serif font-bold text-sm shrink-0">
            {c.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-ivory flex items-center space-x-1.5">
              <span>{c.name}</span>
              {c.status === "VIP" && <Crown className="w-3.5 h-3.5 text-gold" />}
            </h4>
            <span className="text-[10px] text-muted font-mono">{c.phone}</span>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Email Address",
      accessor: (c) => <span className="text-xs font-mono text-gold">{c.email}</span>,
      sortable: true,
    },
    {
      header: "Orders",
      accessor: (c) => (
        <span className="text-xs font-mono text-ivory font-semibold">
          {c.ordersCount} Orders
        </span>
      ),
      sortable: true,
    },
    {
      header: "Lifetime Spend",
      accessor: (c) => (
        <span className="text-xs font-mono font-bold text-gold">
          Rs. {c.totalSpent.toLocaleString()}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Status",
      accessor: (c) => <StatusBadge status={c.status} />,
      sortable: true,
    },
    {
      header: "Last Order",
      accessor: (c) => <span className="text-xs text-muted font-mono">{c.lastOrderDate}</span>,
      sortable: true,
    },
    {
      header: "Action",
      accessor: (c) => (
        <div className="flex items-center justify-end">
          <button
            onClick={() => navigate(`/admin/customers/${c.id}`)}
            className="px-3 py-1.5 rounded bg-navy border border-gold/30 hover:border-gold text-gold hover:text-ivory text-xs font-sans transition-colors flex items-center space-x-1"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            CLIENT RELATIONS & VIP CIRCLE
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            Registered Clients & VIP Patronage
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            Inspect client lifetime value, order history, saved shipping addresses, and VIP tier statuses.
          </p>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredCustomers}
        keyExtractor={(c) => c.id}
        searchPlaceholder="Search customer name, email, phone..."
        emptyMessage="No clients found"
        filterControls={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-navy border border-gold/20 rounded px-3 py-1.5 text-xs text-ivory focus:outline-none focus:border-gold"
          >
            <option value="all">All Tiers</option>
            <option value="VIP">VIP Tier Only</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive</option>
            <option value="Blocked">Blocked</option>
          </select>
        }
      />
    </div>
  );
};
