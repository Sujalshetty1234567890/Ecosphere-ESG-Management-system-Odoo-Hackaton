CREATE DATABASE  IF NOT EXISTS `ecosphere` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `ecosphere`;
-- MySQL dump 10.13  Distrib 8.0.44, for macos15 (arm64)
--
-- Host: localhost    Database: ecosphere
-- ------------------------------------------------------
-- Server version	9.5.0

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
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ 'e2578774-e65f-11f0-94d8-9ae09750ce17:1-87';

--
-- Table structure for table `audits`
--

DROP TABLE IF EXISTS `audits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audits` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `leadAuditorId` varchar(50) NOT NULL,
  `departmentId` varchar(50) NOT NULL,
  `scheduledDate` date NOT NULL,
  `completedDate` date DEFAULT NULL,
  `status` enum('scheduled','in_progress','completed','cancelled') NOT NULL,
  `scope` text NOT NULL,
  `score` double DEFAULT NULL,
  `softDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_audit_department` (`departmentId`),
  KEY `fk_audit_lead` (`leadAuditorId`),
  CONSTRAINT `fk_audit_department` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`),
  CONSTRAINT `fk_audit_lead` FOREIGN KEY (`leadAuditorId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audits`
--

LOCK TABLES `audits` WRITE;
/*!40000 ALTER TABLE `audits` DISABLE KEYS */;
INSERT INTO `audits` VALUES ('audit1','Q2 Environmental Audit','Quarterly ESG audit','user4','dept1','2026-07-10','2026-07-12','completed','Environmental Compliance',91.5,0);
/*!40000 ALTER TABLE `audits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `badges`
--

DROP TABLE IF EXISTS `badges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `badges` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `iconName` varchar(100) NOT NULL,
  `xpThreshold` int NOT NULL,
  `triggerType` enum('carbon_logged','csr_hours','challenges_completed','policies_signed','audit_completed') NOT NULL,
  `softDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `badges`
--

LOCK TABLES `badges` WRITE;
/*!40000 ALTER TABLE `badges` DISABLE KEYS */;
INSERT INTO `badges` VALUES ('badge1','Green Starter','Awarded for completing first sustainability task.','leaf',100,'carbon_logged',0),('badge2','CSR Champion','Awarded for CSR participation.','award',500,'csr_hours',0);
/*!40000 ALTER TABLE `badges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carbonTransactions`
--

DROP TABLE IF EXISTS `carbonTransactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carbonTransactions` (
  `id` varchar(50) NOT NULL,
  `date` datetime NOT NULL,
  `departmentId` varchar(50) NOT NULL,
  `categoryId` varchar(50) NOT NULL,
  `emissionFactorId` varchar(50) NOT NULL,
  `quantity` double NOT NULL,
  `calculatedEmissions` double NOT NULL,
  `recordedById` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `proofUrl` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_ct_department` (`departmentId`),
  KEY `fk_ct_category` (`categoryId`),
  KEY `fk_ct_factor` (`emissionFactorId`),
  KEY `fk_ct_user` (`recordedById`),
  CONSTRAINT `fk_ct_category` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`),
  CONSTRAINT `fk_ct_department` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`),
  CONSTRAINT `fk_ct_factor` FOREIGN KEY (`emissionFactorId`) REFERENCES `emissionFactors` (`id`),
  CONSTRAINT `fk_ct_user` FOREIGN KEY (`recordedById`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carbonTransactions`
--

LOCK TABLES `carbonTransactions` WRITE;
/*!40000 ALTER TABLE `carbonTransactions` DISABLE KEYS */;
INSERT INTO `carbonTransactions` VALUES ('ct1','2026-07-12 09:00:00','dept1','cat1','ef1',1200,984,'user2','Monthly electricity usage',NULL,'approved'),('ct2','2026-07-12 10:30:00','dept2','cat2','ef2',5000,1750,'user3','Water consumption',NULL,'pending');
/*!40000 ALTER TABLE `carbonTransactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `type` enum('environmental','social','governance') NOT NULL,
  `softDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES ('cat1','Electricity','Electricity consumption','environmental',0),('cat2','Water','Water usage','environmental',0),('cat3','CSR','Corporate Social Responsibility','social',0),('cat4','Compliance','Governance policies','governance',0);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `challengeParticipation`
--

DROP TABLE IF EXISTS `challengeParticipation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `challengeParticipation` (
  `id` varchar(50) NOT NULL,
  `userId` varchar(50) NOT NULL,
  `challengeId` varchar(50) NOT NULL,
  `joinedDate` date NOT NULL,
  `progress` double NOT NULL,
  `proofUrl` varchar(255) DEFAULT NULL,
  `status` enum('active','under_review','completed','failed') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_cp_user` (`userId`),
  KEY `fk_cp_challenge` (`challengeId`),
  CONSTRAINT `fk_cp_challenge` FOREIGN KEY (`challengeId`) REFERENCES `challenges` (`id`),
  CONSTRAINT `fk_cp_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `challengeParticipation`
--

LOCK TABLES `challengeParticipation` WRITE;
/*!40000 ALTER TABLE `challengeParticipation` DISABLE KEYS */;
INSERT INTO `challengeParticipation` VALUES ('cp1','user2','ch1','2026-07-16',60,NULL,'active'),('cp2','user3','ch2','2026-08-02',100,NULL,'completed');
/*!40000 ALTER TABLE `challengeParticipation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `challenges`
--

DROP TABLE IF EXISTS `challenges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `challenges` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `xpReward` int NOT NULL,
  `pointsReward` int NOT NULL,
  `category` enum('environmental','social','governance') NOT NULL,
  `startDate` date NOT NULL,
  `endDate` date NOT NULL,
  `status` enum('draft','active','under_review','completed','archived') NOT NULL,
  `softDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `challenges`
--

LOCK TABLES `challenges` WRITE;
/*!40000 ALTER TABLE `challenges` DISABLE KEYS */;
INSERT INTO `challenges` VALUES ('ch1','Cycle To Work','Use a bicycle for commuting',500,250,'environmental','2026-07-15','2026-08-15','active',0),('ch2','Volunteer Week','Complete CSR volunteering',600,300,'social','2026-08-01','2026-08-31','active',0);
/*!40000 ALTER TABLE `challenges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complianceIssues`
--

DROP TABLE IF EXISTS `complianceIssues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complianceIssues` (
  `id` varchar(50) NOT NULL,
  `auditId` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `severity` enum('low','medium','high','critical') NOT NULL,
  `status` enum('open','under_review','resolved','overdue') NOT NULL,
  `assignedToId` varchar(50) NOT NULL,
  `dueDate` date NOT NULL,
  `resolvedAt` datetime DEFAULT NULL,
  `resolutionNotes` text,
  PRIMARY KEY (`id`),
  KEY `fk_ci_audit` (`auditId`),
  KEY `fk_ci_user` (`assignedToId`),
  CONSTRAINT `fk_ci_audit` FOREIGN KEY (`auditId`) REFERENCES `audits` (`id`),
  CONSTRAINT `fk_ci_user` FOREIGN KEY (`assignedToId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complianceIssues`
--

LOCK TABLES `complianceIssues` WRITE;
/*!40000 ALTER TABLE `complianceIssues` DISABLE KEYS */;
INSERT INTO `complianceIssues` VALUES ('issue1','audit1','High Electricity Usage','Consumption exceeded monthly target.','medium','resolved','user3','2026-07-20','2026-07-18 15:00:00','Implemented power-saving schedule.');
/*!40000 ALTER TABLE `complianceIssues` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `csrActivities`
--

DROP TABLE IF EXISTS `csrActivities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `csrActivities` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `date` date NOT NULL,
  `location` varchar(255) NOT NULL,
  `pointsReward` int NOT NULL,
  `xpReward` int NOT NULL,
  `organizerId` varchar(50) NOT NULL,
  `maxParticipants` int NOT NULL,
  `status` enum('planned','completed','cancelled') NOT NULL,
  `approvedByAdmin` tinyint(1) NOT NULL,
  `softDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_csr_organizer` (`organizerId`),
  CONSTRAINT `fk_csr_organizer` FOREIGN KEY (`organizerId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `csrActivities`
--

LOCK TABLES `csrActivities` WRITE;
/*!40000 ALTER TABLE `csrActivities` DISABLE KEYS */;
INSERT INTO `csrActivities` VALUES ('csr1','Beach Cleanup','Community beach cleaning event','2026-08-10','Juhu Beach',100,250,'user1',100,'planned',1,0),('csr2','Tree Plantation','Plant 500 trees','2026-09-05','Sanjay Gandhi National Park',150,300,'user3',80,'planned',1,0);
/*!40000 ALTER TABLE `csrActivities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) NOT NULL,
  `managerId` varchar(50) DEFAULT NULL,
  `headCount` int NOT NULL,
  `targetCarbonLimit` double NOT NULL,
  `createdAt` datetime NOT NULL,
  `softDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_departments_manager` (`managerId`),
  CONSTRAINT `fk_departments_manager` FOREIGN KEY (`managerId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES ('dept1','Engineering','ENG','user1',50,1000,'2026-07-12 12:00:00',0),('dept2','Human Resources','HR','user3',20,300,'2026-07-12 12:00:00',0),('dept3','Finance','FIN','user4',25,400,'2026-07-12 12:00:00',0);
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departmentScores`
--

DROP TABLE IF EXISTS `departmentScores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departmentScores` (
  `id` varchar(50) NOT NULL,
  `departmentId` varchar(50) NOT NULL,
  `environmentalScore` double NOT NULL,
  `socialScore` double NOT NULL,
  `governanceScore` double NOT NULL,
  `overallScore` double NOT NULL,
  `lastUpdated` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_ds_department` (`departmentId`),
  CONSTRAINT `fk_ds_department` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departmentScores`
--

LOCK TABLES `departmentScores` WRITE;
/*!40000 ALTER TABLE `departmentScores` DISABLE KEYS */;
INSERT INTO `departmentScores` VALUES ('score1','dept1',85,78,92,85,'2026-07-12 00:00:00'),('score2','dept2',80,90,88,86,'2026-07-12 00:00:00');
/*!40000 ALTER TABLE `departmentScores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emissionFactors`
--

DROP TABLE IF EXISTS `emissionFactors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emissionFactors` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `factor` double NOT NULL,
  `unit` varchar(50) NOT NULL,
  `categoryId` varchar(50) NOT NULL,
  `active` tinyint(1) NOT NULL,
  `softDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_emissionFactors_category` (`categoryId`),
  CONSTRAINT `fk_emissionFactors_category` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emissionFactors`
--

LOCK TABLES `emissionFactors` WRITE;
/*!40000 ALTER TABLE `emissionFactors` DISABLE KEYS */;
INSERT INTO `emissionFactors` VALUES ('ef1','Electricity Grid',0.82,'kWh','cat1',1,0),('ef2','Water Usage',0.35,'Litre','cat2',1,0);
/*!40000 ALTER TABLE `emissionFactors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employeeParticipation`
--

DROP TABLE IF EXISTS `employeeParticipation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employeeParticipation` (
  `id` varchar(50) NOT NULL,
  `userId` varchar(50) NOT NULL,
  `csrActivityId` varchar(50) NOT NULL,
  `participationDate` date NOT NULL,
  `hoursLogged` double NOT NULL,
  `proofUrl` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL,
  `xpEarned` int NOT NULL,
  `pointsEarned` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_ep_user` (`userId`),
  KEY `fk_ep_activity` (`csrActivityId`),
  CONSTRAINT `fk_ep_activity` FOREIGN KEY (`csrActivityId`) REFERENCES `csrActivities` (`id`),
  CONSTRAINT `fk_ep_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employeeParticipation`
--

LOCK TABLES `employeeParticipation` WRITE;
/*!40000 ALTER TABLE `employeeParticipation` DISABLE KEYS */;
INSERT INTO `employeeParticipation` VALUES ('ep1','user2','csr1','2026-08-10',4,NULL,'approved',250,100),('ep2','user3','csr2','2026-09-05',5,NULL,'approved',300,150);
/*!40000 ALTER TABLE `employeeParticipation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `environmentalGoals`
--

DROP TABLE IF EXISTS `environmentalGoals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `environmentalGoals` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `targetValue` double NOT NULL,
  `currentValue` double NOT NULL,
  `unit` varchar(50) NOT NULL,
  `categoryId` varchar(50) NOT NULL,
  `departmentId` varchar(50) NOT NULL,
  `startDate` date NOT NULL,
  `endDate` date NOT NULL,
  `status` enum('active','achieved','missed') NOT NULL,
  `softDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_goal_department` (`departmentId`),
  KEY `fk_goal_category` (`categoryId`),
  CONSTRAINT `fk_goal_category` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`),
  CONSTRAINT `fk_goal_department` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `environmentalGoals`
--

LOCK TABLES `environmentalGoals` WRITE;
/*!40000 ALTER TABLE `environmentalGoals` DISABLE KEYS */;
INSERT INTO `environmentalGoals` VALUES ('goal1','Reduce Electricity Usage','Reduce office electricity consumption by 20%',20,8,'Percent','cat1','dept1','2026-01-01','2026-12-31','active',0),('goal2','Reduce Water Usage','Reduce water consumption by 15%',15,5,'Percent','cat2','dept2','2026-01-01','2026-12-31','active',0);
/*!40000 ALTER TABLE `environmentalGoals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` varchar(50) NOT NULL,
  `userId` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('badge','challenge','policy','compliance','system','reward') NOT NULL,
  `read` tinyint(1) NOT NULL,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_notification_user` (`userId`),
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES ('not1','user2','Challenge Joined','You have successfully joined Cycle To Work.','challenge',0,'2026-07-12 13:00:00'),('not2','user3','Badge Earned','Congratulations! You earned the CSR Champion badge.','badge',1,'2026-07-12 13:30:00');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organizationSettings`
--

DROP TABLE IF EXISTS `organizationSettings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organizationSettings` (
  `companyName` varchar(255) NOT NULL,
  `environmentalWeight` double NOT NULL,
  `socialWeight` double NOT NULL,
  `governanceWeight` double NOT NULL,
  `lastUpdated` datetime NOT NULL,
  PRIMARY KEY (`companyName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organizationSettings`
--

LOCK TABLES `organizationSettings` WRITE;
/*!40000 ALTER TABLE `organizationSettings` DISABLE KEYS */;
INSERT INTO `organizationSettings` VALUES ('Ecosphere ESG',0.4,0.3,0.3,'2026-07-12 00:00:00');
/*!40000 ALTER TABLE `organizationSettings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `policies`
--

DROP TABLE IF EXISTS `policies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `policies` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `categoryId` varchar(50) NOT NULL,
  `effectiveDate` date NOT NULL,
  `version` varchar(50) NOT NULL,
  `status` enum('active','archived') NOT NULL,
  `softDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_policy_category` (`categoryId`),
  CONSTRAINT `fk_policy_category` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `policies`
--

LOCK TABLES `policies` WRITE;
/*!40000 ALTER TABLE `policies` DISABLE KEYS */;
INSERT INTO `policies` VALUES ('pol1','Energy Conservation Policy','Guidelines for reducing electricity usage','cat1','2026-01-01','1.0','active',0),('pol2','CSR Participation Policy','Guidelines for CSR activities','cat3','2026-01-15','1.0','active',0);
/*!40000 ALTER TABLE `policies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `policyAcknowledgements`
--

DROP TABLE IF EXISTS `policyAcknowledgements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `policyAcknowledgements` (
  `id` varchar(50) NOT NULL,
  `userId` varchar(50) NOT NULL,
  `policyId` varchar(50) NOT NULL,
  `acknowledgedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_pa_user` (`userId`),
  KEY `fk_pa_policy` (`policyId`),
  CONSTRAINT `fk_pa_policy` FOREIGN KEY (`policyId`) REFERENCES `policies` (`id`),
  CONSTRAINT `fk_pa_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `policyAcknowledgements`
--

LOCK TABLES `policyAcknowledgements` WRITE;
/*!40000 ALTER TABLE `policyAcknowledgements` DISABLE KEYS */;
INSERT INTO `policyAcknowledgements` VALUES ('pa1','user2','pol1','2026-07-01 09:00:00'),('pa2','user3','pol2','2026-07-02 10:00:00');
/*!40000 ALTER TABLE `policyAcknowledgements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rewardRedemptions`
--

DROP TABLE IF EXISTS `rewardRedemptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rewardRedemptions` (
  `id` varchar(50) NOT NULL,
  `userId` varchar(50) NOT NULL,
  `rewardId` varchar(50) NOT NULL,
  `redeemedAt` datetime NOT NULL,
  `status` enum('pending','delivered','cancelled') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_rr_user` (`userId`),
  KEY `fk_rr_reward` (`rewardId`),
  CONSTRAINT `fk_rr_reward` FOREIGN KEY (`rewardId`) REFERENCES `rewards` (`id`),
  CONSTRAINT `fk_rr_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rewardRedemptions`
--

LOCK TABLES `rewardRedemptions` WRITE;
/*!40000 ALTER TABLE `rewardRedemptions` DISABLE KEYS */;
INSERT INTO `rewardRedemptions` VALUES ('rr1','user2','reward1','2026-07-12 14:00:00','delivered');
/*!40000 ALTER TABLE `rewardRedemptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rewards`
--

DROP TABLE IF EXISTS `rewards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rewards` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `costPoints` int NOT NULL,
  `stock` int NOT NULL,
  `active` tinyint(1) NOT NULL,
  `softDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rewards`
--

LOCK TABLES `rewards` WRITE;
/*!40000 ALTER TABLE `rewards` DISABLE KEYS */;
INSERT INTO `rewards` VALUES ('reward1','Coffee Voucher','₹200 Coffee Voucher',200,50,1,0),('reward2','Amazon Gift Card','₹500 Amazon Gift Card',500,20,1,0);
/*!40000 ALTER TABLE `rewards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userBadges`
--

DROP TABLE IF EXISTS `userBadges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userBadges` (
  `id` varchar(50) NOT NULL,
  `userId` varchar(50) NOT NULL,
  `badgeId` varchar(50) NOT NULL,
  `unlockedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_ub_user` (`userId`),
  KEY `fk_ub_badge` (`badgeId`),
  CONSTRAINT `fk_ub_badge` FOREIGN KEY (`badgeId`) REFERENCES `badges` (`id`),
  CONSTRAINT `fk_ub_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userBadges`
--

LOCK TABLES `userBadges` WRITE;
/*!40000 ALTER TABLE `userBadges` DISABLE KEYS */;
INSERT INTO `userBadges` VALUES ('ub1','user2','badge1','2026-07-12 12:00:00'),('ub2','user3','badge2','2026-07-12 12:00:00');
/*!40000 ALTER TABLE `userBadges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `role` enum('admin','dept_head','employee','auditor') NOT NULL,
  `departmentId` varchar(50) DEFAULT NULL,
  `xp` int NOT NULL,
  `balancePoints` int NOT NULL,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_users_department` (`departmentId`),
  CONSTRAINT `fk_users_department` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('user1','admin@ecosphere.com','Admin User','admin','dept1',5000,1000,'2026-07-12 12:00:00'),('user2','john@ecosphere.com','John Doe','employee','dept1',300,120,'2026-07-12 12:00:00'),('user3','jane@ecosphere.com','Jane Smith','dept_head','dept2',1200,500,'2026-07-12 12:00:00'),('user4','audit@ecosphere.com','Audit Lead','auditor','dept3',700,300,'2026-07-12 12:00:00');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-12 13:35:34
