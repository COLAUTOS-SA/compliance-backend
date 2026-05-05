const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const pool = require("./config/db"); // ajusta la ruta según tu estructura
const apiRoutes = require("./routes");


const app = express();
const PORT = process.env.PORT || 3001;
const enableRootApiFallback = (process.env.API_PREFIX_FALLBACK || "true").toLowerCase() === "true";

app.use(cors());
app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Rutas API principales con prefijo /api
app.use("/api", apiRoutes);

// Compatibilidad temporal: soporta proxies que recortan /api antes de llegar a Node
if (enableRootApiFallback) {
  app.use("/", apiRoutes);
}

const storagePath = process.env.STORAGE_PATH || path.join(process.cwd(), "uploads", "adobe");
app.use("/uploads/adobe", express.static(storagePath));

app.get("/db-health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS result");
    res.json({ success: true, db: "OK", result: rows[0].result });
  } catch (err) {
    console.error("DB health error:", err);
    res.status(500).json({ success: false, db: "ERROR", message: err.message });
  }
});

// Middleware de error "por si acaso"
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res
    .status(500)
    .json({ success: false, message: "Error interno del servidor" });
});

app.listen(PORT, () => {
  console.log(`SAGRILAF API escuchando en puerto ${PORT}`);
});
