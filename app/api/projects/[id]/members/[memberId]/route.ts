import { prisma } from "@/lib/prisma";
import { getRequestSession } from "@/lib/auth-session";

export const runtime = "nodejs";

type MemberRouteContext = { params: Promise<{ id: string; memberId: string }> };

async function getAuthorizedMembership(projectId: string, userId: string) {
  return prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
}

async function isLastOwner(projectId: string, memberId: string) {
  const [member, ownerCount] = await Promise.all([
    prisma.projectMember.findFirst({ where: { id: memberId, projectId } }),
    prisma.projectMember.count({ where: { projectId, role: "OWNER" } }),
  ]);
  return member?.role === "OWNER" && ownerCount <= 1;
}

export async function PATCH(request: Request, { params }: MemberRouteContext) {
  const session = await getRequestSession(request);
  if (!session) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const { id: projectId, memberId } = await params;
  const requester = await getAuthorizedMembership(projectId, session.user.id);
  if (!requester) return Response.json({ error: "Project not found." }, { status: 404 });
  if (requester.role !== "OWNER") {
    return Response.json({ error: "Only an owner can change member roles." }, { status: 403 });
  }

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

  const target = await prisma.projectMember.findFirst({ where: { id: memberId, projectId } });
  if (!target) return Response.json({ error: "Member not found." }, { status: 404 });
  if (role === "MEMBER" && (await isLastOwner(projectId, memberId))) {
    return Response.json({ error: "A project must have at least one owner." }, { status: 400 });
  }

  const member = await prisma.projectMember.update({
    where: { id: memberId },
    data: { role },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });
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
  const requester = await getAuthorizedMembership(projectId, session.user.id);
  if (!requester) return Response.json({ error: "Project not found." }, { status: 404 });
  if (requester.role !== "OWNER") {
    return Response.json({ error: "Only an owner can remove members." }, { status: 403 });
  }

  const target = await prisma.projectMember.findFirst({ where: { id: memberId, projectId } });
  if (!target) return Response.json({ error: "Member not found." }, { status: 404 });
  if (target.userId === session.user.id) {
    return Response.json(
      { error: "You cannot remove yourself. Ask another owner to remove you." },
      { status: 400 },
    );
  }
  if (await isLastOwner(projectId, memberId)) {
    return Response.json({ error: "A project must have at least one owner." }, { status: 400 });
  }

  await prisma.projectMember.delete({ where: { id: memberId } });
  return new Response(null, { status: 204 });
}
