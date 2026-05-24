"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface Ticket {
  _id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  isRead: boolean;
  status: "new" | "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assignedToName?: string;
  tags: string[];
  createdAt: string;
  replies: unknown[];
}

interface Stats {
  total: number;
  newToday: number;
  open: number;
  resolved: number;
  avgResponseTimeHours: number;
  statusDistribution: { name: string; value: number }[];
  priorityDistribution: { name: string; value: number }[];
  timeline: { name: string; value: number }[];
}

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
}

const COLORS = [
  "#00f0ff",
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
];

export default function ContactsDashboard() {
  // Query States
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [assignedTo, setAssignedTo] = useState("all");
  const [tag, setTag] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Metadata Configurations & Lookups
  const [agents, setAgents] = useState<Agent[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [slaTargetHours, setSlaTargetHours] = useState(24);
  const [stats, setStats] = useState<Stats | null>(null);

  // Bulk Actions
  const [bulkAction, setBulkAction] = useState("");
  const [bulkValue, setBulkValue] = useState("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // 1. Debounce Search Input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset page on search
    }, 4000); // 400ms delay

    return () => clearTimeout(handler);
  }, [search]);

  // 2. Fetch Dashboard Statistics
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("admin-token");
      const res = await fetch("/api/admin/contacts/stats", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setStats(json.data);
      }
    } catch (err) {
      console.error("Stats fetching error:", err);
    }
  };

  // 3. Fetch Core CRM Configuration Settings
  const fetchCRMConfig = async () => {
    try {
      const token = localStorage.getItem("admin-token");
      const res = await fetch("/api/admin/contacts/config", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setAvailableTags(json.data.tags || []);
          setSlaTargetHours(json.data.slaHours || 24);
        }
      }
    } catch (err) {
      console.error("CRM config fetch error:", err);
    }
  };

  // 4. Fetch Active Agents List
  const fetchAgentsList = async () => {
    try {
      const token = localStorage.getItem("admin-token");
      const res = await fetch("/api/admin/contacts/agents", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setAgents(json.data);
      }
    } catch (err) {
      console.error("Agents fetch error:", err);
    }
  };

  // 5. Fetch Tickets (Contact Submissions)
  const fetchTickets = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const token = localStorage.getItem("admin-token");
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        sortBy,
        sortOrder,
      });

      if (debouncedSearch) queryParams.append("search", debouncedSearch);
      if (status !== "all") queryParams.append("status", status);
      if (priority !== "all") queryParams.append("priority", priority);
      if (assignedTo !== "all") queryParams.append("assignedTo", assignedTo);
      if (tag !== "all") queryParams.append("tag", tag);

      const res = await fetch(`/api/admin/contacts?${queryParams.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setTickets(json.data.items);
          setTotalTickets(json.data.total);
          setTotalPages(json.data.pages);
        } else {
          setIsError(true);
        }
      } else {
        setIsError(true);
      }
    } catch (err) {
      console.error("Tickets load error:", err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Load everything on startup
  useEffect(() => {
    fetchStats();
    fetchCRMConfig();
    fetchAgentsList();
  }, []);

  // Reload tickets when filter states change
  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    debouncedSearch,
    status,
    priority,
    assignedTo,
    tag,
    sortBy,
    sortOrder,
  ]);

  // Handle Sort triggers
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  // Checkbox select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(tickets.map((t) => t._id));
    } else {
      setSelectedIds([]);
    }
  };

  // Checkbox select single
  const handleSelectSingle = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    }
  };

  // Bulk operation execute
  const handleBulkActionExecute = async () => {
    if (!bulkAction || selectedIds.length === 0) return;
    setIsBulkUpdating(true);

    try {
      const token = localStorage.getItem("admin-token");

      // Custom file download logic for CSV Export action
      if (bulkAction === "export_csv") {
        const res = await fetch("/api/admin/contacts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            action: bulkAction,
            ids: selectedIds,
          }),
        });

        if (res.ok) {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `CRM_Contacts_Export_${new Date().toISOString().split("T")[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        } else {
          alert("Failed to export CSV file.");
        }
      } else {
        const res = await fetch("/api/admin/contacts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            action: bulkAction,
            ids: selectedIds,
            value: bulkValue,
          }),
        });

        if (res.ok) {
          setSelectedIds([]);
          setBulkAction("");
          setBulkValue("");
          fetchTickets();
          fetchStats();
        } else {
          alert("Failed to update selected tickets.");
        }
      }
    } catch (err) {
      console.error("Bulk action failed:", err);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Reset Filters helper
  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
    setPriority("all");
    setAssignedTo("all");
    setTag("all");
    setSortBy("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  // Check if a ticket has breached its SLA
  const isSlaBreached = (ticket: Ticket) => {
    if (ticket.status === "resolved" || ticket.status === "closed")
      return false;
    if (ticket.replies && ticket.replies.length > 0) return false;

    const limitMs = slaTargetHours * 60 * 60 * 1000;
    const elapsedMs =
      new Date().getTime() - new Date(ticket.createdAt).getTime();
    return elapsedMs > limitMs;
  };

  return (
    <div className="space-y-8">
      {/* Page Heading Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-slate-400 text-sm">
            Monitor, assign, resolve, and reply to client inquiries.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/contacts/settings"
            className="flex items-center gap-2 px-4 py-2 border border-white/10 hover:border-primary/20 hover:bg-white/5 rounded-xl text-slate-200 hover:text-white transition-all text-sm font-semibold"
          >
            <span className="material-symbols-outlined text-lg">settings</span>
            CRM Settings
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              label: "Total Submissions",
              value: stats.total,
              icon: "contact_mail",
              color: "text-blue-400",
              border: "border-blue-500/10",
              bg: "bg-blue-500/5",
            },
            {
              label: "New Today",
              value: stats.newToday,
              icon: "mark_email_unread",
              color: "text-red-400",
              border: "border-red-500/10",
              bg: "bg-red-500/5",
            },
            {
              label: "Open Tickets",
              value: stats.open,
              icon: "feedback",
              color: "text-amber-400",
              border: "border-amber-500/10",
              bg: "bg-amber-500/5",
            },
            {
              label: "Resolved",
              value: stats.resolved,
              icon: "task_alt",
              color: "text-green-400",
              border: "border-green-500/10",
              bg: "bg-green-500/5",
            },
            {
              label: "Avg. Response Time",
              value: `${stats.avgResponseTimeHours} hrs`,
              icon: "schedule",
              color: "text-purple-400",
              border: "border-purple-500/10",
              bg: "bg-purple-500/5",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`border rounded-xl p-4 bg-card-dark ${card.border} ${card.bg} backdrop-blur-md shadow-lg flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">
                  {card.label}
                </span>
                <span
                  className={`material-symbols-outlined text-lg ${card.color}`}
                >
                  {card.icon}
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mt-4">
                {card.value}
              </h3>
            </div>
          ))}
        </div>
      )}

      {/* Advanced Filters */}
      <div className="bg-card-dark border border-white/5 rounded-xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400">
            filter_alt
          </span>
          Filters & Search
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Debounced Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search submitter name, email, keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-black/30 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors"
            />
            <span className="material-symbols-outlined text-lg absolute left-3 top-2.5 text-slate-500">
              search
            </span>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-primary transition-colors cursor-pointer appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="new">New / Unread</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Priority filter */}
          <div>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-primary transition-colors cursor-pointer appearance-none"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent Priority</option>
            </select>
          </div>

          {/* Assignment filter */}
          <div>
            <select
              value={assignedTo}
              onChange={(e) => {
                setAssignedTo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-primary transition-colors cursor-pointer appearance-none"
            >
              <option value="all">All Agents</option>
              <option value="unassigned">Unassigned Only</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags filter */}
          <div>
            <select
              value={tag}
              onChange={(e) => {
                setTag(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-primary transition-colors cursor-pointer appearance-none"
            >
              <option value="all">All Tags</option>
              {availableTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-white/5 text-xs">
          <span className="text-slate-400 font-medium">
            Found{" "}
            <strong className="text-white font-bold">{totalTickets}</strong>{" "}
            submissions
          </span>
          <button
            onClick={handleClearFilters}
            className="text-primary font-bold hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">
              clear_all
            </span>
            Reset Filters
          </button>
        </div>
      </div>

      {/* Bulk Action Controls */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card-dark border border-primary/20 rounded-xl p-4 bg-primary/5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl z-20"
          >
            <div className="flex items-center gap-3">
              <span className="size-5 rounded bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                {selectedIds.length}
              </span>
              <span className="text-xs text-slate-200 font-semibold">
                submissions selected for bulk action
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={bulkAction}
                onChange={(e) => {
                  setBulkAction(e.target.value);
                  setBulkValue("");
                }}
                className="text-xs bg-black border border-white/15 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary cursor-pointer w-full md:w-40"
              >
                <option value="">Choose action...</option>
                <option value="mark_read">Mark as Read</option>
                <option value="mark_unread">Mark as Unread</option>
                <option value="change_status">Change Status</option>
                <option value="change_priority">Change Priority</option>
                <option value="assign">Assign Agent</option>
                <option value="export_csv">Export CSV</option>
                <option value="delete">Delete Permanently</option>
              </select>

              {/* Dynamic Value Selector based on action choice */}
              {bulkAction === "change_status" && (
                <select
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  className="text-xs bg-black border border-white/15 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">Choose status...</option>
                  <option value="new">New</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              )}

              {bulkAction === "change_priority" && (
                <select
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  className="text-xs bg-black border border-white/15 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">Choose priority...</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              )}

              {bulkAction === "assign" && (
                <select
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  className="text-xs bg-black border border-white/15 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">Choose agent...</option>
                  <option value="">Unassigned</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={handleBulkActionExecute}
                disabled={
                  isBulkUpdating ||
                  !bulkAction ||
                  (bulkAction !== "delete" &&
                    bulkAction !== "mark_read" &&
                    bulkAction !== "mark_unread" &&
                    bulkAction !== "export_csv" &&
                    !bulkValue)
                }
                className="text-xs font-bold bg-primary text-black px-4 py-2 rounded-lg hover:bg-primary/95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-mono w-full md:w-auto justify-center"
              >
                {isBulkUpdating ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                    Updating...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">
                      play_arrow
                    </span>
                    Apply
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Tickets Data Table */}
      <div className="bg-card-dark border border-white/5 rounded-xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
              <span className="material-symbols-outlined text-4xl text-primary animate-spin">
                progress_activity
              </span>
              <p className="text-slate-400 text-sm">
                Querying CRM tickets database...
              </p>
            </div>
          ) : isError ? (
            <div className="py-20 text-center text-red-500">
              <span className="material-symbols-outlined text-4xl mb-2">
                error
              </span>
              <p>Failed to query submissions from server.</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <span className="material-symbols-outlined text-4xl mb-2">
                inbox
              </span>
              <p className="text-sm">
                No contact submissions match the filter queries.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-black/20">
                  <th className="px-6 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={
                        tickets.length > 0 &&
                        selectedIds.length === tickets.length
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="size-4 bg-transparent border border-white/20 rounded focus:ring-0 text-primary cursor-pointer"
                    />
                  </th>
                  <th
                    onClick={() => handleSort("name")}
                    className="px-6 py-4 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Submitter
                      {sortBy === "name" && (
                        <span className="material-symbols-outlined text-xs">
                          {sortOrder === "asc"
                            ? "arrow_upward"
                            : "arrow_downward"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4">Subject & Excerpt</th>
                  <th
                    onClick={() => handleSort("createdAt")}
                    className="px-6 py-4 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Submitted
                      {sortBy === "createdAt" && (
                        <span className="material-symbols-outlined text-xs">
                          {sortOrder === "asc"
                            ? "arrow_upward"
                            : "arrow_downward"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="px-6 py-4 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Status
                      {sortBy === "status" && (
                        <span className="material-symbols-outlined text-xs">
                          {sortOrder === "asc"
                            ? "arrow_upward"
                            : "arrow_downward"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("priority")}
                    className="px-6 py-4 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Priority
                      {sortBy === "priority" && (
                        <span className="material-symbols-outlined text-xs">
                          {sortOrder === "asc"
                            ? "arrow_upward"
                            : "arrow_downward"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4">Assigned Agent</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {tickets.map((t) => {
                  const hasBreached = isSlaBreached(t);
                  return (
                    <tr
                      key={t._id}
                      className={`hover:bg-white/5 transition-colors group ${!t.isRead ? "bg-primary/2 font-medium" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(t._id)}
                          onChange={(e) =>
                            handleSelectSingle(t._id, e.target.checked)
                          }
                          className="size-4 bg-transparent border border-white/20 rounded focus:ring-0 text-primary cursor-pointer"
                        />
                      </td>

                      {/* Submitter */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {t.name}
                            {!t.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {t.email}
                          </span>
                        </div>
                      </td>

                      {/* Subject Excerpt */}
                      <td className="px-6 py-4 max-w-xs">
                        <div className="truncate text-slate-200">
                          {t.subject || "(no subject)"}
                        </div>
                        <div className="truncate text-slate-400 text-[10px] mt-0.5">
                          {t.message}
                        </div>
                        {/* Render Tags */}
                        {t.tags && t.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5">
                            {t.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] font-bold bg-white/5 text-slate-400 border border-white/10 px-1.5 py-0.5 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Submitted Time & SLA overdue indicator */}
                      <td className="px-6 py-4">
                        <div className="text-slate-300 font-medium">
                          {new Date(t.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          {new Date(t.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>

                        {/* Overdue SLA pill */}
                        {hasBreached && (
                          <span className="mt-1 flex items-center gap-1 text-[9px] font-black bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded w-max animate-pulse">
                            <span className="material-symbols-outlined text-xs">
                              warning
                            </span>
                            SLA BREACH
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            t.status === "new"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : t.status === "open"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : t.status === "in_progress"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : t.status === "resolved"
                                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                                    : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              t.status === "new"
                                ? "bg-red-500 animate-pulse"
                                : t.status === "open"
                                  ? "bg-blue-500"
                                  : t.status === "in_progress"
                                    ? "bg-amber-500"
                                    : t.status === "resolved"
                                      ? "bg-green-500"
                                      : "bg-slate-500"
                            }`}
                          />
                          {t.status?.replace("_", " ")?.toUpperCase()}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                            t?.priority === "urgent"
                              ? "bg-red-500/15 text-red-300 border-red-500/30"
                              : t.priority === "high"
                                ? "bg-orange-500/15 text-orange-300 border-orange-500/30"
                                : t.priority === "medium"
                                  ? "bg-yellow-500/15 text-yellow-300 border-yellow-500/30"
                                  : "bg-slate-500/15 text-slate-300 border-slate-500/30"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[10px]">
                            {t?.priority === "urgent"
                              ? "error"
                              : t.priority === "high"
                                ? "priority_high"
                                : "expand_less"}
                          </span>
                          {t.priority?.toUpperCase()}
                        </span>
                      </td>

                      {/* Assigned Agent */}
                      <td className="px-6 py-4 text-slate-300">
                        {t.assignedToName ? (
                          <div className="flex items-center gap-1.5">
                            <span className="size-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-[9px] font-bold">
                              {t.assignedToName.charAt(0).toUpperCase()}
                            </span>
                            <span className="font-semibold text-[11px]">
                              {t.assignedToName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* View ticket details */}
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/contacts/${t._id}`}
                          className="inline-flex items-center justify-center p-1.5 bg-white/5 hover:bg-primary/20 hover:text-primary rounded-lg border border-white/5 hover:border-primary/20 transition-all"
                        >
                          <span className="material-symbols-outlined text-lg">
                            arrow_forward
                          </span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {tickets.length > 0 && !isLoading && (
          <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Showing page{" "}
              <strong className="text-white font-bold">{currentPage}</strong> of{" "}
              <strong className="text-white font-bold">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="p-1.5 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <span className="material-symbols-outlined text-base">
                  chevron_left
                </span>
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="p-1.5 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <span className="material-symbols-outlined text-base">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Visualization Section */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timeline Submission Volume AreaChart */}
          <div className="lg:col-span-2 bg-card-dark border border-white/5 rounded-xl p-6 shadow-xl flex flex-col h-[320px]">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                analytics
              </span>
              Submission Volume (Last 30 Days)
            </h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats.timeline}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(tick) => tick.substring(8, 10)} // Show only day index
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "11px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#00f0ff"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ticket status distribution PieChart */}
          <div className="bg-card-dark border border-white/5 rounded-xl p-6 shadow-xl flex flex-col h-[320px]">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">
                donut_large
              </span>
              Breakdown by Status
            </h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stats.statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-3">
              {stats.statusDistribution.map((entry, index) => (
                <div
                  key={entry.name}
                  className="flex items-center gap-1.5 text-[10px] text-slate-400"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>
                    {entry.name} ({entry.value})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
