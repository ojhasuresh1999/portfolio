"use client";

import { useState } from "react";

interface SkillCategory {
  id: string;
  name: string;
  icon: string;
  skills: { name: string; proficiency: number }[];
}

const mockSkillCategories: SkillCategory[] = [
  {
    id: "1",
    name: "Languages",
    icon: "code",
    skills: [
      { name: "TypeScript", proficiency: 95 },
      { name: "JavaScript", proficiency: 98 },
      { name: "Go", proficiency: 85 },
      { name: "Python", proficiency: 70 },
    ],
  },
  {
    id: "2",
    name: "Databases",
    icon: "database",
    skills: [
      { name: "PostgreSQL", proficiency: 90 },
      { name: "Redis", proficiency: 85 },
      { name: "MongoDB", proficiency: 80 },
    ],
  },
  {
    id: "3",
    name: "DevOps",
    icon: "cloud_sync",
    skills: [
      { name: "Docker", proficiency: 92 },
      { name: "Kubernetes", proficiency: 75 },
      { name: "AWS", proficiency: 80 },
    ],
  },
];

export default function AdminSkillsPage() {
  const [categories] = useState<SkillCategory[]>(mockSkillCategories);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Skills & Stack</h2>
          <p className="text-slate-400 text-sm">
            Manage your technical skills and proficiencies
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors">
          <span className="material-symbols-outlined">add</span>
          Add Skill
        </button>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-card-dark border border-white/5 rounded-xl overflow-hidden"
          >
            {/* Category Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/5">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">
                  {category.icon}
                </span>
                <h3 className="text-lg font-bold text-white">
                  {category.name}
                </h3>
                <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded">
                  {category.skills.length} skills
                </span>
              </div>
              <button className="flex items-center gap-1 text-sm text-slate-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-lg">
                  add_circle
                </span>
                Add to {category.name}
              </button>
            </div>

            {/* Skills List */}
            <div className="p-6 space-y-4">
              {category.skills.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
                >
                  {/* Skill Name */}
                  <div className="w-1/3">
                    <span className="text-white font-medium">{skill.name}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="flex-1">
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                        style={{ width: `${skill.proficiency}%` }}
                      />
                    </div>
                  </div>

                  {/* Proficiency */}
                  <div className="w-16 text-right">
                    <span className="text-primary font-bold">
                      {skill.proficiency}%
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white">
                      <span className="material-symbols-outlined text-sm">
                        edit
                      </span>
                    </button>
                    <button className="p-1.5 hover:bg-red-500/10 rounded transition-colors text-slate-400 hover:text-red-400">
                      <span className="material-symbols-outlined text-sm">
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tech Stack Section */}
      <div className="bg-card-dark border border-white/5 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Technical Arsenal</h3>
          <button className="text-sm text-primary hover:underline">
            Edit Icons
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {["Node.js", "Express", "PostgreSQL", "Redis", "Docker", "AWS"].map(
            (tech, index) => (
              <div
                key={tech}
                className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center gap-2 hover:border-primary/30 transition-all group cursor-pointer"
              >
                <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-primary transition-colors">
                  {
                    [
                      "developer_board",
                      "api",
                      "database",
                      "memory",
                      "inventory_2",
                      "cloud",
                    ][index]
                  }
                </span>
                <span className="text-xs font-medium text-slate-300">
                  {tech}
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
