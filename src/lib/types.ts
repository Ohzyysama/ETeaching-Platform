export type Role = "TEACHER" | "STUDENT";

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: Role;
}

export type SubmissionStatus =
  | "not_submitted"
  | "submitted_on_time"
  | "submitted_late";

/** uniform return shape for server actions */
export type ActionResult = {
  ok: boolean;
  error?: string;
  redirectTo?: string;
};
