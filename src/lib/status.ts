import type { SubmissionStatus } from "./types";

/**
 * Whether a submission is late: submitted after the assignment due time.
 * A submission with no `submittedAt` is not-yet-submitted.
 */
export function submissionStatus(
  submittedAt: Date | null,
  dueAt: Date
): SubmissionStatus {
  if (!submittedAt) return "not_submitted";
  return submittedAt.getTime() > dueAt.getTime()
    ? "submitted_late"
    : "submitted_on_time";
}

/**
 * A student may edit a submission only when BOTH hold:
 *   - the teacher has not graded it yet, and
 *   - the assignment deadline has not passed.
 * (Late first submission is still allowed; this only governs editing.)
 */
export function canStudentEdit(opts: {
  graded: boolean;
  dueAt: Date;
  submitted: boolean;
  now?: Date;
}): { allowed: boolean; reason: string | null } {
  const now = opts.now ?? new Date();
  if (opts.submitted && opts.graded) {
    return { allowed: false, reason: "教师已批改，无法修改。" };
  }
  if (now.getTime() > opts.dueAt.getTime()) {
    return { allowed: false, reason: "已过截止时间，无法修改。" };
  }
  return { allowed: true, reason: null };
}

export interface SubmissionSummary {
  total: number;
  submitted: number;
  onTime: number;
  late: number;
  unsubmitted: number;
  graded: number;
}

/** Aggregate counts for one assignment's submission status. */
export function summarizeSubmissions(
  total: number,
  submissions: { submittedAt: Date; graded: boolean }[],
  dueAt: Date
): SubmissionSummary {
  const submitted = submissions.length;
  const late = submissions.filter((s) => s.submittedAt.getTime() > dueAt.getTime())
    .length;
  return {
    total,
    submitted,
    onTime: submitted - late,
    late,
    unsubmitted: total - submitted,
    graded: submissions.filter((s) => s.graded).length,
  };
}
