"use client";

import Link from "next/link";

const TEMPLATE_CATEGORIES = [
  {
    title: "Contact Form",
    templates: [
      {
        type: "contact_auto_reply",
        name: "Auto-Reply (User)",
        desc: "Sent to the user when they submit a contact form.",
      },
      {
        type: "contact_admin_notice",
        name: "Admin Notice",
        desc: "Sent to you when a new contact form is submitted.",
      },
    ],
  },
  {
    title: "Chat & Presence",
    templates: [
      {
        type: "chat_offline_user_notice",
        name: "Offline Notice (User)",
        desc: "Sent to users who chat while you are marked as 'Offline'.",
      },
      {
        type: "chat_admin_notice",
        name: "Admin Notice",
        desc: "Sent to you when a new chat message arrives.",
      },
    ],
  },
  {
    title: "Newsletter & Blog",
    templates: [
      {
        type: "subscribe_user_welcome",
        name: "Welcome Email (User)",
        desc: "Sent to users when they subscribe to your blog.",
      },
      {
        type: "subscribe_admin_notice",
        name: "Admin Notice",
        desc: "Sent to you when a new user subscribes.",
      },
      {
        type: "blog_newsletter",
        name: "Blog Newsletter",
        desc: "Sent to subscribers when a new post is published.",
      },
    ],
  },
];

export default function EmailTemplatesDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Email Templates</h2>
        <p className="text-slate-400 text-sm mt-1">
          Manage automated emails sent to users and administrative
          notifications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {TEMPLATE_CATEGORIES.map((category) => (
          <div
            key={category.title}
            className="bg-card-dark border border-white/5 rounded-xl p-5"
          >
            <h3 className="text-lg font-bold text-white mb-4">
              {category.title}
            </h3>
            <div className="space-y-3">
              {category.templates.map((tmpl) => (
                <Link
                  key={tmpl.type}
                  href={`/admin/email-templates/${tmpl.type}`}
                  className="block p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-primary text-sm group-hover:underline">
                      {tmpl.name}
                    </h4>
                    <span className="material-symbols-outlined text-sm text-slate-500 group-hover:text-primary transition-colors">
                      edit
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{tmpl.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
