-- MySQL dump 10.13  Distrib 8.0.42, for Linux (x86_64)
--
-- Host: 172.21.0.2    Database: db-notification
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Notifications`
--

DROP TABLE IF EXISTS `Notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `message` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL,
  `status` varchar(255) DEFAULT 'unread',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Notifications`
--

LOCK TABLES `Notifications` WRITE;
/*!40000 ALTER TABLE `Notifications` DISABLE KEYS */;
INSERT INTO `Notifications` VALUES (1,2,'Lịch hẹn cho xe 20 AC 33333 vào 00:00 12/12/2025 đã được cập nhật trạng thái từ \"Hoàn thành\" sang \"Đang bảo dưỡng\"','booking_status_update','read','2025-10-24 17:25:18','2025-10-24 17:25:36'),(2,2,'Lịch hẹn cho xe 20 AC 33333 vào 00:00 08/02/2026 đã được cập nhật trạng thái từ \"Đang bảo dưỡng\" sang \"Hoàn thành\"','booking_status_update','read','2025-10-24 17:44:30','2025-10-24 17:49:21'),(3,1,'Có lịch hẹn mới từ khách hàng Khách hàng G cho xe 50 AK 11345 vào 00:00 25/10/2025','booking_new','unread','2025-10-25 03:44:06','2025-10-25 03:44:06'),(4,2,'Lịch hẹn cho xe 24 AK 12345 vào 00:00 30/10/2025 đã được cập nhật trạng thái từ \"Hoàn thành\" sang \"Chờ xác nhận\"','booking_status_update','unread','2025-10-25 03:46:40','2025-10-25 03:46:40'),(5,1,'Có lịch hẹn mới từ khách hàng Khách hàng F cho xe 99 AC 10999 vào 00:00 25/10/2025','booking_new','unread','2025-10-25 03:47:21','2025-10-25 03:47:21'),(6,11,'Lịch hẹn cho xe 50 AK 11345 vào 00:00 25/10/2025 đã được cập nhật trạng thái từ \"Chờ xác nhận\" sang \"Đang bảo dưỡng\"','booking_status_update','unread','2025-10-25 03:48:43','2025-10-25 03:48:43'),(7,1,'Có lịch hẹn mới từ khách hàng Khách hàng G cho xe 19 AC 22111 vào 00:00 25/10/2025','booking_new','unread','2025-10-25 03:52:17','2025-10-25 03:52:17'),(8,1,'Có lịch hẹn mới từ khách hàng Khách hàng W cho xe 12 AB 09876 vào 00:00 26/10/2025','booking_new','unread','2025-10-25 04:26:46','2025-10-25 04:26:46'),(9,1,'Có lịch hẹn mới từ khách hàng Khách hàng K cho xe 18 AH 03512 vào 00:00 26/10/2025','booking_new','unread','2025-10-25 04:28:22','2025-10-25 04:28:22'),(10,14,'Lịch hẹn cho xe 12 AB 09876 vào 00:00 26/10/2025 đã được cập nhật trạng thái từ \"Chờ xác nhận\" sang \"Đang bảo dưỡng\"','booking_status_update','read','2025-10-25 04:33:16','2025-10-25 04:33:37'),(11,11,'Lịch hẹn cho xe 19 AC 22111 vào 00:00 25/10/2025 đã được cập nhật trạng thái từ \"Chờ xác nhận\" sang \"Đang bảo dưỡng\"','booking_status_update','unread','2025-10-25 04:33:33','2025-10-25 04:33:33'),(12,2,'Lịch hẹn cho xe 20 AC 33333 vào 00:00 12/12/2025 đã được cập nhật trạng thái từ \"Đang bảo dưỡng\" sang \"Hoàn thành\"','booking_status_update','unread','2025-10-25 05:00:55','2025-10-25 05:00:55'),(13,2,'Lịch hẹn cho xe 20 AC 33333 vào 00:00 08/02/2026 đã được cập nhật trạng thái từ \"Hoàn thành\" sang \"Đang bảo dưỡng\"','booking_status_update','unread','2025-10-25 05:01:20','2025-10-25 05:01:20'),(14,2,'Lịch hẹn cho xe 29 AC 99999 vào 00:00 01/01/2026 đã được cập nhật trạng thái từ \"Đang bảo dưỡng\" sang \"Hoàn thành\"','booking_status_update','unread','2025-10-25 06:20:24','2025-10-25 06:20:24'),(15,2,'Lịch hẹn cho xe 29 AC 99999 vào 00:00 01/01/2026 đã được cập nhật trạng thái từ \"Hoàn thành\" sang \"Đang bảo dưỡng\"','booking_status_update','unread','2025-10-25 06:34:32','2025-10-25 06:34:32'),(16,2,'Lịch hẹn cho xe 29 AC 99999 vào 00:00 01/01/2026 đã được cập nhật trạng thái từ \"Đang bảo dưỡng\" sang \"Hoàn thành\"','booking_status_update','unread','2025-10-25 06:35:18','2025-10-25 06:35:18'),(17,1,'Có lịch hẹn mới từ khách hàng Khách hàng W cho xe 12 AB 09876 vào 00:00 28/10/2025','booking_new','unread','2025-10-25 07:01:51','2025-10-25 07:01:51'),(18,14,'Lịch hẹn cho xe 12 AB 09876 vào 00:00 28/10/2025 đã được cập nhật trạng thái từ \"Chờ xác nhận\" sang \"Đang bảo dưỡng\"','booking_status_update','unread','2025-10-25 07:02:16','2025-10-25 07:02:16'),(19,1,'Có lịch hẹn mới từ khách hàng Khách hàng W cho xe 12 AB 09876 vào 00:00 30/10/2025','booking_new','unread','2025-10-25 07:06:08','2025-10-25 07:06:08'),(20,14,'Lịch hẹn cho xe 12 AB 09876 vào 00:00 28/10/2025 đã được cập nhật trạng thái từ \"Đang bảo dưỡng\" sang \"Hoàn thành\"','booking_status_update','unread','2025-10-25 07:06:44','2025-10-25 07:06:44');
/*!40000 ALTER TABLE `Notifications` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-25 14:14:11
