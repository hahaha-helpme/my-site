const { exec } = require("child_process");

exec(
  `git add . && git commit -m "Auto update $(date)" && git push`,
  (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Fout bij deploy:", stderr);
    } else {
      console.log("✅ Geüpdatet & gedeployed:\n", stdout);
    }
  }
);