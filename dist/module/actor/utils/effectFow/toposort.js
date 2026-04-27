import { pathAffects } from "./pathMatching.js";
const WRITE_PRECEDENCE = {
  overwrite: 0,
  modify: 1
};
function addEdge(outgoing, incoming, from, to) {
  if (from === to) return;
  const out = outgoing.get(from);
  if (!out.has(to)) {
    out.add(to);
    incoming.set(to, incoming.get(to) + 1);
  }
}
function compareTie(a, b) {
  const ta = a._tie ?? { priority: 0, effectId: a.id, index: 0 };
  const tb = b._tie ?? { priority: 0, effectId: b.id, index: 0 };
  if (ta.priority !== tb.priority) return tb.priority - ta.priority;
  if (ta.effectId !== tb.effectId) return ta.effectId.localeCompare(tb.effectId);
  return ta.index - tb.index;
}
function orderFlowOps(ops) {
  const writersByPath = /* @__PURE__ */ new Map();
  for (const op of ops) {
    for (const w of op.writes ?? []) {
      const list = writersByPath.get(w.path) ?? [];
      list.push({ op, kind: w.kind });
      writersByPath.set(w.path, list);
    }
  }
  const outgoing = /* @__PURE__ */ new Map();
  const incoming = /* @__PURE__ */ new Map();
  for (const op of ops) {
    outgoing.set(op, /* @__PURE__ */ new Set());
    incoming.set(op, 0);
  }
  for (const [, writers] of writersByPath.entries()) {
    if (writers.length < 2) continue;
    for (let i = 0; i < writers.length; i++) {
      for (let j = 0; j < writers.length; j++) {
        if (i === j) continue;
        const a = writers[i];
        const b = writers[j];
        const pa = WRITE_PRECEDENCE[a.kind] ?? 0;
        const pb = WRITE_PRECEDENCE[b.kind] ?? 0;
        if (pa < pb) addEdge(outgoing, incoming, a.op, b.op);
      }
    }
  }
  for (const dependent of ops) {
    for (const depAttr of dependent.deps ?? []) {
      for (const [writePath, writers] of writersByPath.entries()) {
        if (!pathAffects(writePath, depAttr)) continue;
        for (const w of writers) {
          if (w.op === dependent) continue;
          addEdge(outgoing, incoming, w.op, dependent);
        }
      }
    }
  }
  const queue = [];
  for (const [op, count] of incoming.entries()) {
    if (count === 0) queue.push(op);
  }
  queue.sort(compareTie);
  const result = [];
  while (queue.length) {
    const current = queue.shift();
    result.push(current);
    for (const next of outgoing.get(current)) {
      const newCount = incoming.get(next) - 1;
      incoming.set(next, newCount);
      if (newCount === 0) {
        queue.push(next);
        queue.sort(compareTie);
      }
    }
  }
  if (result.length !== ops.length) {
    console.warn("No valid execution order exists (cycle detected).");
    ui.notifications.warn("No valid execution order exists (cycle detected).");
  }
  return result;
}
export {
  orderFlowOps
};
