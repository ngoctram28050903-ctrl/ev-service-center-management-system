-- MySQL dump 10.13  Distrib 8.0.42, for Linux (x86_64)
--
-- Host: 172.21.0.2    Database: db-vehicle
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
-- Table structure for table `Reminders`
--

DROP TABLE IF EXISTS `Reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Reminders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vehicleId` int NOT NULL,
  `message` varchar(255) NOT NULL,
  `date` datetime NOT NULL,
  `completed` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `vehicleId` (`vehicleId`),
  CONSTRAINT `Reminders_ibfk_1` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Reminders`
--

LOCK TABLES `Reminders` WRITE;
/*!40000 ALTER TABLE `Reminders` DISABLE KEYS */;
INSERT INTO `Reminders` VALUES (1,1,'Thay nhớt lần 1','2025-11-11 00:00:00',0,'2025-10-21 07:57:05','2025-10-21 07:57:05'),(2,13,'Thay dầu máy','2025-10-25 00:00:00',0,'2025-10-22 11:24:57','2025-10-22 11:24:57'),(3,13,'Rửa xe','2025-11-11 00:00:00',0,'2025-10-22 11:38:33','2025-10-22 11:38:33'),(4,13,'Thay lốp xe','2025-12-12 00:00:00',0,'2025-10-22 11:39:59','2025-10-22 11:39:59');
/*!40000 ALTER TABLE `Reminders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Vehicles`
--

DROP TABLE IF EXISTS `Vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Vehicles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `licensePlate` varchar(255) NOT NULL,
  `brand` varchar(255) NOT NULL,
  `model` varchar(255) DEFAULT NULL,
  `year` int DEFAULT NULL,
  `userId` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `licensePlate` (`licensePlate`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Vehicles`
--

LOCK TABLES `Vehicles` WRITE;
/*!40000 ALTER TABLE `Vehicles` DISABLE KEYS */;
INSERT INTO `Vehicles` VALUES (1,'29 AC 99999','Honda','CRV',2025,2,'2025-10-21 03:40:22','2025-10-21 03:40:22'),(2,'24 AK 12345','Honda','Civic',2025,2,'2025-10-22 02:51:58','2025-10-22 02:51:58'),(3,'29 AC 11111','Toyota','Camry',2025,9,'2025-10-22 08:55:40','2025-10-22 08:55:40'),(4,'49 AC 49999','Honda','CRB',2025,10,'2025-10-21 03:40:22','2025-10-21 03:40:22'),(5,'50 AK 52345','Honda','Vios',2025,2,'2025-10-22 02:51:58','2025-10-22 02:51:58'),(6,'69 AC 11111','Toyota','Fortuner',2025,9,'2025-10-22 08:55:40','2025-10-22 08:55:40'),(7,'29 AC 94599','Honda','CRV',2025,2,'2025-10-21 03:40:22','2025-10-21 03:40:22'),(8,'20 AK 82345','Honda','Civic',2025,2,'2025-10-22 02:51:58','2025-10-22 02:51:58'),(9,'29 AC 91111','Toyota','Camry',2025,11,'2025-10-22 08:55:40','2025-10-22 08:55:40'),(10,'99 AC 10999','Honda','CRB',2025,10,'2025-10-21 03:40:22','2025-10-21 03:40:22'),(11,'50 AK 11345','Honda','Vios',2025,11,'2025-10-22 02:51:58','2025-10-22 02:51:58'),(12,'19 AC 22111','Toyota','Fortuner',2025,11,'2025-10-22 08:55:40','2025-10-22 08:55:40'),(13,'20 AC 33333','Toyota','Fortuner',2025,2,'2025-10-22 11:24:36','2025-10-24 14:42:36'),(14,'18 AH 03512','Honda','SH 125i',2025,13,'2025-10-25 04:11:16','2025-10-25 04:11:16'),(15,'12 AB 09876','Honda','Vision Sport',2025,14,'2025-10-25 04:21:27','2025-10-25 04:21:27');
/*!40000 ALTER TABLE `Vehicles` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-25 14:14:38
