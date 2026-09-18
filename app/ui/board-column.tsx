import type { BoardColumnData, Task } from "./mock-data";
import { TaskCard } from "./task-card";

type BoardColumnProps = {
  column: BoardColumnData;
  tasks: Task[];
  onAdd: (status: Task["status"]) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export function BoardColumn({
  column,
  tasks,
  onAdd,
  onEdit,
  onDelete,
}: BoardColumnProps) {
  return (
    <section className="min-w-[280px] rounded-3xl bg-slate-100/80 p-3 sm:p-4">
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <span className={`size-2.5 rounded-full ${column.dotColor}`} />
          <h2 className="text-sm font-bold text-slate-700">{column.title}</h2>
          <span className="grid size-6 place-items-center rounded-full bg-white text-xs font-semibold text-slate-400 shadow-sm">
            {tasks.length}
          </span>
        </div>
        <button
          aria-label={`Add task to ${column.title}`}
          className="grid size-8 place-items-center rounded-xl text-lg text-slate-400 transition hover:bg-white hover:text-indigo-600 hover:shadow-sm"
          onClick={() => onAdd(column.status)}
          type="button"
        >
          +
        </button>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} onDelete={onDelete} onEdit={onEdit} task={task} />
        ))}
        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-4 py-8 text-center text-sm text-slate-400">
            No tasks yet
          </div>
        ) : null}
      </div>

      <button
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-400 transition hover:border-indigo-300 hover:bg-white hover:text-indigo-600"
        onClick={() => onAdd(column.status)}
        type="button"
      >
        <span className="text-lg leading-none">+</span>
        Add task
      </button>
    </section>
  );
}
