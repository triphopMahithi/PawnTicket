USE project;

-- =========================
-- 1) Customer (10 rows)
-- =========================
INSERT INTO Customer (
  Customer_ID, first_name, last_name, national_ID,
  date_of_birth, address, phone_number, kyc_status
) VALUES
  ('C001','Thanakrit','Pongschanakul','1103700000001','1999-03-21',
   '123/4 Moo 5, Nai Mueang Subdistrict, Mueang Nakhon Ratchasima District, Nakhon Ratchasima 30000',
   891234567,'PENDING'),
  ('C002','Oranya','Arjahan','1103700000002','2000-07-15',
   '45/8 Soi Lat Phrao 15, Chom Phon Subdistrict, Chatuchak District, Bangkok 10900',
   869876543,'PASSED'),
  ('C003','Sirikan','Chujai','1103700000003','1995-11-02',
   '88 Sirisuk Village, San Sai Subdistrict, San Sai District, Chiang Mai 50210',
   881112223,'FAILED'),
  ('C004','Panisara','Bunruang','1103700000004','1988-01-30',
   '56/7 Rob Mueang Rd., Nai Mueang Subdistrict, Mueang Khon Kaen District, Khon Kaen 40000',
   892223334,'REJECTED'),
  ('C005','Napadol','Sukkasem','1103700000005','1992-05-09',
   '12/3 Wichit Subdistrict, Mueang Phuket District, Phuket 83000',
   883334445,'PENDING'),
  ('C006','Sutthida','Thongmee','1103700000006','1997-09-18',
   '199/9 Chonview Village, Samet Subdistrict, Mueang Chonburi District, Chonburi 20000',
   894445556,'PASSED'),
  ('C007','Kittipong','Jaidee','1103700000007','1985-12-25',
   '77/1 Bang Rak Phatthana Subdistrict, Bang Bua Thong District, Nonthaburi 11110',
   885556667,'FAILED'),
  ('C008','Chonthicha','Wongsuwan','1103700000008','1990-02-14',
   '34/2 Khlong Nueng Subdistrict, Khlong Luang District, Pathum Thani 12120',
   896667778,'REJECTED'),
  ('C009','Pavina','Saetang','1103700000009','1998-08-05',
   '9/9 Sanambin Rd., Nai Mueang Subdistrict, Mueang Udon Thani District, Udon Thani 41000',
   887778889,'PENDING'),
  ('C010','Phuwadol','Intharak','1103700000010','1993-10-11',
   '101 Moo 2, Tha Chin Subdistrict, Mueang Samut Sakhon District, Samut Sakhon 74000',
   899889990,'PASSED');

-- =========================
-- 2) Employee (10 rows)
-- =========================
INSERT INTO Employee (
  Staff_ID, first_name, last_name, phone_number, position
) VALUES
  ('S001','Somchai','Pramoendee','0891234567','STAFF'),
  ('S002','Somying','Chiaochan','0869876543','STAFF'),
  ('S003','Wichai','Munjai','0812347890','SUPERVISOR'),
  ('S004','Orathai','Jitngam','0825566778','STAFF'),
  ('S005','Prasert','Thongthae','0837788990','MANAGER'),
  ('S006','Chanakan','Jaiyen','0849090909','STAFF'),
  ('S007','Piya','Srisawat','0855551234','STAFF'),
  ('S008','Chanida','Homchan','0863337788','SUPERVISOR'),
  ('S009','Thanwa','Wongdee','0874448899','STAFF'),
  ('S010','Kamon','Poonsuk','0886669900','STAFF');

-- =========================
-- 3) PawnItem (10 rows)
-- =========================
-- item_status: IN_STORAGE / RETURNED_TO_CUSTOMER / FORFEITED_READY_FOR_SALE / SOLD / OTHER
INSERT INTO PawnItem (
  item_ID, item_Type, description, appraised_value, item_status
) VALUES
  ('I001','GOLD','24K gold necklace, 1 baht weight (Thai gold), chain pattern',29500.00,'IN_STORAGE'),
  ('I002','GOLD','24K gold bangle, 2 baht weight, “Pikun” pattern',59000.00,'IN_STORAGE'),
  ('I003','JEWELRY','Single diamond ring, 0.25 carat',18000.00,'IN_STORAGE'),
  ('I004','ELECTRONICS','Mid-range smartphone',7500.00,'IN_STORAGE'),
  ('I005','WATCH','Japanese brand wristwatch, steel bracelet',4200.00,'RETURNED_TO_CUSTOMER'),
  ('I006','OTHER','14-inch work laptop',18500.00,'FORFEITED_READY_FOR_SALE'),
  ('I007','JEWELRY','Sterling silver necklace with gemstone pendant',3200.00,'SOLD'),
  ('I008','GOLD','Gold ring, half salung, floral pattern',7400.00,'IN_STORAGE'),
  ('I009','ELECTRONICS','10-inch tablet with SIM support',9500.00,'IN_STORAGE'),
  ('I010','OTHER','Used digital camera',6200.00,'OTHER');

-- =========================
-- 4) PawnTicket (10 rows)
-- =========================
INSERT INTO PawnTicket (
  ticket_ID, Contract_Date, Loan_Amount, interest_rate,
  due_date_date, notice_date, contract_status,
  Customer_ID, Staff_ID, item_ID
) VALUES
  ('T001','2025-01-05 10:15:00',20000.00,2.50,'2025-02-04 10:15:00','2025-01-28 10:15:00','ACTIVE','C001','S001','I001'),
  ('T002','2025-01-06 11:30:00',40000.00,2.30,'2025-02-05 11:30:00','2025-01-29 11:30:00','ACTIVE','C002','S002','I002'),
  ('T003','2025-01-07 14:00:00',12000.00,2.80,'2025-02-06 14:00:00','2025-01-30 14:00:00','ROLLED_OVER','C003','S003','I003'),
  ('T004','2025-01-08 09:45:00',6000.00,3.00,'2025-02-07 09:45:00','2025-02-01 09:45:00','ACTIVE','C004','S004','I004'),
  ('T005','2025-01-09 16:20:00',3000.00,3.50,'2025-02-08 16:20:00','2025-02-02 16:20:00','CANCELLED','C005','S005','I005'),
  ('T006','2025-01-10 13:10:00',15000.00,2.90,'2025-02-09 13:10:00','2025-02-03 13:10:00','EXPIRED','C006','S006','I006'),
  ('T007','2025-01-11 11:05:00',5000.00,3.20,'2025-02-10 11:05:00','2025-02-04 11:05:00','ACTIVE','C007','S007','I007'),
  ('T008','2025-01-12 15:40:00',8000.00,3.10,'2025-02-11 15:40:00','2025-02-05 15:40:00','ROLLED_OVER','C008','S008','I008'),
  ('T009','2025-01-13 10:00:00',9000.00,3.00,'2025-02-12 10:00:00','2025-02-06 10:00:00','ACTIVE','C009','S009','I009'),
  ('T010','2025-01-14 09:30:00',6500.00,3.20,'2025-02-13 09:30:00','2025-02-07 09:30:00','ACTIVE','C010','S010','I010');

-- =========================
-- 5) Appraisal (10 rows)
-- =========================
-- evidence: simple BLOB placeholder x'01'
INSERT INTO Appraisal (
  appraisal_ID, appraised_value, appraisal_Date, evidence,
  item_ID, Staff_ID
) VALUES
  ('A001',29500.00,'2025-01-05 09:30:00',x'01','I001','S001'),
  ('A002',60000.00,'2025-01-06 10:45:00',x'01','I002','S002'),
  ('A003',18000.00,'2025-01-07 13:10:00',x'01','I003','S003'),
  ('A004',8000.00,'2025-01-08 09:00:00',x'01','I004','S004'),
  ('A005',4500.00,'2025-01-09 15:30:00',x'01','I005','S005'),
  ('A006',19000.00,'2025-01-10 12:20:00',x'01','I006','S006'),
  ('A007',3500.00,'2025-01-11 10:50:00',x'01','I007','S007'),
  ('A008',7800.00,'2025-01-12 14:30:00',x'01','I008','S008'),
  ('A009',9800.00,'2025-01-13 09:20:00',x'01','I009','S009'),
  ('A010',6500.00,'2025-01-14 08:45:00',x'01','I010','S010');

-- =========================
-- 6) Payment (10 rows)
-- =========================
INSERT INTO Payment (
  payment_ID, ticket_ID, payment_date, amount_paid, payment_type
) VALUES
  ('P001','T001','2025-01-20 10:00:00',5000.00,'CASH'),
  ('P002','T002','2025-01-21 11:15:00',8000.00,'TRANSFER'),
  ('P003','T003','2025-01-22 14:30:00',4000.00,'CARD'),
  ('P004','T004','2025-01-23 09:30:00',3000.00,'ONLINE'),
  ('P005','T005','2025-01-24 16:00:00',1500.00,'CASH'),
  ('P006','T006','2025-01-25 13:00:00',5000.00,'TRANSFER'),
  ('P007','T007','2025-01-26 11:10:00',2500.00,'CARD'),
  ('P008','T008','2025-01-27 15:20:00',3000.00,'ONLINE'),
  ('P009','T009','2025-01-28 10:10:00',3500.00,'CASH'),
  ('P010','T010','2025-01-29 09:40:00',2000.00,'TRANSFER');

-- =========================
-- 7) Disposition (10 rows)
-- =========================
INSERT INTO Disposition (
  disposition_ID, item_ID, sale_date, sale_method, sale_price
) VALUES
  ('D001','I006','2025-03-10 11:00:00','AUCTION',21000.00),
  ('D002','I007','2025-02-20 14:30:00','DIRECT_SALE',3800.00),
  ('D003','I008','2025-03-01 16:00:00','ONLINE',8200.00),
  ('D004','I010','2025-03-05 13:45:00','SCRAP',3000.00),
  ('D005','I002','2025-04-01 15:10:00','AUCTION',63000.00),
  ('D006','I003','2025-03-18 12:20:00','DIRECT_SALE',19000.00),
  ('D007','I004','2025-03-22 17:30:00','ONLINE',7800.00),
  ('D008','I005','2025-02-28 10:50:00','DIRECT_SALE',4800.00),
  ('D009','I009','2025-04-02 11:15:00','AUCTION',10500.00),
  ('D010','I001','2025-04-10 14:05:00','ONLINE',31000.00);
