import { GlobalRole } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  username: string;
  globalRole: GlobalRole;
  sessionId: string;
}
