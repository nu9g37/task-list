"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Project } from "@/app/_types/project";
import type {
  ProjectMember,
  ProjectMembersResponse,
  ProjectRole,
} from "@/app/_types/project-member";

type ProjectMembersDialogProps = {
  project: Project;
  onClose: () => void;
};

async function readApiError(response: Response) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? "Something went wrong. Please try again.";
}

function initials(name: string, email: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return `${words[0][0]}${words.at(-1)?.[0]}`.toUpperCase();
  return (words[0]?.slice(0, 2) || email.slice(0, 2)).toUpperCase();
}

export function ProjectMembersDialog({ project, onClose }: ProjectMembersDialogProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ProjectRole>("MEMBER");
  const [adding, setAdding] = useState(false);
  const [busyMemberId, setBusyMemberId] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();

    async function loadMembers() {
      try {
        const response = await fetch(`/api/projects/${project.id}/members`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(await readApiError(response));
        const data = (await response.json()) as ProjectMembersResponse;
        setMembers(data.members);
        setCanManage(data.canManage);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load members.");
      } finally {
        setLoading(false);
      }
    }

    loadMembers();
    return () => controller.abort();
  }, [project.id]);

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdding(true);
    setError(undefined);

    try {
      const response = await fetch(`/api/projects/${project.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const member = (await response.json()) as ProjectMember;
      setMembers((current) => [...current, member]);
      setEmail("");
      setRole("MEMBER");
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Unable to add member.");
    } finally {
      setAdding(false);
    }
  }

  async function changeRole(member: ProjectMember, nextRole: ProjectRole) {
    setBusyMemberId(member.id);
    setError(undefined);

    try {
      const response = await fetch(`/api/projects/${project.id}/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const updated = (await response.json()) as ProjectMember;
      setMembers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      if (updated.isCurrentUser && updated.role !== "OWNER") setCanManage(false);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update member.");
    } finally {
      setBusyMemberId(undefined);
    }
  }

  async function removeMember(member: ProjectMember) {
    if (!window.confirm(`Remove ${member.user.name || member.user.email} from this project?`)) {
      return;
    }
    setBusyMemberId(member.id);
    setError(undefined);

    try {
      const response = await fetch(`/api/projects/${project.id}/members/${member.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await readApiError(response));
      setMembers((current) => current.filter((item) => item.id !== member.id));
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to remove member.");
    } finally {
      setBusyMemberId(undefined);
    }
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-indigo-600">{project.name}</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">Project members</h2>
            <p className="mt-1 text-sm text-slate-500">
              Owners can invite registered users and manage their roles.
            </p>
          </div>
          <button
            aria-label="Close members dialog"
            className="grid size-10 place-items-center rounded-xl text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        {canManage ? (
          <form className="mb-6 flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row" onSubmit={addMember}>
            <input
              aria-label="Member email"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="member@example.com"
              required
              type="email"
              value={email}
            />
            <select
              aria-label="Member role"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
              onChange={(event) => setRole(event.target.value as ProjectRole)}
              value={role}
            >
              <option value="MEMBER">Member</option>
              <option value="OWNER">Owner</option>
            </select>
            <button
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              disabled={adding}
              type="submit"
            >
              {adding ? "Adding..." : "Add member"}
            </button>
          </form>
        ) : null}

        {error ? (
          <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Loading members...</p>
        ) : (
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {members.map((member) => (
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center" key={member.id}>
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-700">
                  {initials(member.user.name, member.user.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {member.user.name}{member.isCurrentUser ? " (you)" : ""}
                  </p>
                  <p className="truncate text-xs text-slate-500">{member.user.email}</p>
                </div>

                {canManage ? (
                  <div className="flex items-center gap-2">
                    <select
                      aria-label={`Role for ${member.user.name}`}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 outline-none focus:border-indigo-400 disabled:opacity-60"
                      disabled={busyMemberId === member.id}
                      onChange={(event) => changeRole(member, event.target.value as ProjectRole)}
                      value={member.role}
                    >
                      <option value="MEMBER">Member</option>
                      <option value="OWNER">Owner</option>
                    </select>
                    <button
                      className="rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-40"
                      disabled={busyMemberId === member.id || member.isCurrentUser}
                      onClick={() => removeMember(member)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
                    {member.role === "OWNER" ? "Owner" : "Member"}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
