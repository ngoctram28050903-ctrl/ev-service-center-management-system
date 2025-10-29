import app from "./src/app.js";

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => console.log(`🚀 Inventory Service running on port ${PORT}`));
