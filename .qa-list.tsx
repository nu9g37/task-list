import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { TaskListView } from "./app/_components/board/task-list-view";
import type { Task } from "./app/_types/task";

const cssName = readdirSync(".next/static/chunks").find((name) => name.endsWith(".css"));
if (!cssName) throw new Error("Built CSS not found");
const css = readFileSync(join(".next/static/chunks", cssName), "utf8");
const tasks: Task[] = [
  {
    id: "1", code: "TSK-85170B", title: "cheat sheet", description: "", status: "IN_PROGRESS", priority: "HIGH", dueDate: "2026-09-19T00:00:00.000Z", tag: "GENERAL", commentsCount: 0,
    project: { id: "p1", name: "Stat Theory II", color: "indigo" },
    assignees: [{ id: "a1", name: "Chanyanat Chamnankit", email: "cc@example.com", image: null }],
  },
  {
    id: "2", code: "TSK-373913", title: "Test, Test1", description: "Hello", status: "TODO", priority: "MEDIUM", dueDate: "2026-09-23T00:00:00.000Z", tag: "GENERAL", commentsCount: 0,
    project: { id: "p2", name: "STAT", color: "indigo" },
    assignees: [{ id: "a2", name: "test1", email: "test1@example.com", image: null }, { id: "a3", name: "test", email: "test@example.com", image: null }],
  },
];
const content = renderToStaticMarkup(createElement(TaskListView, { tasks, onDelete: () => {}, onEdit: () => {}, onStatusChange: async () => {} }));
writeFileSync(".qa-list.html", `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style><style>body{background:#f7f8fc}main{max-width:1180px;margin:auto;padding:16px}</style></head><body><main>${content}</main></body></html>`);
