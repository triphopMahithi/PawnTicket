-- =========================
-- 1) Customer (10 rows)
-- =========================
INSERT INTO Customer
  (Customer_ID, first_name, last_name, national_ID, date_of_birth, address, phone_number, kyc_status)
VALUES
  (1,  'Somchai',   'Jaidee',      '1101700234567', '1988-03-12', '123 Sukhumvit Rd, Khlong Toei, Bangkok 10110, Thailand', '0891234567', 'PASSED'),
  (2,  'Suda',      'Chantarat',   '3102201456789', '1992-07-25', '55 Huay Kaew Rd, Mueang, Chiang Mai 50200, Thailand',     '0981112233', 'PENDING'),
  (3,  'Arthit',    'Kittisak',    '1409909876543', '1985-11-03', '88 Mittraphap Rd, Mueang, Khon Kaen 40000, Thailand',     '0912345678', 'PASSED'),
  (4,  'Narin',     'Wattanakorn', '3700100123456', '1996-01-20', '77 Sathorn Rd, Bang Rak, Bangkok 10500, Thailand',        '0955667788', 'FAILED'),
  (5,  'Ploy',      'Boonmee',     '1209901122334', '1993-09-10', '19 Thepkrasattri Rd, Mueang, Phuket 83000, Thailand',     '0869900112', 'PASSED'),
  (6,  'Krit',      'Chaiyawat',   '1999905566778', '1989-04-05', '200 Tiwanon Rd, Pak Kret, Nonthaburi 11120, Thailand',    '0952233441', 'PASSED'),
  (7,  'Kanya',     'Ratchada',    '3100603344556', '1995-12-08', '101 Ratchadaphisek Rd, Din Daeng, Bangkok 10400, Thailand','0981556677','PENDING'),
  (8,  'Prasert',   'Yodchai',     '3301407788990', '1982-02-27', '66 Posri Rd, Mueang, Udon Thani 41000, Thailand',         '0899112233', 'PASSED'),
  (9,  'Siriporn',  'Thavorn',     '1501201122448', '1990-06-14', '44 Banphaprakan Rd, Mueang, Chiang Rai 57000, Thailand',  '0922334455', 'PASSED'),
  (10, 'Thanakorn', 'Preecha',     '1800206677889', '1987-10-22', '35 Sukhumvit Pattaya, Bang Lamung, Chonburi 20150, Thailand','0986543210','PASSED');

-- =========================
-- 2) Employee (10 rows)
-- =========================
INSERT INTO Employee
  (Staff_ID, first_name, last_name, phone_number, position)
VALUES
  (1,  'Anan',    'Kittipong',   '0812345678', 'STAFF'),
  (2,  'Pimchan', 'Rattanawong', '0897654321', 'SUPERVISOR'),
  (3,  'Viriya',  'Chanprasert', '0821112233', 'MANAGER'),
  (4,  'Patchara','Boonchai',    '0862223344', 'STAFF'),
  (5,  'Thanida', 'Kaeosod',     '0839876543', 'STAFF'),
  (6,  'Nopphon', 'Jirawat',     '0815558899', 'SUPERVISOR'),
  (7,  'Sarun',   'Phattanapon', '0854447788', 'STAFF'),
  (8,  'Kittima', 'Chantana',    '0873217654', 'STAFF'),
  (9,  'Chatchai','Apichart',    '0869091122', 'MANAGER'),
  (10, 'Ratchanee','Suksan',     '0897003344', 'STAFF');

-- =========================
-- 3) PawnItem (10 rows)
-- =========================
INSERT INTO PawnItem
  (item_ID, item_Type, description, appraised_value, item_status)
VALUES
  (1,  'GOLD',        '22K gold necklace, ~50 grams',                  95000.00, 'SOLD'),
  (2,  'ELECTRONICS', 'Apple iPhone 14 Pro 256GB (Deep Purple)',       28000.00, 'SOLD'),
  (3,  'WATCH',       'Seiko Prospex Diver Automatic',                  12000.00, 'SOLD'),
  (4,  'JEWELRY',     'Diamond ring 0.5 ct, 18K setting',              60000.00, 'SOLD'),
  (5,  'OTHER',       'Fender Stratocaster electric guitar',            18000.00, 'SOLD'),
  (6,  'ELECTRONICS', 'MacBook Pro 14-inch (M2, 512GB)',               65000.00, 'SOLD'),
  (7,  'WATCH',       'Casio G-Shock MTG series',                        9500.00, 'SOLD'),
  (8,  'JEWELRY',     'Thai gold bracelet 96.5%, ~2 baht',              63000.00, 'SOLD'),
  (9,  'ELECTRONICS', 'Sony A7C mirrorless camera (body only)',         42000.00, 'SOLD'),
  (10, 'OTHER',       'Yamaha acoustic guitar FG830',                    7500.00, 'SOLD');

-- =========================
-- 4) Appraisal (10 rows)
-- =========================
INSERT INTO Appraisal
  (appraisal_ID, appraised_value, appraisal_Date, evidence, item_ID, Staff_ID)
VALUES
  (1,  95000.00, '2025-10-30 14:10:00', x'89504E470D0A', 1,  2),
  (2,  28000.00, '2025-10-31 11:45:00', x'255044462D31', 2,  1),
  (3,  12000.00, '2025-09-20 10:00:00', x'FFD8FFE00010', 3,  3),
  (4,  60000.00, '2025-11-01 16:30:00', x'424D36000000', 4,  2),
  (5,  18000.00, '2025-08-18 09:15:00', x'CAFEBABE',     5,  5),
  (6,  65000.00, '2025-07-09 13:40:00', x'ABCD1234',     6,  6),
  (7,   9500.00, '2025-06-12 15:25:00', x'01020304',     7,  7),
  (8,  63000.00, '2025-05-03 11:10:00', x'0A0B0C0D',     8,  8),
  (9,  42000.00, '2025-09-01 10:30:00', x'DEADBEEF',     9,  9),
  (10,  7500.00, '2025-10-05 12:00:00', x'FEEDFACE',     10, 10);

-- =========================
-- 5) PawnTicket (10 rows)
--    ใช้คอลัมน์ due_date ตามสคีมาใหม่
-- =========================
INSERT INTO PawnTicket
  (ticket_ID, Contract_Date, Loan_Amount, interest_rate, due_date, notice_date, contract_status, Customer_ID, Staff_ID, item_ID)
VALUES
  (1,  '2025-11-01 10:00:00', 70000.00, 2.50, '2026-02-01 10:00:00', '2026-01-15 09:00:00', 'ACTIVE',      1,  2,  1),
  (2,  '2025-08-15 15:20:00', 21000.00, 3.00, '2025-11-15 15:20:00', '2025-11-01 09:00:00', 'ROLLED_OVER',  2,  1,  2),
  (3,  '2025-07-05 13:00:00',  9000.00, 3.00, '2025-10-05 13:00:00', '2025-09-25 09:00:00', 'EXPIRED',     3,  3,  3),
  (4,  '2025-05-20 11:40:00', 48000.00, 2.75, '2025-08-20 11:40:00', '2025-08-05 09:00:00', 'EXPIRED',     4,  4,  4),
  (5,  '2025-04-02 09:00:00', 13000.00, 3.00, '2025-07-02 09:00:00', '2025-06-18 09:00:00', 'EXPIRED',     5,  5,  5),
  (6,  '2025-06-10 14:15:00', 52000.00, 2.50, '2025-09-10 14:15:00', '2025-08-27 09:00:00', 'EXPIRED',     6,  6,  6),
  (7,  '2025-09-22 16:45:00',  7000.00, 3.00, '2025-12-22 16:45:00', '2025-12-08 09:00:00', 'ACTIVE',      7,  7,  7),
  (8,  '2025-10-18 12:05:00', 50000.00, 2.75, '2026-01-18 12:05:00', '2026-01-04 09:00:00', 'ACTIVE',      8,  8,  8),
  (9,  '2025-03-28 10:20:00', 32000.00, 2.50, '2025-06-28 10:20:00', '2025-06-14 09:00:00', 'EXPIRED',     9,  9,  9),
  (10, '2025-02-14 13:30:00',  5000.00, 2.50, '2025-05-14 13:30:00', '2025-04-30 09:00:00', 'CANCELLED',  10, 10, 10);

-- =========================
-- 6) Payment (10 rows)
-- =========================
INSERT INTO Payment
  (payment_ID, ticket_ID, payment_date, amount_paid, payment_type)
VALUES
  (1,  1,  '2025-12-01 09:30:00', 1750.00, 'TRANSFER'),
  (2,  2,  '2025-09-15 14:10:00',  630.00, 'ONLINE'),
  (3,  3,  '2025-08-05 10:05:00',  270.00, 'CASH'),
  (4,  4,  '2025-06-20 12:00:00', 1320.00, 'CARD'),
  (5,  5,  '2025-05-02 11:05:00',  390.00, 'TRANSFER'),
  (6,  6,  '2025-07-10 15:10:00', 1300.00, 'CASH'),
  (7,  7,  '2025-10-22 10:25:00',  210.00, 'ONLINE'),
  (8,  8,  '2025-11-18 16:40:00', 1375.00, 'CARD'),
  (9,  9,  '2025-04-28 09:20:00',  800.00, 'TRANSFER'),
  (10, 10, '2025-03-14 13:35:00',  125.00, 'CASH');

-- =========================
-- 7) Disposition (10 rows)
-- =========================
INSERT INTO Disposition
  (disposition_ID, item_ID, sale_date, sale_method, sale_price)
VALUES
  (1,  1,  '2026-03-01 11:00:00', 'DIRECT_SALE', 98000.00),
  (2,  2,  '2025-12-01 10:30:00', 'ONLINE',      24500.00),
  (3,  3,  '2025-10-30 14:20:00', 'DIRECT_SALE', 13000.00),
  (4,  4,  '2025-09-05 15:45:00', 'AUCTION',     61000.00),
  (5,  5,  '2025-08-10 13:10:00', 'DIRECT_SALE', 17000.00),
  (6,  6,  '2025-10-05 16:00:00', 'AUCTION',     64000.00),
  (7,  7,  '2025-12-28 12:10:00', 'ONLINE',      10000.00),
  (8,  8,  '2026-02-05 10:05:00', 'DIRECT_SALE', 65000.00),
  (9,  9,  '2025-11-20 09:50:00', 'ONLINE',      41000.00),
  (10, 10, '2025-06-20 10:00:00', 'SCRAP',        6000.00);
