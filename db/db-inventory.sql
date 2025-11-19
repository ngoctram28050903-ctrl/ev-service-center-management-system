-- MySQL dump 10.13  Distrib 8.0.42, for Linux (x86_64)
--
-- Host: 172.21.0.2    Database: db-inventory
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
-- Table structure for table `Parts`
--

DROP TABLE IF EXISTS `Parts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Parts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `partNumber` varchar(255) DEFAULT NULL,
  `quantity` int DEFAULT '0',
  `minStock` int DEFAULT '5',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `partNumber` (`partNumber`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Parts`
--

LOCK TABLES `Parts` WRITE;
/*!40000 ALTER TABLE `Parts` DISABLE KEYS */;
INSERT INTO `Parts` VALUES (1,'Xinhan Spirit Beast L27 chính hãng','XNL27',107,10,'2025-10-21 04:04:16','2025-10-22 11:00:17'),(2,'Phuộc RCB C2','071066',2000,100,'2025-10-21 04:04:54','2025-10-24 15:05:48'),(3,'Phụ tùng 1','00001',100,10,'2025-10-22 10:57:23','2025-10-22 10:57:23'),(4,'Phụ tùng 2','00002',2000,100,'2025-10-22 10:57:37','2025-10-22 10:57:37'),(5,'Phụ tùng 3','00003',900,40,'2025-10-22 10:57:52','2025-10-22 10:57:52'),(6,'Phụ tùng 4','00004',10,1,'2025-10-22 10:58:04','2025-10-22 10:58:04'),(7,'Phụ tùng 5','00005',10,0,'2025-10-22 10:58:15','2025-10-22 10:58:15'),(8,'Phụ tùng 6','00006',220,15,'2025-10-22 10:58:30','2025-10-22 10:58:30'),(9,'Phụ tùng 7','00007',150,15,'2025-10-22 10:58:47','2025-10-22 10:58:47'),(10,'Phụ tùng 8','00008',300,10,'2025-10-22 10:59:01','2025-10-22 10:59:01'),(11,'Phụ tùng 9','00009',0,20,'2025-10-22 10:59:19','2025-10-23 04:38:07');
/*!40000 ALTER TABLE `Parts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partsUsages`
--

DROP TABLE IF EXISTS `partsUsages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `partsUsages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `workOrderId` int NOT NULL,
  `quantityUsed` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `partId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `partId` (`partId`),
  CONSTRAINT `partsUsages_ibfk_1` FOREIGN KEY (`partId`) REFERENCES `Parts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partsUsages`
--

LOCK TABLES `partsUsages` WRITE;
/*!40000 ALTER TABLE `partsUsages` DISABLE KEYS */;
/*!40000 ALTER TABLE `partsUsages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stockLogs`
--

DROP TABLE IF EXISTS `stockLogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stockLogs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `changeType` enum('IN','OUT') NOT NULL,
  `quantity` int NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `partId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `partId` (`partId`),
  CONSTRAINT `stockLogs_ibfk_1` FOREIGN KEY (`partId`) REFERENCES `Parts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stockLogs`
--

LOCK TABLES `stockLogs` WRITE;
/*!40000 ALTER TABLE `stockLogs` DISABLE KEYS */;
INSERT INTO `stockLogs` VALUES (1,'IN',100,NULL,'2025-10-21 04:04:16','2025-10-21 04:04:16',1),(2,'IN',2000,NULL,'2025-10-21 04:04:54','2025-10-21 04:04:54',2),(3,'IN',25,'Ok Nhập','2025-10-21 04:05:22','2025-10-21 04:05:22',1),(4,'IN',100,NULL,'2025-10-22 10:57:23','2025-10-22 10:57:23',3),(5,'IN',2000,NULL,'2025-10-22 10:57:37','2025-10-22 10:57:37',4),(6,'IN',900,NULL,'2025-10-22 10:57:52','2025-10-22 10:57:52',5),(7,'IN',10,NULL,'2025-10-22 10:58:04','2025-10-22 10:58:04',6),(8,'IN',10,NULL,'2025-10-22 10:58:15','2025-10-22 10:58:15',7),(9,'IN',220,NULL,'2025-10-22 10:58:30','2025-10-22 10:58:30',8),(10,'IN',150,NULL,'2025-10-22 10:58:47','2025-10-22 10:58:47',9),(11,'IN',300,NULL,'2025-10-22 10:59:01','2025-10-22 10:59:01',10),(12,'IN',600,NULL,'2025-10-22 10:59:19','2025-10-22 10:59:19',11),(13,'OUT',18,'Hết hạn sử dụng','2025-10-22 11:00:17','2025-10-22 11:00:17',1),(14,'IN',100,'Bổ sung thêm phụ tùng ','2025-10-22 11:25:38','2025-10-22 11:25:38',11),(15,'OUT',25,'Bán','2025-10-22 11:25:59','2025-10-22 11:25:59',11),(16,'IN',325,'Nhập hàng','2025-10-22 11:40:46','2025-10-22 11:40:46',11),(17,'OUT',550,'Bán hàng','2025-10-22 11:41:02','2025-10-22 11:41:02',11),(18,'OUT',450,NULL,'2025-10-23 04:38:07','2025-10-23 04:38:07',11);
/*!40000 ALTER TABLE `stockLogs` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-25 14:13:49
