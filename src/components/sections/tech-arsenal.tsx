import { cn } from "@/lib/utils";

interface TechItem {
  name: string;
  icon: string;
  color: string;
}

interface TechArsenalProps {
  items?: TechItem[];
}

const defaultTechItems: TechItem[] = [
  { name: "Node.js", icon: "developer_board", color: "text-green-400" },
  { name: "Express", icon: "api", color: "text-white" },
  { name: "Postgres", icon: "database", color: "text-blue-400" },
  { name: "Redis", icon: "memory", color: "text-red-500" },
  { name: "Docker", icon: "deployed_code", color: "text-blue-500" },
  { name: "AWS", icon: "cloud", color: "text-orange-400" },
];

export function TechArsenal({ items = defaultTechItems }: TechArsenalProps) {
  return (
    <section className="mt-32">
      {/* Section Header */}
      <div className="flex items-center gap-4 mb-12">
        <span className="flex items-center justify-center size-8 rounded bg-primary/10 text-primary border border-primary/20 font-[family-name:var(--font-mono)] text-xs">
          01
        </span>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Technical Arsenal
        </h2>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
      </div>

      {/* Tech Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {items.map((item) => (
          <div key={item.name} className="group card-3d-wrapper">
            <div className="card-3d bg-white/5 border border-white/5 p-6 rounded-xl flex flex-col items-center justify-center gap-4 hover:bg-white/10 hover:border-primary/50 relative overflow-hidden">
              {/* Hover Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Icon */}
              <span
                className={cn(
                  "material-symbols-outlined text-4xl group-hover:scale-110 transition-transform",
                  item.color,
                )}
              >
                {item.icon}
              </span>

              {/* Name */}
              <span className="font-[family-name:var(--font-mono)] text-xs font-bold tracking-widest uppercase">
                {item.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
