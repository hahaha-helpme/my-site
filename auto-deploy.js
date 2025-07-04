const { exec } = require("child_process");
exec(
  `git add -A &&
   git diff --cached --quiet || 
   git commit -m "Auto update 🚀" &&
   git push`,
  (_, out) => console.log("✅ Geüpdatet!\n" + out)
);
