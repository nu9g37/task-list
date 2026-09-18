import { prisma } from "@/lib/prisma";
import { getRequestSession } from "@/lib/auth-session";
import type { ProjectRole } from "@/app/generated/prisma/client";

export const runtime = "nodejs";

type MembersRouteContext = { params: Promise<{ id: string }> };

function serializeMember(
  member: {
    id: string;
    role: ProjectRole;
    createdAt: Date;
    user: { id: string; name: string; email: string; image: string | null };
  },
  currentUserId: string,
) {
  return {
    ...member,
    createdAt: member.createdAt.toISOString(),
    isCurrentUser: member.user.id === currentUserId,
  };
}

export async function GET(request: Request, { params }: MembersRouteContext) {
  const session = await getRequestSession(request);
  if (!session) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const { id: projectId } = await params;
  const requester = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
  });
  if (!requester) return Response.json({ error: "Project not found." }, { status: 404 });

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return Response.json({
    canManage: requester.role === "OWNER",
    members: members.map((member) => serializeMember(member, session.user.id)),
  });
}

export async function POST(request: Request, { params }: MembersRouteContext) {
  const session = await getRequestSession(request);
  if (!session) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const { id: projectId } = await params;
  const requester = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
  });
  if (!requester) return Response.json({ error: "Project not found." }, { status: 404 });
  if (requester.role !== "OWNER") {
    return Response.json({ error: "Only an owner can add members." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Request body must be an object." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const role = input.role === "OWNER" ? "OWNER" : input.role === "MEMBER" ? "MEMBER" : null;
  if (!email || !email.includes("@")) {
    return Response.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (!role) return Response.json({ error: "Invalid project role." }, { status: 400 });

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, name: true, email: true, image: true },
  });
  if (!user) {
    return Response.json(
      { error: "No registered user was found with that email." },
      { status: 404 },
    );
  }

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (existing) {
    return Response.json({ error: "This user is already a project member." }, { status: 409 });
  }

  const member = await prisma.projectMember.create({
    data: { projectId, userId: user.id, role },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });
  return Response.json(serializeMember(member, session.user.id), { status: 201 });
}
