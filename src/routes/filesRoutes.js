const express = require("express");
const fs = require("fs");
const os = require("os");
const pathLib = require("path");
const { exec } = require("child_process");

const router = express.Router();

const smbHost = process.env.SMB_HOST || "//192.168.1.13/vol1-usuarios";
const smbUser = process.env.SMB_USER || "escaner";
const smbPass = process.env.SMB_PASS || "compartido1";

function sanitizeFileName(value, fallback = "archivo") {
  const raw = String(value || fallback).split(/[\\/]/).pop();
  return raw.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim() || fallback;
}

function getRemotePath(fullPath) {
  const normalizedHost = smbHost.replace(/\/$/, "");
  const normalizedPath = String(fullPath || "");

  if (normalizedPath.startsWith(`${normalizedHost}/`)) {
    return normalizedPath.slice(normalizedHost.length + 1);
  }

  return normalizedPath.replace(/^\/+/, "");
}

function getDownloadName({ requestedName, remotePath }) {
  const requested = sanitizeFileName(requestedName || "");
  if (requested && pathLib.extname(requested)) return requested;

  const fromPath = sanitizeFileName(remotePath);
  if (fromPath && pathLib.extname(fromPath)) return fromPath;

  return requested || fromPath || "archivo";
}

router.get("/download", async (req, res) => {
  try {
    const { path, name } = req.query;

    if (!path) {
      return res.status(400).json({ error: "Path requerido" });
    }

    const smbPath = getRemotePath(path);
    const downloadName = getDownloadName({
      requestedName: name,
      remotePath: smbPath,
    });
    const tmpFile = pathLib.join(os.tmpdir(), `${Date.now()}_${downloadName}`);

    const command = `smbclient ${smbHost} -U "${smbUser}%${smbPass}" -c "get \\"${smbPath}\\" \\"${tmpFile}\\""`;

    exec(command, (error) => {
      if (error) {
        console.error("Error descargando desde CTERA:", error);
        return res.status(500).json({ error: "Error leyendo archivo" });
      }

      return res.download(tmpFile, downloadName, (err) => {
        if (err) console.error(err);
        fs.unlink(tmpFile, () => {});
      });
    });
  } catch (err) {
    console.error("DOWNLOAD ERROR:", err);
    return res.status(500).json({ error: "Error descargando archivo" });
  }
});

module.exports = router;
