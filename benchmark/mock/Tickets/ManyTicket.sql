USE project;

SET @cust_id  = 1;   -- ลูกค้าที่จะใช้ benchmark

INSERT INTO PawnItem (item_type, description, appraised_value, item_status)
WITH RECURSIVE seq AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 100
)
SELECT
  'GOLD' AS item_type,
  CONCAT('BENCH-CUST', @cust_id, '-ITEM-', LPAD(n, 3, '0')) AS description,
  5000 + n * 100 AS appraised_value,   -- ✅ ให้ค่าประเมินไม่เป็น NULL
  'IN_STORAGE' AS item_status
FROM seq;

USE project;

SET @cust_id  := 1;
SET @staff_id := 1;
SET @rn       := 0;
SET @pattern  := CONCAT('BENCH-CUST', @cust_id, '-ITEM-%');

INSERT INTO PawnTicket (
  Contract_Date,
  Loan_Amount,
  interest_rate,
  due_date,
  contract_status,
  notice_date,
  Customer_ID,
  Staff_ID,
  item_ID
)
SELECT
  DATE_ADD('2024-01-01', INTERVAL (@rn:=@rn+1)-1 DAY)                    AS Contract_Date,
  1000 + @rn * 50                                                         AS Loan_Amount,
  2.5 + (@rn % 5)                                                         AS interest_rate,
  DATE_ADD(DATE_ADD('2024-01-01', INTERVAL @rn-1 DAY), INTERVAL 30 DAY)  AS due_date,
  CASE @rn % 4
    WHEN 0 THEN 'ACTIVE'
    WHEN 1 THEN 'ROLLED_OVER'
    WHEN 2 THEN 'CANCELLED'
    ELSE 'EXPIRED'
  END                                                                     AS contract_status,
  NULL                                                                    AS notice_date,
  @cust_id                                                                AS Customer_ID,
  @staff_id                                                               AS Staff_ID,
  p.item_ID                                                               AS item_ID
FROM PawnItem p
WHERE p.description COLLATE utf8mb4_0900_ai_ci LIKE @pattern
ORDER BY p.item_ID;
