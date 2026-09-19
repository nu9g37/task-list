"use client";

import { useMemo, useState } from "react";
import type { Task, TaskPriority, TaskStatus } from "@/app/_types/task";
import { TaskListView } from "./task-list-view";

type TaskCalendarViewProps = {
  tasks: Task[];
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>;
};

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const compactWeekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const priorityStyles: Record<TaskPriority, string> = {
  LOW: "border-slate-300 bg-slate-50 text-slate-600",
  MEDIUM: "border-amber-400 bg-amber-50 text-amber-800",
  HIGH: "border-rose-400 bg-rose-50 text-rose-800",
};

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function TaskCalendarView({ tasks, onDelete, onEdit, onStatusChange }: TaskCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [displayedMonth, setDisplayedMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1, 12);
  });
  const todayKey = dateKey(new Date());

  const tasksByDate = useMemo(() => {
    const dates = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const key = task.dueDate.slice(0, 10);
      const dailyTasks = dates.get(key) ?? [];
      dailyTasks.push(task);
      dates.set(key, dailyTasks);
    }
    return dates;
  }, [tasks]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), 1, 12);
    const daysInMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 0).getDate();
    const dayCount = Math.ceil((firstDay.getDay() + daysInMonth) / 7) * 7;
    const start = new Date(firstDay);
    start.setDate(1 - firstDay.getDay());
    return Array.from({ length: dayCount }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [displayedMonth]);

  const selectedTasks = tasksByDate.get(selectedDate) ?? [];
  const selectedDateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dateFromKey(selectedDate));

  function changeMonth(offset: number) {
    const nextMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + offset, 1, 12);
    setDisplayedMonth(nextMonth);
    setSelectedDate(dateKey(nextMonth));
  }

  function goToToday() {
    const today = new Date();
    setDisplayedMonth(new Date(today.getFullYear(), today.getMonth(), 1, 12));
    setSelectedDate(dateKey(today));
  }

  function selectDay(day: Date) {
    setSelectedDate(dateKey(day));
    if (day.getMonth() !== displayedMonth.getMonth() || day.getFullYear() !== displayedMonth.getFullYear()) {
      setDisplayedMonth(new Date(day.getFullYear(), day.getMonth(), 1, 12));
    }
  }

  return (
    <div className="pb-8">
      <section aria-label="Task calendar" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Calendar</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(displayedMonth)}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600" onClick={goToToday} type="button">
              Today
            </button>
            <button aria-label="Previous month" className="grid size-10 place-items-center rounded-xl border border-slate-200 text-xl text-slate-600 hover:border-indigo-200 hover:text-indigo-600" onClick={() => changeMonth(-1)} type="button">
              ‹
            </button>
            <button aria-label="Next month" className="grid size-10 place-items-center rounded-xl border border-slate-200 text-xl text-slate-600 hover:border-indigo-200 hover:text-indigo-600" onClick={() => changeMonth(1)} type="button">
              ›
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="w-full">
            <div className="grid grid-cols-7 bg-[#102a5b] text-center text-xs font-semibold text-white">
              {weekdays.map((weekday, index) => (
                <div className="py-2.5" key={weekday}>
                  <span className="hidden sm:inline">{weekday}</span>
                  <span className="sm:hidden">{compactWeekdays[index]}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 border-l border-t border-slate-200">
              {calendarDays.map((day) => {
                const key = dateKey(day);
                const dailyTasks = tasksByDate.get(key) ?? [];
                const remaining = Math.max(0, dailyTasks.length - 2);
                const isSelected = selectedDate === key;
                const isCurrentMonth = day.getMonth() === displayedMonth.getMonth();
                return (
                  <button
                    aria-label={`${new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(day)}, ${dailyTasks.length} tasks`}
                    aria-pressed={isSelected}
                    className={`min-h-14 min-w-0 border-b border-r border-slate-200 p-1 text-center align-top transition hover:bg-indigo-50/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-500 sm:min-h-32 sm:p-2 sm:text-left ${isSelected ? "bg-indigo-50 ring-2 ring-inset ring-indigo-500" : isCurrentMonth ? "bg-white" : "bg-slate-50/80"}`}
                    key={key}
                    onClick={() => selectDay(day)}
                    type="button"
                  >
                    <span className={`inline-grid size-6 place-items-center rounded-full text-xs font-bold sm:mb-2 sm:size-7 ${key === todayKey ? "bg-indigo-600 text-white" : isCurrentMonth ? "text-slate-700" : "text-slate-400"}`}>
                      {day.getDate()}
                    </span>
                    {dailyTasks.length > 0 ? <span className="mx-auto mt-1 block size-1.5 rounded-full bg-indigo-500 sm:hidden" /> : null}
                    <span className="hidden space-y-1 sm:block">
                      {dailyTasks.slice(0, 2).map((task) => (
                        <span className={`block truncate rounded border-l-[3px] px-1.5 py-1 text-[11px] font-semibold ${priorityStyles[task.priority]}`} key={task.id} title={`${task.code} · ${task.title}`}>
                          {task.title}
                        </span>
                      ))}
                      {remaining > 0 ? <span className="block px-1 text-xs font-semibold text-indigo-600">+{remaining} more</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section aria-label={`Tasks due ${selectedDateLabel}`} className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Selected day</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">{selectedDateLabel}</h3>
          </div>
          <span className="text-sm font-medium text-slate-500">{selectedTasks.length} {selectedTasks.length === 1 ? "task" : "tasks"}</span>
        </div>
        <TaskListView
          emptyMessage="No tasks due on this day"
          onDelete={onDelete}
          onEdit={onEdit}
          onStatusChange={onStatusChange}
          tasks={selectedTasks}
        />
      </section>
    </div>
  );
}
