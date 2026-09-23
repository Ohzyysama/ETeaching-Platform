/**
 * Submission status bar chart — flat, tropical, warm teal shadow.
 * Colors carry meaning and are always backed by a direct label (count above the
 * bar, category below), so identity never rests on color alone.
 *   #00897b 按时提交 (teal) · #ff6f61 迟交 (coral) · #ffc107 未交 (mango)
 */
export function SubmissionChart({
  onTime,
  late,
  unsubmitted,
}: {
  onTime: number;
  late: number;
  unsubmitted: number;
}) {
  const data = [
    { label: "按时提交", value: onTime, color: "#00897b" },
    { label: "迟交", value: late, color: "#ff6f61" },
    { label: "未交", value: unsubmitted, color: "#ffc107" },
  ];
  const max = Math.max(1, ...data.map((d) => d.value));

  const W = 320;
  const H = 220;
  const baselineY = 180;
  const maxBarH = 130;
  const barW = 56;
  const gap = 34;
  const startX = 28;

  return (
    <figure className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,137,123,0.1)] p-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`作业提交情况：按时提交 ${onTime} 人，迟交 ${late} 人，未交 ${unsubmitted} 人`}
        className="w-full max-w-sm mx-auto"
      >
        {/* baseline */}
        <line
          x1={12}
          y1={baselineY}
          x2={W - 12}
          y2={baselineY}
          stroke="#00897b"
          strokeOpacity={0.35}
          strokeWidth={2}
        />

        {data.map((d, i) => {
          const x = startX + i * (barW + gap);
          const h = Math.round((d.value / max) * maxBarH);
          const y = baselineY - h;
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={6}
                fill={d.color}
                shapeRendering="crispEdges"
              >
                <title>{`${d.label}：${d.value} 人`}</title>
              </rect>
              <text
                x={x + barW / 2}
                y={y - 8}
                textAnchor="middle"
                className="font-sans"
                fontSize={13}
                fontWeight={700}
                fill="#00897b"
              >
                {d.value}
              </text>
              <text
                x={x + barW / 2}
                y={baselineY + 20}
                textAnchor="middle"
                className="font-sans"
                fontSize={13}
                fill="#374151"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="font-sans text-sm text-gray-500 text-center mt-2">
        图 1：作业提交情况分布
      </figcaption>
    </figure>
  );
}
