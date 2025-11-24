import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSy...", // Thay bằng key của bạn lấy từ Console
  authDomain: "ev-service-center.firebaseapp.com",
  projectId: "center-service-ev562",
  storageBucket: "ev-service-center.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

console.log("🔥 Đang kết nối tới Project ID:", firebaseConfig.projectId);
// Singleton pattern để tránh khởi tạo lại nhiều lần trong Next.js
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };