const express = require("express");

const usuariosRoutes = require("./usuariosRoutes");
const rolRoutes = require("./rolRoutes");
const tipoContraparteRoutes = require("./tipoContraparteRoutes");
const contraparteRoutes = require("./contraparteRoutes");
const solicitudRoutes = require("./solicitudRoutes");
const archivosRoutes = require("./archivosRoutes");
const estadoArchivoRoutes = require("./estadoArchivoRoutes");
const conceptoRoutes = require("./conceptoRoutes");
const accionistasRoutes = require("./accionistasRoutes");
const segmentoRoutes = require("./segmentoRoutes");
const adobeRoutes = require("./adobeRoutes");
const filesRoutes = require("./filesRoutes");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ status: "SAGRILAF API OK" });
});

router.use("/usuarios", usuariosRoutes);
router.use("/roles", rolRoutes);
router.use("/tipos-contraparte", tipoContraparteRoutes);
router.use("/contrapartes", contraparteRoutes);
router.use("/solicitudes", solicitudRoutes);
router.use("/archivos", archivosRoutes);
router.use("/estado-archivo", estadoArchivoRoutes);
router.use("/conceptos", conceptoRoutes);
router.use("/accionistas", accionistasRoutes);
router.use("/segmentos", segmentoRoutes);
router.use("/adobe", adobeRoutes);
router.use("/files", filesRoutes);

module.exports = router;
