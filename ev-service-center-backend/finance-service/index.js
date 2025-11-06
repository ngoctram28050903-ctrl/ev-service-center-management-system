import app from "./src/app.js";

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`🚀 Finance Service running on port ${PORT}`));
