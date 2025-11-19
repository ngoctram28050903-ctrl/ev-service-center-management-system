import app from './src/app.js';

const PORT = process.env.PORT || 5006;
app.listen(PORT, () => console.log(`🚀 Vehicle Service running on port ${PORT}`));
