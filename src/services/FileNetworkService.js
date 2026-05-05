const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

class FileNetworkService {
  static smbHost = process.env.SMB_HOST;
  static smbUser = process.env.SMB_USER;
  static smbPass = process.env.SMB_PASS;

  /**
   * 🔐 Verificar conexión SMB
   */
  static async testConnection() {
    return new Promise((resolve, reject) => {
      const cmd = `smbclient ${this.smbHost} -U "${this.smbUser}%${this.smbPass}" -c "ls"`;

      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error("❌ Error SMB:", stderr);
          return reject(error);
        }
        console.log("✅ Conexión SMB OK");
        resolve(true);
      });
    });
  }

  /**
   * 📁 Crear carpeta en CTERA
   */
  static async createDirectoryRecursive(remotePath) {
    const parts = remotePath.split("/");
    let currentPath = "";

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      await new Promise((resolve) => {
        const cmd = `smbclient ${this.smbHost} -U "${this.smbUser}%${this.smbPass}" -c "mkdir \\"${currentPath}\\""`;

        exec(cmd, () => {
          // ignoramos error (puede existir)
          resolve();
        });
      });
    }
  }
  /**
   * 📤 Subir archivo a CTERA
   */
  static async uploadFile(localPath, remotePath) {
    return new Promise((resolve, reject) => {
      const cmd = `smbclient ${this.smbHost} -U "${this.smbUser}%${this.smbPass}" -c "put \\"${localPath}\\" \\"${remotePath}\\""`;

      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error("❌ Error subiendo archivo:", stderr);
          return reject(error);
        }
        resolve(true);
      });
    });
  }

  /**
   * 💾 Guardar archivo (genérico)
   */
  static async saveFile(
    requestId,
    conversacionId,
    buffer,
    raiz,
    subPath,
    tipo,
    fileName,
  ) {
    try {
      // 🔹 carpeta final
      const remoteDir = `${raiz}/${subPath}`;

      // 🔹 nombre final (evitar colisiones)
      const finalName = `${Date.now()}_${fileName}`;

      const remoteFullPath = `${remoteDir}/${finalName}`;

      // 🔹 archivo temporal local
      const tempPath = path.join(os.tmpdir(), finalName);

      fs.writeFileSync(tempPath, buffer);

      // 🔹 crear carpeta (intenta)
      await this.createDirectoryRecursive(remoteDir);

      // 🔹 subir archivo
      await this.uploadFile(tempPath, remoteFullPath);

      // 🔹 eliminar temporal
      fs.unlinkSync(tempPath);

      console.log("📁 Archivo subido a CTERA:", remoteFullPath);

      return {
        success: true,
        path: `${this.smbHost}/${remoteFullPath}`, // ← esto guardas en DB
        fileName: finalName,
      };
    } catch (error) {
      console.error("❌ Error en saveFile:", error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

module.exports = FileNetworkService;
