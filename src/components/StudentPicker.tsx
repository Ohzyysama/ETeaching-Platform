"use client";

import { useEffect, useRef } from "react";

export interface StudentOption {
  id: string;
  name: string;
  username: string;
}

export function StudentPicker({
  students,
  selected,
  onChange,
}: {
  students: StudentOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const allRef = useRef<HTMLInputElement>(null);
  const allSelected = students.length > 0 && selected.length === students.length;
  const someSelected = selected.length > 0 && !allSelected;

  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = someSelected;
  }, [someSelected]);

  function toggle(id: string) {
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id));
    else onChange([...selected, id]);
  }

  function toggleAll() {
    if (allSelected) onChange([]);
    else onChange(students.map((s) => s.id));
  }

  return (
    <div className="rounded-2xl border border-[#00897b]/20 bg-white">
      <label className="flex items-center gap-2 px-3 py-2 border-b border-[#00897b]/20 font-sans text-sm cursor-pointer">
        <input
          type="checkbox"
          ref={allRef}
          checked={allSelected}
          onChange={toggleAll}
        />
        <span className="font-bold">全选</span>
        <span className="text-gray-500">
          （已选 {selected.length} / {students.length}）
        </span>
      </label>

      {students.length === 0 ? (
        <p className="px-3 py-4 font-sans text-sm text-gray-500">
          暂无学生账号，请先让学生自助注册。
        </p>
      ) : (
        <ul className="max-h-64 overflow-y-auto">
          {students.map((s) => (
            <li key={s.id}>
              <label className="flex items-center gap-2 px-3 py-1.5 font-sans text-sm cursor-pointer hover:bg-[#fffde7]">
                <input
                  type="checkbox"
                  checked={selected.includes(s.id)}
                  onChange={() => toggle(s.id)}
                />
                <span>{s.name}</span>
                <span className="text-gray-500">（{s.username}）</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
