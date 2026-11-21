"use client";
import { useMemo, useState } from "react";
import { ReactFlow, Background, Controls, MarkerType } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { State } from "./types";
export default function Graph({ s, open }: { s: State; open: any }) {
  const [group, G] = useState(true),
    [focus, F] = useState(s.notes.find((n) => n.title === "MVCC")?.id || ""),
    [pos, P] = useState({});
  const edges = focus
    ? s.links.filter((l) => l.source === focus || l.target === focus)
    : s.links;
  const related = new Set([
    focus,
    ...edges.flatMap((l) => [l.source, l.target]),
  ]);
  const notes = s.notes.filter((n) => !focus || related.has(n.id));
  const nodes = useMemo(() => {
    const ordered = group
      ? [...notes].sort((a, b) => a.category.localeCompare(b.category))
      : notes;
    let row = 0,
      col = 0,
      category = "";
    return ordered.map((n) => {
      if (col >= 4 || (group && category && category !== n.category)) {
        row++;
        col = 0;
      }
      const position = pos[n.id] || { x: col * 240, y: row * 110 };
      col++;
      category = n.category;
      return {
        id: n.id,
        position,
        data: {
          label: (
            <>
              <small>
                {n.category} · {n.status}
              </small>
              <br />
              {n.title}
            </>
          ),
        },
        style: {
          borderColor: n.status === "Understood" ? "#44ab8e" : "#ad9dce",
          width: 205,
          background: n.id === focus ? "#e6def7" : undefined,
        },
      };
    });
  }, [notes, group, pos, focus]);
  return (
    <>
      <div className="filters">
        <label>
          Окрестность материала
          <select
            value={focus}
            onChange={(e) => {
              F(e.target.value);
              P({});
            }}
          >
            <option value="">Весь граф</option>
            {s.notes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title}
              </option>
            ))}
          </select>
        </label>
        <label className="inline">
          <input
            type="checkbox"
            checked={group}
            onChange={(e) => {
              G(e.target.checked);
              P({});
            }}
          />{" "}
          Группировать по технологии
        </label>
      </div>
      <div className="graph">
        <ReactFlow
          key={focus + group}
          defaultNodes={nodes}
          edges={edges.map((l) => ({
            id: l.id,
            source: l.source,
            target: l.target,
            label: focus ? l.label : "",
            markerEnd: { type: MarkerType.ArrowClosed },
          }))}
          onNodeClick={(_, n) => open(s.notes.find((x) => x.id === n.id))}
          fitView
          minZoom={0.08}
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </>
  );
}
