const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(process.cwd(), "out");

function walkAndCleanTxt(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkAndCleanTxt(full);
      continue;
    }
    if (!ent.isFile()) continue;

    const lower = ent.name.toLowerCase();
    if (!lower.endsWith(".txt")) continue;
    if (lower === "robots.txt") continue;

    try {
      fs.unlinkSync(full);
    } catch {
      // ignore per-file errors; continue walk
    }
  }
}

if (!fs.existsSync(OUT_DIR)) {
  process.exit(0);
}

walkAndCleanTxt(OUT_DIR);
process.exit(0);
