import dotenv from "dotenv"
import app from "./src/app.js"

dotenv.config()
const PORT = process.env.PORT || 5001;

app.litsen(PORT, ()=> {
    console.log(`Auth Service running on port ${PORT}`)
});
