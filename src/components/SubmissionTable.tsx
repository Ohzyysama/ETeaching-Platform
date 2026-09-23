import { Link } from "react-router-dom";
import { formatDateTime } from "@/lib/format";
import { blueLinkClass } from "@/components/ui";
import { ScoreCell } from "./ScoreCell";

export interface StatsRow {
  studentId: string;
  name: string;
  username: string;
  submitted: boolean;
  submittedAt: Date | null;
  late: boolean;
  score: number;
  graded: boolean;
  submissionId: string | null;
}

export function SubmissionTable({
  rows,
  dueAt,
  onSaved,
}: {
  rows: StatsRow[];
  dueAt: Date;
  onSaved: () => void;
}) {
  const now = new Date();
  const link = blueLinkClass();

  return (
    <div className="overflow-x-auto bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,137,123,0.1)]">
      <table className="w-full text-left font-sans text-sm">
        <thead className="bg-[#fffde7] text-[#00897b]">
          <tr>
            <th className="px-4 py-3 text-sm font-bold">姓名</th>
            <th className="px-4 py-3 text-sm font-bold">是否提交</th>
            <th className="px-4 py-3 text-sm font-bold">提交时间</th>
            <th className="px-4 py-3 text-sm font-bold">分数</th>
            <th className="px-4 py-3 text-sm font-bold">操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const overdue = !r.submitted && now.getTime() > dueAt.getTime();
            return (
              <tr key={r.studentId} className="border-t border-[#00897b]/10">
                <td className="px-4 py-3">
                  <span className="font-bold">{r.name}</span>
                  <span className="text-gray-500 ml-1 text-sm">（{r.username}）</span>
                </td>
                <td className="px-4 py-3">
                  {r.submitted ? (
                    <span>已提交</span>
                  ) : overdue ? (
                    <span className="text-[#ff6f61] font-bold">未交（逾期）</span>
                  ) : (
                    <span className="text-gray-500">未交</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {r.submittedAt ? (
                    <span className={r.late ? "text-[#ff6f61]" : ""}>{formatDateTime(r.submittedAt)}</span>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {r.submissionId ? (
                    <ScoreCell submissionId={r.submissionId} score={r.score} graded={r.graded} onSaved={onSaved} />
                  ) : (
                    <span className="text-gray-500">0</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {r.submissionId ? (
                    <Link to={`/teacher/submissions/${r.submissionId}`} className={link}>查看</Link>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
