import app from './src/app.js';

const PORT = process.env.PORT || 5007;
app.listen(PORT, () => console.log(`🚀 WorkOrder Service running on port ${PORT}`));
