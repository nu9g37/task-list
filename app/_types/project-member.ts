export type ProjectRole = "OWNER" | "MEMBER";

export type ProjectMember = {
  id: string;
  role: ProjectRole;
  createdAt: string;
  isCurrentUser: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

export type ProjectMembersResponse = {
  members: ProjectMember[];
  canManage: boolean;
};
