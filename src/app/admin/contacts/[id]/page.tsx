"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface Note {
  _id?: string;
  adminId: string;
  adminName: string;
  content: string;
  createdAt: string;
}

interface Reply {
  _id?: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

interface Activity {
  _id?: string;
  type: string;
  actor: string;
  description: string;
  createdAt: string;
}

interface Ticket {
  _id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  isRead: boolean;
  status: "new" | "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: string;
  assignedToName?: string;
  tags: string[];
  notes: Note[];
  replies: Reply[];
  activityLog: Activity[];
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

interface QuickReply {
  id: string;
  title: string;
  content: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params?.id as string;

  // Data states
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [previousTickets, setPreviousTickets] = useState<Ticket[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);

  // Interactive UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [activeTab, setActiveTab] = useState<"reply" | "note">("reply");

  // Form states
  const [messageText, setMessageText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedQuickReplyId, setSelectedQuickReplyId] = useState("");
  const [newTagInput, setNewTagInput] = useState("");
  const [propertyUpdatingField, setPropertyUpdatingField] = useState<
    string | null
  >(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Ticket details
  const fetchTicketDetails = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const token = localStorage.getItem("admin-token");
      const res = await fetch(`/api/admin/contacts/${ticketId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setTicket(json.data.ticket);
          setPreviousTickets(json.data.previousTickets || []);
        } else {
          setIsError(true);
        }
      } else {
        setIsError(true);
      }
    } catch (err) {
      console.error("Ticket detail error:", err);
      setIsError(true);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  // 2. Fetch config / templates
  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem("admin-token");
      const res = await fetch("/api/admin/contacts/config", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setQuickReplies(json.data.quickReplies || []);
        }
      }
    } catch (err) {
      console.error("Config fetch error:", err);
    }
  };

  // 3. Fetch Agents list
  const fetchAgents = async () => {
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

  // Initial loads
  useEffect(() => {
    if (ticketId) {
      fetchTicketDetails();
      fetchConfig();
      fetchAgents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  // Scroll to timeline bottom upon reply loading
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.replies, ticket?.notes, ticket?.activityLog]);

  // Load Template action
  const handleQuickReplyChange = (id: string) => {
    setSelectedQuickReplyId(id);
    if (!id) return;
    const template = quickReplies.find((qr) => qr.id === id);
    if (template && ticket) {
      // Interpolate Client name tag
      const text = template.content.replace(/\{\{name\}\}/g, ticket.name);
      setMessageText(text);
    }
  };

  // Dispatch Email Reply or Private Note submit
  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || isSubmitting || !ticket) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("admin-token");
      const endpoint =
        activeTab === "reply"
          ? `/api/admin/contacts/${ticketId}/reply`
          : `/api/admin/contacts/${ticketId}/notes`;

      const bodyContent =
        activeTab === "reply"
          ? { message: messageText }
          : { content: messageText };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(bodyContent),
      });

      if (res.ok) {
        setMessageText("");
        setSelectedQuickReplyId("");
        // Reload details without screen flashing loader
        await fetchTicketDetails(false);
      } else {
        const json = await res.json();
        alert(`Failed: ${json.error || "Unknown reply error"}`);
      }
    } catch (err) {
      console.error("Reply sending failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Patch Property fields (status, priority, agent)
  const handlePatchProperty = async (
    field: string,
    value: string | string[],
  ) => {
    if (!ticket) return;
    setPropertyUpdatingField(field);

    try {
      const token = localStorage.getItem("admin-token");
      const res = await fetch(`/api/admin/contacts/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (res.ok) {
        await fetchTicketDetails(false);
      } else {
        alert("Failed to update ticket properties.");
      }
    } catch (err) {
      console.error("Patch property failed:", err);
    } finally {
      setPropertyUpdatingField(null);
    }
  };

  // Add Tag
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim() || !ticket) return;
    const tagVal = newTagInput.trim().toLowerCase();
    if (ticket.tags.includes(tagVal)) {
      setNewTagInput("");
      return;
    }

    const updatedTags = [...ticket.tags, tagVal];
    setNewTagInput("");
    await handlePatchProperty("tags", updatedTags);
  };

  // Remove Tag
  const handleRemoveTag = async (tagToRemove: string) => {
    if (!ticket) return;
    const updatedTags = ticket.tags.filter((t) => t !== tagToRemove);
    await handlePatchProperty("tags", updatedTags);
  };

  // Delete Ticket permanent action
  const handleDeleteTicket = async () => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this ticket? This action is irreversible.",
      )
    )
      return;

    try {
      const token = localStorage.getItem("admin-token");
      const res = await fetch(`/api/admin/contacts/${ticketId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        router.push("/admin/contacts");
      } else {
        alert("Failed to delete the ticket.");
      }
    } catch (err) {
      console.error("Delete ticket error:", err);
    }
  };

  // Generate a complete unified sorted timeline stream from inputs: submission, replies, notes, activities
  const getTimelineItems = () => {
    if (!ticket) return [];

    const items: {
      id: string;
      date: Date;
      type: "original" | "reply" | "note" | "activity";
      title?: string;
      content?: string;
      actor?: string;
    }[] = [];

    // 1. Initial Submit item
    items.push({
      id: "original_message",
      date: new Date(ticket.createdAt),
      type: "original",
      title: ticket.name,
      content: ticket.message,
    });

    // 2. Replies items
    ticket.replies.forEach((rep, index) => {
      items.push({
        id: `reply_${index}_${rep.createdAt}`,
        date: new Date(rep.createdAt),
        type: "reply",
        title: rep.senderName,
        content: rep.message,
      });
    });

    // 3. Notes items
    ticket.notes.forEach((nt, index) => {
      items.push({
        id: `note_${index}_${nt.createdAt}`,
        date: new Date(nt.createdAt),
        type: "note",
        title: nt.adminName,
        content: nt.content,
      });
    });

    // 4. Activity entries
    ticket.activityLog.forEach((act, index) => {
      // Skip the default system "received" type as it overlaps with initial submit card
      if (act.type === "received") return;
      items.push({
        id: `activity_${index}_${act.createdAt}`,
        date: new Date(act.createdAt),
        type: "activity",
        actor: act.actor,
        content: act.description,
      });
    });

    // Sort chronologically ascending
    return items.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-4 min-h-[500px]">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">
          progress_activity
        </span>
        <p className="text-slate-400 text-sm font-mono">
          Loading CRM ticket timeline...
        </p>
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="py-20 text-center text-red-500 min-h-[500px] flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-5xl">warning</span>
        <p className="font-bold">Failed to load ticket details.</p>
        <Link
          href="/admin/contacts"
          className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs text-white"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const timelineItems = getTimelineItems();

  return (
    <div className="space-y-6">
      {/* Dynamic Breadcrumbs & Actions Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Link
          href="/admin/contacts"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-base">
            arrow_back
          </span>
          Back to list
        </Link>
        <button
          onClick={handleDeleteTicket}
          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 transition-all font-bold"
        >
          <span className="material-symbols-outlined text-base">delete</span>
          Delete Ticket
        </button>
      </div>

      {/* Grid Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Side: Client profile card */}
        <div className="lg:col-span-1 space-y-6">
          {/* Main profile */}
          <div className="bg-card-dark border border-white/5 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-base font-bold">
                {ticket.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate">
                  {ticket.name}
                </h3>
                <span className="text-[10px] text-slate-500 font-mono block truncate">
                  {ticket.email}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-[11px]">
              <div>
                <span className="text-slate-500 block uppercase text-[9px] font-bold tracking-wider">
                  Submitted Date
                </span>
                <span className="text-slate-300 font-medium font-mono">
                  {new Date(ticket.createdAt).toLocaleString()}
                </span>
              </div>

              {ticket.ip && (
                <div>
                  <span className="text-slate-500 block uppercase text-[9px] font-bold tracking-wider">
                    IP Address
                  </span>
                  <span className="text-slate-300 font-medium font-mono">
                    {ticket.ip}
                  </span>
                </div>
              )}

              {ticket.userAgent && (
                <div className="max-w-[200px]">
                  <span className="text-slate-500 block uppercase text-[9px] font-bold tracking-wider">
                    User Agent
                  </span>
                  <span
                    className="text-slate-400 text-[10px] truncate block"
                    title={ticket.userAgent}
                  >
                    {ticket.userAgent}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Submission history list */}
          <div className="bg-card-dark border border-white/5 rounded-xl p-5 shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">
              <span className="material-symbols-outlined text-base">
                history
              </span>
              Submission History
            </h4>
            {previousTickets.length > 0 ? (
              <div className="space-y-3">
                {previousTickets.map((prev) => (
                  <Link
                    key={prev._id}
                    href={`/admin/contacts/${prev._id}`}
                    className="block p-2 bg-white/2 hover:bg-white/5 rounded-lg border border-white/5 transition-all text-[11px]"
                  >
                    <div className="flex justify-between items-center text-slate-300 font-semibold mb-0.5">
                      <span className="truncate max-w-[100px]">
                        {prev.subject || "(no subject)"}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {new Date(prev.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[10px] truncate">
                      {prev.message}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-[11px] italic">
                No prior submissions found.
              </p>
            )}
          </div>
        </div>

        {/* Center Main: Conversation Stream Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card-dark border border-white/5 rounded-xl p-6 shadow-2xl flex flex-col h-[520px]">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between border-b border-white/5 pb-3">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-slate-400">
                  forum
                </span>
                Conversation Timeline
              </span>
              {ticket.subject && (
                <span
                  className="text-xs text-slate-400 truncate max-w-[200px]"
                  title={ticket.subject}
                >
                  Sub: {ticket.subject}
                </span>
              )}
            </h3>

            {/* Timeline scroll container */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 font-sans min-h-0">
              {timelineItems.map((item) => {
                if (item.type === "original") {
                  return (
                    <div
                      key={item.id}
                      className="flex gap-3 items-start max-w-[85%]"
                    >
                      <div className="size-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 text-sm">
                        <span className="material-symbols-outlined text-base">
                          person
                        </span>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-3 shadow-md">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-xs font-bold text-slate-200">
                            {item.title}
                          </span>
                          <span className="text-[9px] text-slate-500 ml-3 font-mono">
                            {new Date(item.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed white-space-pre-wrap">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  );
                }

                if (item.type === "reply") {
                  return (
                    <div
                      key={item.id}
                      className="flex gap-3 items-start max-w-[85%] ml-auto justify-end"
                    >
                      <div className="bg-primary/5 border border-primary/20 rounded-2xl rounded-tr-none p-3 shadow-md">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-xs font-bold text-primary">
                            {item.title}
                          </span>
                          <span className="text-[9px] text-slate-500 ml-3 font-mono">
                            {new Date(item.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed white-space-pre-wrap">
                          {item.content}
                        </p>
                      </div>
                      <div className="size-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0 text-sm">
                        <span className="material-symbols-outlined text-base">
                          support_agent
                        </span>
                      </div>
                    </div>
                  );
                }

                if (item.type === "note") {
                  return (
                    <div
                      key={item.id}
                      className="flex gap-3 items-start max-w-[85%] mx-auto justify-center w-full"
                    >
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 shadow-md w-full relative">
                        <span className="material-symbols-outlined text-amber-400 absolute top-3 right-3 text-sm">
                          lock
                        </span>
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-xs font-bold text-amber-400">
                            Private Note • {item.title}
                          </span>
                          <span className="text-[9px] text-slate-500 ml-3 font-mono">
                            {new Date(item.date).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed white-space-pre-wrap italic">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  );
                }

                if (item.type === "activity") {
                  return (
                    <div
                      key={item.id}
                      className="text-center py-1 text-[10px] text-slate-500 flex items-center justify-center gap-1.5 max-w-[90%] mx-auto"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                      <span>
                        <strong>{item.actor}</strong> {item.content} •{" "}
                        <span className="font-mono">
                          {new Date(item.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </span>
                    </div>
                  );
                }

                return null;
              })}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Double-Tabbed Reply Composer panel */}
          {ticket.status !== "closed" ? (
            <div className="bg-card-dark border border-white/5 rounded-xl p-5 shadow-2xl space-y-4">
              <div className="flex border-b border-white/5 pb-2">
                <button
                  onClick={() => {
                    setActiveTab("reply");
                    setMessageText("");
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all relative border-b-2 ${
                    activeTab === "reply"
                      ? "text-primary border-primary"
                      : "text-slate-400 border-transparent hover:text-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    mail
                  </span>
                  Reply via Email
                </button>
                <button
                  onClick={() => {
                    setActiveTab("note");
                    setMessageText("");
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all relative border-b-2 ${
                    activeTab === "note"
                      ? "text-amber-400 border-amber-400"
                      : "text-slate-400 border-transparent hover:text-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    lock
                  </span>
                  Private Admin Note
                </button>
              </div>

              {/* Quick Template Selector */}
              {activeTab === "reply" && quickReplies.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 shrink-0">Use Template:</span>
                  <select
                    value={selectedQuickReplyId}
                    onChange={(e) => handleQuickReplyChange(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-primary cursor-pointer text-xs"
                  >
                    <option value="">Choose templates...</option>
                    {quickReplies.map((qr) => (
                      <option key={qr.id} value={qr.id}>
                        {qr.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Message Composer Area */}
              <form onSubmit={handleSubmitResponse} className="space-y-3">
                <textarea
                  placeholder={
                    activeTab === "reply"
                      ? "Type support message to client. Use {{name}} to insert client name dynamically..."
                      : "Write internal note (visible only to support staff)..."
                  }
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={4}
                  required
                  className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-primary text-xs resize-none transition-colors"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || !messageText.trim()}
                    className={`text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                      activeTab === "reply"
                        ? "bg-primary text-black hover:bg-primary/95"
                        : "bg-amber-500 text-black hover:bg-amber-400"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined text-sm animate-spin">
                          progress_activity
                        </span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">
                          {activeTab === "reply" ? "send" : "save"}
                        </span>
                        {activeTab === "reply" ? "Send Reply" : "Post Note"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4 text-center text-xs text-slate-500 italic">
              Ticket is closed. Reopen the ticket to send replies.
            </div>
          )}
        </div>

        {/* Right Side: Quick ticket property manager */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card-dark border border-white/5 rounded-xl p-5 shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">
              <span className="material-symbols-outlined text-base">tune</span>
              Ticket Properties
            </h4>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="text-slate-400 text-[10px] block font-bold mb-1.5 uppercase tracking-wider">
                  Ticket Status
                </label>
                <select
                  value={ticket.status}
                  disabled={propertyUpdatingField === "status"}
                  onChange={(e) =>
                    handlePatchProperty("status", e.target.value)
                  }
                  className="w-full text-xs bg-black/45 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="new">NEW</option>
                  <option value="open">OPEN</option>
                  <option value="in_progress">IN PROGRESS</option>
                  <option value="resolved">RESOLVED</option>
                  <option value="closed">CLOSED</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-slate-400 text-[10px] block font-bold mb-1.5 uppercase tracking-wider">
                  Priority
                </label>
                <select
                  value={ticket.priority}
                  disabled={propertyUpdatingField === "priority"}
                  onChange={(e) =>
                    handlePatchProperty("priority", e.target.value)
                  }
                  className="w-full text-xs bg-black/45 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="low">LOW</option>
                  <option value="medium">MEDIUM</option>
                  <option value="high">HIGH</option>
                  <option value="urgent">URGENT</option>
                </select>
              </div>

              {/* Assigned Agent */}
              <div>
                <label className="text-slate-400 text-[10px] block font-bold mb-1.5 uppercase tracking-wider">
                  Assigned To
                </label>
                <select
                  value={ticket.assignedTo || ""}
                  disabled={propertyUpdatingField === "assignedTo"}
                  onChange={(e) =>
                    handlePatchProperty("assignedTo", e.target.value)
                  }
                  className="w-full text-xs bg-black/45 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.role.replace("_", " ")})
                    </option>
                  ))}
                </select>
              </div>

              {/* Ticket Tags manager */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <label className="text-slate-400 text-[10px] block font-bold uppercase tracking-wider">
                  Ticket Tags
                </label>
                <div className="flex flex-wrap gap-1">
                  {ticket.tags && ticket.tags.length > 0 ? (
                    ticket.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-bold bg-white/5 text-slate-300 border border-white/10 px-2 py-0.5 rounded-full flex items-center gap-1.5"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[10px]">
                            close
                          </span>
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">
                      No labels
                    </span>
                  )}
                </div>

                <form onSubmit={handleAddTag} className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="New tag..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    className="w-full text-[11px] bg-black/45 border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="p-1.5 bg-primary text-black rounded-lg hover:bg-primary/95 text-xs flex items-center justify-center shrink-0 font-bold font-mono"
                  >
                    <span className="material-symbols-outlined text-sm">
                      add
                    </span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
