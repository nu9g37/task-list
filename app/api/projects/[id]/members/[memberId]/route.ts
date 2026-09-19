import { prisma } from "@/lib/prisma";
import { getRequestSession } from "@/lib/auth-session";
import { Prisma } from "@/app/generated/prisma/client";
import { retryWriteConflict } from "@/lib/transaction-retry";
import { wouldRemoveLastOwner } from "@/lib/owner-guard";

export const runtime = "nodejs";

type MemberRouteContext = { params: Promise<{ id: string; memberId: string }> };

export async function PATCH(request: Request, { params }: MemberRouteContext) {
  const session = await getRequestSession(request);
  if (!session) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const { id: projectId, memberId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const input = body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
  const role = input.role === "OWNER" ? "OWNER" : input.role === "MEMBER" ? "MEMBER" : null;
  if (!role) return Response.json({ error: "Invalid project role." }, { status: 400 });

  const result = await retryWriteConflict(() => prisma.$transaction(async (tx) => {
    const requester = await tx.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: session.user.id } },
    });
    if (!requester) return { error: "Project not found.", status: 404 } as const;
    if (requester.role !== "OWNER") return { error: "Only an owner can change member roles.", status: 403 } as const;
    const target = await tx.projectMember.findFirst({ where: { id: memberId, projectId } });
    if (!target) return { error: "Member not found.", status: 404 } as const;
    if (target.role === "OWNER" && role === "MEMBER") {
      const ownerCount = await tx.projectMember.count({ where: { projectId, role: "OWNER" } });
      if (wouldRemoveLastOwner(target.role, role, ownerCount)) return { error: "A project must have at least one owner.", status: 400 } as const;
    }
    const member = await tx.projectMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });
    return { member };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
  const member = result.member;
  return Response.json({
    ...member,
    createdAt: member.createdAt.toISOString(),
    isCurrentUser: member.user.id === session.user.id,
  });
}

export async function DELETE(request: Request, { params }: MemberRouteContext) {
  const session = await getRequestSession(request);
  if (!session) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const { id: projectId, memberId } = await params;
  const result = await retryWriteConflict(() => prisma.$transaction(async (tx) => {
    const requester = await tx.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: session.user.id } },
    });
    if (!requester) return { error: "Project not found.", status: 404 } as const;
    if (requester.role !== "OWNER") return { error: "Only an owner can remove members.", status: 403 } as const;
    const target = await tx.projectMember.findFirst({ where: { id: memberId, projectId } });
    if (!target) return { error: "Member not found.", status: 404 } as const;
    if (target.userId === session.user.id) {
      return { error: "You cannot remove yourself. Ask another owner to remove you.", status: 400 } as const;
    }
    if (target.role === "OWNER") {
      const ownerCount = await tx.projectMember.count({ where: { projectId, role: "OWNER" } });
      if (wouldRemoveLastOwner(target.role, null, ownerCount)) return { error: "A project must have at least one owner.", status: 400 } as const;
    }
    await tx.taskAssignee.deleteMany({ where: { userId: target.userId, task: { projectId } } });
    await tx.projectMember.delete({ where: { id: memberId } });
    return { deleted: true } as const;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
  return new Response(null, { status: 204 });
}
