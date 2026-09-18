import type { Project, ProjectColor } from "@/app/_types/project";

type SidebarProps = {
  projects: Project[];
  selectedProjectId: string | null;
  taskCount: number;
  onAddProject: () => void;
  onDeleteProject: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onSelectProject: (projectId: string) => void;
};

const projectDotColors: Record<ProjectColor, string> = {
  indigo: "bg-indigo-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
};

export function Sidebar({
  projects,
  selectedProjectId,
  taskCount,
  onAddProject,
  onDeleteProject,
  onEditProject,
  onSelectProject,
}: SidebarProps) {
  const navigation = [
    { label: "Overview", icon: "⌂" },
    { label: "My tasks", icon: "✓", badge: String(taskCount) },
    { label: "Calendar", icon: "□" },
  ];

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white px-5 py-7 lg:flex lg:flex-col">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="grid size-11 place-items-center rounded-2xl bg-indigo-600 font-black text-white shadow-lg shadow-indigo-200">
          T
        </div>
        <div>
          <p className="text-lg font-bold tracking-tight text-slate-900">Tasklist</p>
          <p className="text-xs text-slate-400">Student workspace</p>
        </div>
      </div>

      <nav aria-label="Main navigation" className="space-y-1">
        {navigation.map((item) => (
          <button
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            key={item.label}
            type="button"
          >
            <span className="grid size-6 place-items-center text-base text-slate-400">
              {item.icon}
            </span>
            <span>{item.label}</span>
            {item.badge ? (
              <span className="ml-auto rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <div className="mt-9">
        <div className="mb-3 flex items-center justify-between px-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Projects
          </p>
          <button
            aria-label="Add project"
            className="text-lg leading-none text-slate-400 transition hover:text-indigo-600"
            onClick={onAddProject}
            type="button"
          >
            +
          </button>
        </div>

        <div className="space-y-1">
          {projects.map((project) => {
            const selected = project.id === selectedProjectId;
            return (
              <div className="group relative" key={project.id}>
                <button
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 pr-16 text-left text-sm font-medium transition ${
                    selected
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  onClick={() => onSelectProject(project.id)}
                  type="button"
                >
                  <span className={`size-2.5 shrink-0 rounded-full ${projectDotColors[project.color]}`} />
                  <span className="truncate">{project.name}</span>
                </button>
                <div className="absolute inset-y-0 right-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                  <button
                    aria-label={`Edit ${project.name}`}
                    className="grid size-6 place-items-center rounded text-xs text-slate-400 hover:bg-white hover:text-indigo-600"
                    onClick={() => onEditProject(project)}
                    title="Edit project"
                    type="button"
                  >
                    ✎
                  </button>
                  <button
                    aria-label={`Delete ${project.name}`}
                    className="grid size-6 place-items-center rounded text-sm text-slate-400 hover:bg-white hover:text-rose-600"
                    onClick={() => onDeleteProject(project)}
                    title="Delete project"
                    type="button"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto rounded-2xl bg-slate-950 p-4 text-white">
        <p className="text-sm font-semibold">Build your streak</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Complete one task today to keep your momentum.
        </p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-700">
          <div className="h-full w-2/3 rounded-full bg-indigo-400" />
        </div>
      </div>
    </aside>
  );
}
