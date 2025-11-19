-- MySQL dump 10.13  Distrib 8.0.42, for Linux (x86_64)
--
-- Host: 172.21.0.2    Database: db-workorder
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
-- Table structure for table `ChecklistItems`
--

DROP TABLE IF EXISTS `ChecklistItems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ChecklistItems` (
  `id` int NOT NULL AUTO_INCREMENT,
  `workOrderId` int NOT NULL,
  `assignedToUserId` int DEFAULT NULL,
  `price` float NOT NULL DEFAULT '0',
  `task` varchar(255) NOT NULL,
  `completed` tinyint(1) DEFAULT '0',
  `assignedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `workOrderId` (`workOrderId`),
  CONSTRAINT `ChecklistItems_ibfk_1` FOREIGN KEY (`workOrderId`) REFERENCES `WorkOrders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ChecklistItems`
--

LOCK TABLES `ChecklistItems` WRITE;
/*!40000 ALTER TABLE `ChecklistItems` DISABLE KEYS */;
INSERT INTO `ChecklistItems` VALUES (1,1,0,100000,'Rửa xe',1,NULL,'2025-10-22 06:54:34','2025-10-22 07:43:38'),(2,1,0,500000,'Thay dầu',1,NULL,'2025-10-22 06:54:34','2025-10-22 07:46:49'),(3,2,0,2000000,'Thay 4 lốp',1,NULL,'2025-10-22 07:56:46','2025-10-22 07:57:05'),(4,2,0,0,'Rửa xe',1,NULL,'2025-10-22 07:56:46','2025-10-22 07:58:13'),(5,2,0,200000,'Thay dầu',0,NULL,'2025-10-22 07:56:46','2025-10-22 07:56:46'),(6,2,0,200000,'Vệ sinh khử mùi',0,NULL,'2025-10-22 07:56:46','2025-10-22 07:56:46'),(7,2,0,0,'Chỉnh lại thước lái',0,NULL,'2025-10-22 07:56:46','2025-10-22 07:56:46'),(8,3,1,0,'Kiểm tra toàn xe',1,'2025-10-24 16:23:28','2025-10-22 11:28:27','2025-10-24 16:23:28'),(9,3,6,1000000,'Thay thước lái',1,'2025-10-24 16:37:40','2025-10-22 11:28:27','2025-10-24 16:37:40'),(10,3,NULL,2000000,'Thay 4 lốp ',0,NULL,'2025-10-22 11:28:27','2025-10-22 11:28:27'),(11,4,6,1500000,'Thay dầu',0,'2025-10-25 04:34:24','2025-10-22 11:43:04','2025-10-25 04:34:25'),(12,4,6,2000000,'Thay lốp',0,'2025-10-24 15:57:46','2025-10-22 11:43:04','2025-10-24 15:57:46'),(13,4,7,100000,'Chỉnh thước lái',1,'2025-10-24 15:59:24','2025-10-22 11:43:04','2025-10-24 16:02:35'),(14,5,7,500000,'Thay dầu',1,'2025-10-25 07:03:36','2025-10-25 07:03:13','2025-10-25 07:04:02'),(15,5,7,1200000,'Thay lốp',1,'2025-10-25 07:04:31','2025-10-25 07:03:13','2025-10-25 07:05:01');
/*!40000 ALTER TABLE `ChecklistItems` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `WorkOrders`
--

DROP TABLE IF EXISTS `WorkOrders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `WorkOrders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `status` varchar(255) DEFAULT 'pending',
  `appointmentId` int NOT NULL,
  `dueDate` datetime DEFAULT NULL,
  `totalPrice` float NOT NULL DEFAULT '0',
  `createdById` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `WorkOrders`
--

LOCK TABLES `WorkOrders` WRITE;
/*!40000 ALTER TABLE `WorkOrders` DISABLE KEYS */;
INSERT INTO `WorkOrders` VALUES (1,'Phiếu dịch vụ - Người dùng A','Bảo dưỡng xe định kỳ ','in_progress',1,'2026-01-01 00:00:00',600000,3,'2025-10-22 06:54:34','2025-10-25 06:34:53'),(2,'Phiếu dịch vụ - Người dùng A','Tư vấn sửa xe, thay thế phụ tùng','pending',2,'2025-10-22 00:00:00',2000000,3,'2025-10-22 07:56:46','2025-10-22 07:58:13'),(3,'Phiếu dịch vụ - Khách hàng A','Kiểm tra xe','pending',3,'2026-08-02 00:00:00',1000000,3,'2025-10-22 11:28:27','2025-10-22 11:29:40'),(4,'Phiếu dịch vụ - Khách hàng A','Kiểm tra xe','completed',4,'2025-12-12 00:00:00',100000,3,'2025-10-22 11:43:04','2025-10-25 03:58:49'),(5,'Phiếu dịch vụ - Khách hàng W','','pending',10,'2025-10-28 00:00:00',1700000,3,'2025-10-25 07:03:13','2025-10-25 07:05:01');
/*!40000 ALTER TABLE `WorkOrders` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-25 14:15:05
