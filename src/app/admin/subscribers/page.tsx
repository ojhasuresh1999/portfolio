"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// =============================================================================
// Types
// =============================================================================

interface SubscriberData {
  _id: string;
  email: string;
  isActive: boolean;
  subscribedAt: string;
  unsubscribedAt?: string;
}

// =============================================================================
// Page Component
// =============================================================================

export default function AdminSubscribersPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Fetch Subscribers
  const { data: subscribers = [], isLoading } = useQuery<SubscriberData[]>({
    queryKey: ["admin", "subscribers"],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: SubscriberData[];
      }>("/admin/subscribers");
      return response.data.data;
    },
  });

  // Unsubscribe Mutation
  const unsubscribeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/subscribers?id=${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "subscribers"] });
      setToast({
        message: "Subscriber unsubscribed successfully",
        type: "success",
      });
      setTimeout(() => setToast(null), 3000);
    },
    onError: () => {
      setToast({ message: "Failed to unsubscribe user", type: "error" });
      setTimeout(() => setToast(null), 3000);
    },
  });

  // Stats
  const activeCount = subscribers.filter((s) => s.isActive).length;
  const totalCount = subscribers.length;

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-md animate-slide-in ${
            toast.type === "success"
              ? "bg-green-500/15 border-green-500/30 text-green-400"
              : "bg-red-500/15 border-red-500/30 text-red-400"
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Newsletter Subscribers
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage users who have subscribed to your updates.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card-dark border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">
                group
              </span>
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Subscribers</p>
              <h3 className="text-2xl font-bold text-white">{totalCount}</h3>
            </div>
          </div>
        </div>
        <div className="bg-card-dark border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-400 text-2xl">
                mark_email_read
              </span>
            </div>
            <div>
              <p className="text-sm text-slate-400">Active Subscribers</p>
              <h3 className="text-2xl font-bold text-white">{activeCount}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card-dark border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              list_alt
            </span>
            Subscriber List
          </h3>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center opacity-50">
            <span className="material-symbols-outlined text-4xl animate-spin text-white mb-4">
              progress_activity
            </span>
            <p className="text-slate-400">Loading subscribers...</p>
          </div>
        ) : subscribers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center opacity-50">
            <span className="material-symbols-outlined text-5xl text-slate-500 mb-4">
              person_off
            </span>
            <p className="text-slate-400">No subscribers found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 text-sm">
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Subscribed Date</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {subscribers.map((subscriber) => (
                  <tr
                    key={subscriber._id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 text-white text-sm font-medium">
                      {subscriber.email}
                    </td>
                    <td className="px-6 py-4">
                      {subscriber.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                          <span className="size-1.5 rounded-full bg-green-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 text-xs font-medium">
                          <span className="size-1.5 rounded-full bg-slate-500" />
                          Unsubscribed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {new Date(subscriber.subscribedAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {subscriber.isActive && (
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to unsubscribe this user?",
                              )
                            ) {
                              unsubscribeMutation.mutate(subscriber._id);
                            }
                          }}
                          disabled={unsubscribeMutation.isPending}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg transition-colors border border-red-500/20 disabled:opacity-50"
                        >
                          Unsubscribe
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
