-- MySQL dump 10.13  Distrib 8.0.42, for Linux (x86_64)
--
-- Host: 172.21.0.2    Database: db-booking
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
-- Table structure for table `Appointments`
--

DROP TABLE IF EXISTS `Appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Appointments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `serviceCenterId` int NOT NULL,
  `vehicleId` int DEFAULT NULL,
  `date` datetime NOT NULL,
  `timeSlot` varchar(255) NOT NULL,
  `status` varchar(255) DEFAULT 'pending',
  `notes` varchar(255) DEFAULT NULL,
  `createdById` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `serviceCenterId` (`serviceCenterId`),
  CONSTRAINT `Appointments_ibfk_1` FOREIGN KEY (`serviceCenterId`) REFERENCES `ServiceCenters` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Appointments`
--

LOCK TABLES `Appointments` WRITE;
/*!40000 ALTER TABLE `Appointments` DISABLE KEYS */;
INSERT INTO `Appointments` VALUES (1,2,1,1,'2026-01-01 00:00:00','08:00','completed','Bảo dưỡng xe định kỳ ',3,'2025-10-22 04:07:32','2025-10-25 06:35:17'),(2,2,2,2,'2025-10-30 00:00:00','08:00','pending','Tư vấn sửa xe, thay thế phụ tùng',3,'2025-10-22 07:54:30','2025-10-25 03:46:40'),(3,2,2,13,'2026-02-08 00:00:00','14:00','confirmed','Kiểm tra xe',3,'2025-10-22 11:27:06','2025-10-25 05:01:20'),(4,2,2,13,'2025-12-12 00:00:00','10:00','completed','Kiểm tra xe',3,'2025-10-22 11:41:56','2025-10-25 05:00:55'),(5,11,12,11,'2025-10-25 00:00:00','10:00','confirmed','Sửa xe',11,'2025-10-25 03:44:05','2025-10-25 03:48:43'),(7,11,1,12,'2025-10-25 00:00:00','13:00','confirmed','',11,'2025-10-25 03:52:17','2025-10-25 04:33:32'),(8,14,5,15,'2025-10-26 00:00:00','14:00','confirmed','',14,'2025-10-25 04:26:46','2025-10-25 04:33:16'),(9,13,8,14,'2025-10-26 00:00:00','10:00','pending','',13,'2025-10-25 04:28:22','2025-10-25 04:28:22'),(10,14,10,15,'2025-10-28 00:00:00','','completed','',14,'2025-10-25 07:01:51','2025-10-25 07:06:44'),(11,14,12,15,'2025-10-30 00:00:00','','pending','',14,'2025-10-25 07:06:08','2025-10-25 07:06:08');
/*!40000 ALTER TABLE `Appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ServiceCenters`
--

DROP TABLE IF EXISTS `ServiceCenters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ServiceCenters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ServiceCenters`
--

LOCK TABLES `ServiceCenters` WRITE;
/*!40000 ALTER TABLE `ServiceCenters` DISABLE KEYS */;
INSERT INTO `ServiceCenters` VALUES (1,'Trung tâm A','Hà Nội','0981248922','trungtama@gmail.com','2025-10-22 04:07:00','2025-10-22 04:07:00'),(2,'Trung tâm B','Đà Nẵng','0123456780','trungtamb@gmail.com','2025-10-22 07:53:45','2025-10-22 07:53:45'),(3,'Trung tâm A1','Hà Nội','0981248922','trungtama@gmail.com','2025-10-22 04:07:00','2025-10-22 04:07:00'),(4,'Trung tâm B1','Đà Nẵng','0123456780','trungtamb@gmail.com','2025-10-22 07:53:45','2025-10-22 07:53:45'),(5,'Trung tâm A2','Hà Nội','0981248922','trungtama@gmail.com','2025-10-22 04:07:00','2025-10-22 04:07:00'),(6,'Trung tâm B2','Đà Nẵng','0123456780','trungtamb@gmail.com','2025-10-22 07:53:45','2025-10-22 07:53:45'),(7,'Trung tâm A3','Hà Nội','0981248922','trungtama@gmail.com','2025-10-22 04:07:00','2025-10-22 04:07:00'),(8,'Trung tâm B3','Đà Nẵng','0123456780','trungtamb@gmail.com','2025-10-22 07:53:45','2025-10-22 07:53:45'),(9,'Trung tâm A4','Hà Nội','0981248922','trungtama@gmail.com','2025-10-22 04:07:00','2025-10-22 04:07:00'),(10,'Trung tâm B4','Đà Nẵng','0123456780','trungtamb@gmail.com','2025-10-22 07:53:45','2025-10-22 07:53:45'),(11,'Trung tâm A5','Hà Nội','0981248922','trungtama@gmail.com','2025-10-22 04:07:00','2025-10-22 04:07:00'),(12,'Trung tâm B5','Đà Nẵng','0123456780','trungtamb@gmail.com','2025-10-22 07:53:45','2025-10-22 07:53:45');
/*!40000 ALTER TABLE `ServiceCenters` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-25 14:12:43
