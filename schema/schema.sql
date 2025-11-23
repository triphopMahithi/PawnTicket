CREATE DATABASE IF NOT EXISTS project
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

USE project;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS Disposition, Payment, Appraisal, PawnTicket, PawnItem, Employee, Customer;
SET FOREIGN_KEY_CHECKS = 1;

-- ========================
-- Customer
-- ========================
CREATE TABLE Customer (
  Customer_ID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(225) NOT NULL,
  last_name  VARCHAR(225) NOT NULL,
  national_ID CHAR(13) NOT NULL,
  date_of_birth DATE,
  address VARCHAR(500) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  kyc_status ENUM('PENDING','PASSED','FAILED','REJECTED') NOT NULL DEFAULT 'PENDING',
  PRIMARY KEY (Customer_ID),
  -- ป้องกันลูกค้าคนเดิมซ้ำ และให้ search เร็ว
  UNIQUE KEY uk_customer_national_id (national_ID),
  KEY idx_customer_phone (phone_number),
  KEY idx_customer_name (last_name, first_name)
) ENGINE=InnoDB;

-- ========================
-- Employee
-- ========================
CREATE TABLE Employee (
  Staff_ID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(225) NOT NULL,
  last_name  VARCHAR(225) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  position VARCHAR(99) NOT NULL,
  PRIMARY KEY (Staff_ID),
  KEY idx_employee_name (last_name, first_name),
  UNIQUE KEY uk_employee_phone (phone_number)
) ENGINE=InnoDB;

-- ========================
-- PawnItem
-- ========================
CREATE TABLE PawnItem (
  item_ID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_Type VARCHAR(225) NOT NULL,
  description VARCHAR(500) NOT NULL,
  appraised_value DECIMAL(12,2) NOT NULL,
  item_status ENUM('IN_STORAGE','RETURNED_TO_CUSTOMER',
                   'FORFEITED_READY_FOR_SALE','SOLD','OTHER') NOT NULL,
  PRIMARY KEY (item_ID),
  KEY idx_pawnitem_status (item_status)
) ENGINE=InnoDB;

-- ========================
-- PawnTicket
-- ========================
CREATE TABLE PawnTicket (
  ticket_ID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Contract_Date DATETIME NOT NULL,
  Loan_Amount DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  -- แก้ชื่อให้สั้นลง/มาตรฐาน: จากเดิม due_date_date
  due_date DATETIME NOT NULL,
  notice_date DATETIME,
  contract_status ENUM('ACTIVE','ROLLED_OVER','CANCELLED','EXPIRED')
                  NOT NULL DEFAULT 'ACTIVE',
  Customer_ID INT UNSIGNED NOT NULL,
  Staff_ID    INT UNSIGNED NOT NULL,
  item_ID     INT UNSIGNED NOT NULL,
  PRIMARY KEY (ticket_ID),

  CONSTRAINT fk_PT_customer FOREIGN KEY (Customer_ID) REFERENCES Customer(Customer_ID),
  CONSTRAINT fk_PT_staff    FOREIGN KEY (Staff_ID)    REFERENCES Employee(Staff_ID),
  CONSTRAINT fk_PT_item     FOREIGN KEY (item_ID)     REFERENCES PawnItem(item_ID),

  -- ดึงประวัติตั๋วตามลูกค้า/วันที่บ่อย
  KEY idx_ticket_customer_date (Customer_ID, Contract_Date),
  -- ช่วยดูตั๋วจาก item เดิม
  KEY idx_ticket_item (item_ID),
  -- ช่วย filter ตามสถานะ + วันครบกำหนด
  KEY idx_ticket_status_due (contract_status, due_date)
) ENGINE=InnoDB;

-- ========================
-- Appraisal
-- ========================
CREATE TABLE Appraisal (
  appraisal_ID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  appraised_value DECIMAL(12,2) NOT NULL,
  appraisal_Date DATETIME,
  evidence BLOB NULL,
  item_ID INT UNSIGNED NOT NULL,
  Staff_ID INT UNSIGNED NOT NULL,
  PRIMARY KEY (appraisal_ID),
  CONSTRAINT fk_App_item  FOREIGN KEY (item_ID) REFERENCES PawnItem(item_ID),
  CONSTRAINT fk_App_staff FOREIGN KEY (Staff_ID) REFERENCES Employee(Staff_ID),
  KEY idx_appraisal_item_date (item_ID, appraisal_Date)
) ENGINE=InnoDB;

-- ========================
-- Payment
-- ========================
CREATE TABLE Payment (
  payment_ID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_ID INT UNSIGNED NOT NULL,
  payment_date DATETIME,
  amount_paid DECIMAL(12,2) NOT NULL,
  payment_type ENUM('CASH','TRANSFER','CARD','ONLINE') NOT NULL,
  PRIMARY KEY (payment_ID),
  CONSTRAINT fk_Pay_ticket FOREIGN KEY (ticket_ID) REFERENCES PawnTicket(ticket_ID),
  -- ค้นประวัติการจ่ายตามตั๋ว/วันที่
  KEY idx_payment_ticket_date (ticket_ID, payment_date)
) ENGINE=InnoDB;

-- ========================
-- Disposition
-- ========================
CREATE TABLE Disposition (
  disposition_ID INT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_ID INT UNSIGNED NOT NULL,
  sale_date DATETIME,
  sale_method ENUM('AUCTION','DIRECT_SALE','ONLINE','SCRAP') NOT NULL,
  sale_price DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (disposition_ID),
  CONSTRAINT fk_Disp_item FOREIGN KEY (item_ID) REFERENCES PawnItem(item_ID),
  KEY idx_disposition_item (item_ID),
  KEY idx_disposition_sale_date (sale_date)
) ENGINE=InnoDB;
