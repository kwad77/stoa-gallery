import fs from "node:fs/promises";
import path from "node:path";
import Ajv, { type ValidateFunction } from "ajv";
import addFormats from "ajv-formats";

import { CONTRACTS_DIR } from "./paths";

let cached: {
  archiveValidate?: ValidateFunction;
} = {};

async function loadAjv(): Promise<Ajv> {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv;
}

export async function archiveManifestValidator(): Promise<ValidateFunction> {
  if (cached.archiveValidate) return cached.archiveValidate;
  const schemaPath = path.join(
    CONTRACTS_DIR,
    "ordo-run-archive",
    "schema.json"
  );
  const raw = await fs.readFile(schemaPath, "utf-8");
  const schema = JSON.parse(raw);
  const ajv = await loadAjv();
  cached.archiveValidate = ajv.compile(schema);
  return cached.archiveValidate;
}

export async function validateArchiveManifest(manifest: unknown): Promise<{
  ok: boolean;
  errors?: string[];
}> {
  const validate = await archiveManifestValidator();
  const ok = validate(manifest) as boolean;
  if (ok) return { ok: true };
  return {
    ok: false,
    errors: (validate.errors || []).map(
      (e) => `${e.instancePath || "<root>"} ${e.message}`
    )
  };
}
