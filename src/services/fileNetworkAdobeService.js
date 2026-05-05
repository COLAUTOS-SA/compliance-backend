const FileNetworkService = require("./FileNetworkService");

class FileNetworkAdobeService {
  /**
   * 📄 Guardar PDF firmado de Adobe
   */
  static async saveSignedPDF(idSolicitud, pdfBuffer) {
    try {
      const result = await FileNetworkService.saveFile(
        idSolicitud, // requestId
        idSolicitud, // conversacionId

        pdfBuffer,

        "compliance", // raíz lógica
        `SOLICITUD_${idSolicitud}/FORMULARIO`, // 🔥 carpeta dinámica

        "formulario",
        `formulario_${idSolicitud}.pdf`,
      );

      if (!result.success) {
        throw new Error(result.message);
      }

      return {
        pdfUrl: result.path,
        fileName: result.fileName,
      };
    } catch (error) {
      console.error("❌ Error guardando PDF en CTERA:", error.message);
      throw error;
    }
  }

  /**
   * 📎 Guardar archivos adjuntos (PDF, Excel, Word, etc.)
   */
  static async saveAttachment(idSolicitud, fileBuffer, nombreOriginal) {
    try {
      const result = await FileNetworkService.saveFile(
        idSolicitud,
        idSolicitud,

        fileBuffer,

        "compliance",
        `SOLICITUD_${idSolicitud}/ADJUNTOS`, // 🔥 carpeta adjuntos

        "adjunto",
        nombreOriginal,
      );

      if (!result.success) {
        throw new Error(result.message);
      }

      return {
        fileUrl: result.path,
        fileName: result.fileName,
      };
    } catch (error) {
      console.error("❌ Error guardando adjunto en CTERA:", error.message);
      throw error;
    }
  }
}

module.exports = FileNetworkAdobeService;
