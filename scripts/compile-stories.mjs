// Compile every /stories/*.ink to /public/stories/*.json using the inkjs
// compiler, so authoring only needs a text editor (Inky optional).
// Runs automatically before `npm run dev` and `npm run build`.

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { Compiler } from "inkjs/full";

const SRC_DIR = "stories";
const OUT_DIR = join("public", "stories");

mkdirSync(OUT_DIR, { recursive: true });

const sources = readdirSync(SRC_DIR).filter((f) => f.endsWith(".ink"));
if (sources.length === 0) {
  console.error(`No .ink files found in /${SRC_DIR}`);
  process.exit(1);
}

let failed = false;
for (const file of sources) {
  const source = readFileSync(join(SRC_DIR, file), "utf8");
  try {
    const story = new Compiler(source).Compile();
    const json = story.ToJson();
    const outFile = join(OUT_DIR, basename(file, ".ink") + ".json");
    writeFileSync(outFile, json);
    console.log(`compiled ${file} -> ${outFile} (${json.length} bytes)`);
  } catch (err) {
    failed = true;
    console.error(`FAILED to compile ${file}:`);
    console.error(err.message ?? err);
  }
}

process.exit(failed ? 1 : 0);
