import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAssignmentStats } from "@/lib/supabase/db";
import { formatDateTime } from "@/lib/format";
import { PaperLink, SectionTitle } from "@/components/ui";
import { SubmissionTable, type StatsRow } from "@/components/SubmissionTable";
import { SubmissionChart } from "@/components/SubmissionChart";

export default function AssignmentStats() {
  const { id } = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<any>(null);
  const [rows, setRows] = useState<StatsRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { assignment: a, rows: r } = await getAssignmentStats(id);
      setAssignment(a);
      setRows(r);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (loading || !assignment) return <p className="py-16 text-center font-sans text-sm text-gray-500">加载中…</p>;

  const onTime = rows.filter((r) => r.submitted && !r.late).length;
  const late = rows.filter((r) => r.late).length;
  const unsubmitted = rows.filter((r) => !r.submitted).length;
  const graded = rows.filter((r) => r.graded).length;

  return (
    <div className="px-6 md:px-8 py-8 md:py-10 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-sans tracking-tight text-2xl md:text-3xl text-[#00897b]">{assignment.title}</h1>
          <p className="font-sans text-sm text-gray-500 mt-1">
            {assignment.classNames?.join("、")} · 开始 {formatDateTime(assignment.start_at)} · 截止 {formatDateTime(assignment.due_at)}
          </p>
        </div>
        <PaperLink to={`/teacher/assignments/${id}/edit`} variant="secondary">编辑作业</PaperLink>
      </div>

      {assignment.description ? (
        <div className="mb-6">
          <h2 className="font-sans font-bold text-sm text-[#00897b]">作业说明</h2>
          <p className="font-sans text-sm md:text-base leading-relaxed text-gray-700 mt-1 whitespace-pre-wrap">{assignment.description}</p>
        </div>
      ) : null}

      {assignment.images?.length > 0 ? (
        <div className="mb-6">
          <h2 className="font-sans font-bold text-sm text-[#00897b]">配图</h2>
          <div className="flex flex-wrap gap-3 mt-2">
            {assignment.images.map((src: string, i: number) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt={`配图 ${i + 1}`} className="max-w-xs border-2 border-[#00897b]/20 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div>
          <SectionTitle number="1" title="提交情况" />
          <SubmissionChart onTime={onTime} late={late} unsubmitted={unsubmitted} />
        </div>
        <div>
          <SectionTitle number="2" title="概览" />
          <p className="font-sans text-sm md:text-base leading-relaxed text-gray-700 mt-3">
            共 {rows.length} 人需提交；已提交 {rows.length - unsubmitted} 人（按时 {onTime} 人，迟交 {late} 人）；未交 {unsubmitted} 人；已批改 {graded} 人。
          </p>
        </div>
      </div>

      <div className="mt-10">
        <SectionTitle number="3" title="提交名单" className="mb-3" />
        <SubmissionTable rows={rows} dueAt={new Date(assignment.due_at)} onSaved={reload} />
      </div>
    </div>
  );
}
