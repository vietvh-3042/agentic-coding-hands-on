import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Shared `psql` escape hatch for E2E specs that must read or reset DB state.
 *
 * There is no `psql` binary on the host, so queries run through
 * `docker exec` against the local Supabase database container.
 *
 * The container is named `supabase_db_<project_id>`, where `project_id` comes
 * from `supabase/config.toml`. It is read from that file rather than hardcoded:
 * six specs previously inlined `supabase_db_mock-aidd-kudo-app` — a container
 * name belonging to a different project — so every DB-backed board spec failed
 * with "No such container" once this repo was renamed. Deriving the name means
 * a future rename cannot reintroduce that break.
 *
 * `E2E_DB_CONTAINER` overrides it for CI or a non-standard local stack.
 */
function resolveContainerName(): string {
  const override = process.env.E2E_DB_CONTAINER;
  if (override) return override;

  const configPath = path.join(__dirname, "..", "..", "supabase", "config.toml");
  const config = readFileSync(configPath, "utf8");
  // Matches `project_id = "name"` while skipping the commented-out
  // `# project_id = "my-firebase-project"` further down the file.
  const projectId = /^\s*project_id\s*=\s*"([^"]+)"/m.exec(config)?.[1];

  if (!projectId) {
    throw new Error(
      `Could not read project_id from ${configPath}. Set E2E_DB_CONTAINER to the Supabase DB container name.`,
    );
  }

  return `supabase_db_${projectId}`;
}

const CONTAINER = resolveContainerName();

/** Runs one SQL statement in the local Supabase DB and returns trimmed stdout. */
export function psql(sql: string): string {
  return execSync(`docker exec ${CONTAINER} psql -U postgres -d postgres -v ON_ERROR_STOP=1 -tA -c "${sql}"`)
    .toString()
    .trim();
}
