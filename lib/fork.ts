import type { ArchiveManifest } from "./archive";
import { PUBLIC_BASE_URL } from "./paths";

/**
 * Derive a plan-template from an archive manifest + optional plan.
 * The output validates against stoa/contracts/scp/plan-template.schema.yaml
 * (plus the D-008 origin_run_id / origin_share_url extensions).
 */
export interface ForkInput {
  manifest: ArchiveManifest;
  plan?: unknown;
}

export function buildPlanTemplate(input: ForkInput): Record<string, unknown> {
  const m = input.manifest;
  const slug = slugify(
    (m.prompt || "forked-run").split("\n")[0] || "forked-run"
  );
  const template = {
    apiVersion: "stoa/v1",
    kind: "PlanTemplate",
    metadata: {
      id: `${slug}-${m.run_id.slice(0, 8).toLowerCase()}`,
      name: `Forked: ${(m.prompt || m.run_id).slice(0, 60)}`,
      version: "0.1.0",
      description: `Forked from an Ordo run on ${m.created_at}. Original: ${m.iter_count} iters, $${m.total_cost_usd.toFixed(4)}.`,
      tags: ["fork", "gallery"],
      license: "MIT",
      origin_run_id: m.run_id,
      origin_share_url: `${PUBLIC_BASE_URL}/run/${m.run_id}`
    },
    spec: {
      prompt: {
        template: m.prompt || "(no prompt recorded)"
      },
      ...(m.models_used && m.models_used.length
        ? {
            roster: {
              overlays: [
                {
                  role: "Author",
                  prefer_model: m.models_used[0],
                  rationale: "Inherited from the origin run's author iter."
                }
              ]
            }
          }
        : {})
    }
  };
  return template;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "forked"
  );
}

export function toYaml(obj: Record<string, unknown>): string {
  // Minimal hand-rolled YAML emitter scoped to plan-template shape.
  // Avoids adding a YAML-emit dep for one route.
  const lines: string[] = [];
  function indent(n: number): string {
    return "  ".repeat(n);
  }
  function scalar(v: unknown): string {
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    const s = String(v);
    if (s === "") return '""';
    if (/^[\w./@-]+$/.test(s) && !/^(true|false|null|~|-?\d+(\.\d+)?)$/.test(s)) {
      return s;
    }
    return JSON.stringify(s);
  }
  function emit(k: string | null, v: unknown, depth: number): void {
    const pad = indent(depth);
    if (Array.isArray(v)) {
      if (k) lines.push(`${pad}${k}:`);
      for (const item of v) {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          lines.push(`${pad}- `);
          const entries = Object.entries(item as Record<string, unknown>);
          entries.forEach(([ik, iv], i) => {
            if (i === 0) {
              // continue last line
              lines[lines.length - 1] = `${pad}- ${ik}: ${formatInline(iv, depth + 1)}`;
              if (inlineable(iv) === false) {
                // switch to block form
                lines[lines.length - 1] = `${pad}- ${ik}:`;
                emit(null, iv, depth + 2);
              }
            } else {
              emitKV(ik, iv, depth + 1);
            }
          });
        } else {
          lines.push(`${pad}- ${formatInline(item, depth + 1)}`);
        }
      }
    } else if (v && typeof v === "object") {
      if (k) lines.push(`${pad}${k}:`);
      for (const [ck, cv] of Object.entries(v)) {
        emitKV(ck, cv, k ? depth + 1 : depth);
      }
    } else {
      if (k) lines.push(`${pad}${k}: ${formatInline(v, depth)}`);
      else lines.push(`${pad}${formatInline(v, depth)}`);
    }
  }
  function emitKV(k: string, v: unknown, depth: number): void {
    if (inlineable(v)) {
      lines.push(`${indent(depth)}${k}: ${formatInline(v, depth)}`);
    } else {
      emit(k, v, depth);
    }
  }
  function inlineable(v: unknown): boolean {
    if (v === null || v === undefined) return true;
    if (typeof v !== "object") return true;
    if (Array.isArray(v) && v.length === 0) return true;
    return false;
  }
  function formatInline(v: unknown, _depth: number): string {
    if (v === null || v === undefined) return "null";
    if (Array.isArray(v) && v.length === 0) return "[]";
    if (typeof v === "object") return "{}";
    return scalar(v);
  }
  emit(null, obj, 0);
  return lines.join("\n") + "\n";
}
