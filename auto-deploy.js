const { exec } = require("child_process");

exec("git add . && git commit -m 'Auto update' && git push", (err, stdout, stderr) => {
  if (err) {
    console.log("🔁 Geen wijzigingen om te committen.");
  } else {
    console.log("✅ Gepusht:\n", stdout);
  }
});