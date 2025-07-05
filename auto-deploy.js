// const { exec } = require("child_process");
// exec(
//   `git add -A &&
//    git diff --cached --quiet || 
//    git commit -m "Auto update 🚀" &&
//    git push`,
//   (_, out) => console.log("✅ Geüpdatet!\n" + out)
// );

// auto-deploy.js  –  kort & duidelijk
const { execSync } = require("child_process");
const run = cmd => execSync(cmd, { stdio: "inherit" });

// 1️⃣ Turbo-upload naar ‘fast’ (altijd dezelfde URL)
run("wrangler pages deploy ./ --project-name grid --branch fast");

// 2️⃣ Commit & push (update preview later)
run("git add -A");
try { run('git diff --cached --quiet'); } catch {        // er is wél iets veranderd
  run('git commit -m "Auto update 🚀"');
  run("git push");                                       // branch = preview
}