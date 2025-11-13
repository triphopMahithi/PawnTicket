-- สร้าง DB + ตั้งค่า charset/collation
CREATE DATABASE IF NOT EXISTS project
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

USE project;

-- เคลียร์ตารางเดิมหากมี (ลำดับย้อน FK)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS Disposition, Payment, Appraisal, PawnTicket, PawnItem, Employee, Customer;
SET FOREIGN_KEY_CHECKS = 1;

-- ===== Tables =====

CREATE TABLE Customer (
  Customer_ID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(225) NOT NULL,
  last_name VARCHAR(225) NOT NULL,
  national_ID CHAR(13) NOT NULL,
  date_of_birth DATE,
  address VARCHAR(500) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  kyc_status ENUM('PENDING','PASSED','FAILED','REJECTED') NOT NULL,
  PRIMARY KEY (Customer_ID)
) ENGINE=InnoDB;

CREATE TABLE Employee (
  Staff_ID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(225) NOT NULL,
  last_name VARCHAR(225) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  position VARCHAR(99) NOT NULL,
  PRIMARY KEY (Staff_ID)
) ENGINE=InnoDB;

CREATE TABLE PawnItem (
  item_ID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_Type VARCHAR(225) NOT NULL,
  description VARCHAR(500) NOT NULL,
  appraised_value DECIMAL(12,2) NOT NULL,
  item_status ENUM('IN_STORAGE','RETURNED_TO_CUSTOMER','FORFEITED_READY_FOR_SALE','SOLD','OTHER') NOT NULL,
  PRIMARY KEY (item_ID)
) ENGINE=InnoDB;

CREATE TABLE PawnTicket (
  ticket_ID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Contract_Date DATETIME NOT NULL,
  Loan_Amount DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  due_date_date DATETIME,
  notice_date DATETIME,
  contract_status ENUM('ACTIVE','ROLLED_OVER','CANCELLED','EXPIRED') NOT NULL,
  Customer_ID INT UNSIGNED NOT NULL,
  Staff_ID INT UNSIGNED NOT NULL,
  item_ID INT UNSIGNED NOT NULL,
  PRIMARY KEY (ticket_ID),
  CONSTRAINT fk_PT_customer FOREIGN KEY (Customer_ID) REFERENCES Customer(Customer_ID),
  CONSTRAINT fk_PT_staff    FOREIGN KEY (Staff_ID)    REFERENCES Employee(Staff_ID),
  CONSTRAINT fk_PT_item     FOREIGN KEY (item_ID)     REFERENCES PawnItem(item_ID)
) ENGINE=InnoDB;

CREATE TABLE Appraisal (
  appraisal_ID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  appraised_value DECIMAL(12,2) NOT NULL,
  appraisal_Date DATETIME,
  evidence BLOB NULL,
  item_ID INT UNSIGNED NOT NULL,
  Staff_ID INT UNSIGNED NOT NULL,
  PRIMARY KEY (appraisal_ID),
  CONSTRAINT fk_App_item  FOREIGN KEY (item_ID) REFERENCES PawnItem(item_ID),
  CONSTRAINT fk_App_staff FOREIGN KEY (Staff_ID) REFERENCES Employee(Staff_ID)
) ENGINE=InnoDB;

CREATE TABLE Payment (
  payment_ID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_ID INT UNSIGNED NOT NULL,
  payment_date DATETIME,
  amount_paid DECIMAL(12,2) NOT NULL,
  payment_type ENUM('CASH','TRANSFER','CARD','ONLINE') NOT NULL,
  PRIMARY KEY (payment_ID),
  CONSTRAINT fk_Pay_ticket FOREIGN KEY (ticket_ID) REFERENCES PawnTicket(ticket_ID)
) ENGINE=InnoDB;

CREATE TABLE Disposition (
  disposition_ID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_ID INT UNSIGNED NOT NULL,
  sale_date DATETIME,
  sale_method ENUM('AUCTION','DIRECT_SALE','ONLINE','SCRAP') NOT NULL,
  sale_price DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (disposition_ID),
  CONSTRAINT fk_Disp_item FOREIGN KEY (item_ID) REFERENCES PawnItem(item_ID)
) ENGINE=InnoDB;
