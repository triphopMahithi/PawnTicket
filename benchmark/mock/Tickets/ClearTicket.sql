USE project;
SET SQL_SAFE_UPDATES = 0;
SET @cust_id := 1;

DELETE FROM Payment
WHERE ticket_ID IN (
  SELECT ticket_ID
  FROM PawnTicket
  WHERE Customer_ID = @cust_id
);

-- ลบ PawnTicket ต่อ
DELETE FROM PawnTicket
WHERE Customer_ID = @cust_id;

-- ถ้าอยากเปิดกลับ
SET SQL_SAFE_UPDATES = 1;
