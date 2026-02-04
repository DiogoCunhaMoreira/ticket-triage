import { readFileSync } from "node:fs";
import { triageTicket } from "./triage.js";

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: npx ts-node src/cli.ts data/tickets/TCK-001.json");
    process.exit(1);
  }

  const ticket = JSON.parse(readFileSync(file, "utf-8"));
  const out = await triageTicket(ticket);

  console.log("\n=== TRIAGE JSON ===\n");
  console.log(JSON.stringify(out, null, 2));

  console.log("\n=== DRAFT COMMENT ===\n");
  console.log(out.draft_comment);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});