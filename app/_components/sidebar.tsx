import type { Project, ProjectColor } from "@/app/_types/project";
import { UserAvatar } from "./user-avatar";

type SidebarProps = {
  activeView: "project" | "my-tasks" | "calendar" | "overview";
  projects: Project[];
  selectedProjectId: string | null;
  taskCount: number;
  userName: string;
  userEmail: string;
  userImage: string | null;
  onAddProject: () => void;
  onDeleteProject: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onMyTasks: () => void;
  onOverview: () => void;
  onCalendar: () => void;
  onSelectProject: (projectId: string) => void;
  onProfile: () => void;
};

const projectDotColors: Record<ProjectColor, string> = {
  indigo: "bg-indigo-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
};

export function Sidebar({
  activeView,
  projects,
  selectedProjectId,
  taskCount,
  userName,
  userEmail,
  userImage,
  onAddProject,
  onDeleteProject,
  onEditProject,
  onMyTasks,
  onOverview,
  onCalendar,
  onSelectProject,
  onProfile,
}: SidebarProps) {
  const navigation = [
    { label: "Overview", enabled: true },
    { label: "My tasks", badge: String(taskCount), enabled: true },
    { label: "Calendar", enabled: true },
  ];

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white px-5 py-7 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden">
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
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
              (item.label === "Overview" && activeView === "overview") ||
              (item.label === "My tasks" && activeView === "my-tasks") ||
              (item.label === "Calendar" && activeView === "calendar")
                ? "bg-indigo-50 text-indigo-700"
                : item.enabled
                  ? "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  : "cursor-default text-slate-400"
            }`}
            key={item.label}
            onClick={item.label === "Overview" ? onOverview : item.label === "My tasks" ? onMyTasks : item.label === "Calendar" ? onCalendar : undefined}
            type="button"
          >
            <span>{item.label}</span>
            {item.badge ? (
              <span className="ml-auto rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                {item.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <div className="mt-9 flex min-h-0 flex-1 flex-col">
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

        <div aria-label="Projects" className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-y-contain pr-1">
          {projects.map((project) => {
            const selected = activeView === "project" && project.id === selectedProjectId;
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

      <button
        aria-label={`Open profile for ${userName}`}
        className="mt-5 flex w-full shrink-0 items-center gap-3 border-t border-slate-200 px-2 pt-5 text-left transition hover:text-indigo-600"
        onClick={onProfile}
        type="button"
      >
        <UserAvatar email={userEmail} image={userImage} name={userName} />
        <span className="min-w-0 truncate text-sm font-semibold text-slate-800">{userName}</span>
      </button>
    </aside>
  );
}
