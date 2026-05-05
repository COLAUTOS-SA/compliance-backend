const express = require("express");
const router = express.Router();
const fs = require("fs");

const { exec } = require("child_process");
const pathLib = require("path");

router.get("/download", async (req, res) => {
  try {
    const { path, name } = req.query;

    if (!path) {
      return res.status(400).json({ error: "Path requerido" });
    }

    const tmpFile = `/tmp/${Date.now()}_${name || "archivo.pdf"}`;

    const smbPath = path.replace("//192.168.1.13/vol1-usuarios/", "");

    const command = `smbclient //192.168.1.13/vol1-usuarios -U "escaner%compartido1" -c "get \\"${smbPath}\\" \\"${tmpFile}\\""`;

    exec(command, (error) => {
      if (error) {
        console.error("❌ Error descargando desde CTERA:", error);
        return res.status(500).json({ error: "Error leyendo archivo" });
      }

      res.download(tmpFile, name, (err) => {
        if (err) console.error(err);

        // 🧹 borrar archivo temporal
        fs.unlink(tmpFile, () => {});
      });
    });
  } catch (err) {
    console.error("DOWNLOAD ERROR:", err);
    res.status(500).json({ error: "Error descargando archivo" });
  }
});


module.exports = router;
