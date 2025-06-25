const { exec } = require("child_process");

exec("git add . && git commit -m 'Auto update' && git push", (err, stdout, stderr) => {
  if (err) {
    console.log("🔍 Niets om te committen of fout bij push.");
  } else {
    console.log("✅ Gecommit en gepusht:\n", stdout);
  }

  // Start nodemon watcher
  exec(
    'nodemon --watch index.html --watch script --ext html,js --exec "echo 🔁 index.html of script gewijzigd!"',
    (err, stdout, stderr) => {
      if (err) {
        console.error("❌ Fout bij starten van nodemon:\n", stderr);
      } else {
        console.log("🚀 Nodemon draait:\n", stdout);
      }
    }
  );
});