const fs = require("fs");
const path = require("path");

const inputFile = "index.html";
const outputFile = "output.html";

const baseDir = path.dirname(inputFile);
let html = fs.readFileSync(inputFile, "utf8");

html = html.replace(/<script\s+src="(.+?)"><\/script>/g, (match, src) => {
  if (src.startsWith("http")) return match; // externe URL? overslaan

  const scriptPath = path.join(baseDir, src); // pad oplossen t.o.v. index.html

  if (!fs.existsSync(scriptPath)) {
    console.warn(`⚠ Bestand niet gevonden: ${scriptPath}`);
    return match;
  }

  const scriptContent = fs.readFileSync(scriptPath, "utf8");
  return `<script>\n${scriptContent}\n</script>`;
});

fs.writeFileSync(outputFile, html);
console.log("✅ output.html aangemaakt!");