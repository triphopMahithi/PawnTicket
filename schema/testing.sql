USE project;
SET @start := NOW(6);  -- NOW(6) = microsecond precision

-- query ตัวอย่าง
SELECT /* test_1 */ 
  t.ticket_ID, t.Contract_Date, t.Loan_Amount
FROM PawnTicket t
WHERE t.Customer_ID = 1
ORDER BY t.Contract_Date DESC;

SELECT TIMESTAMPDIFF(MICROSECOND, @start, NOW(6)) AS elapsed_us;

USE project_old;

SET @start := NOW(6);  -- NOW(6) = microsecond precision

-- query ตัวอย่าง
SELECT /* test_1 */ 
  t.ticket_ID, t.Contract_Date, t.Loan_Amount
FROM PawnTicket t
WHERE t.Customer_ID = 1
ORDER BY t.Contract_Date DESC;

SELECT TIMESTAMPDIFF(MICROSECOND, @start, NOW(6)) AS elapsed_us;

USE project;
CALL bench_customer_search('Somchai', 20);

USE project_old;
CALL bench_customer_search('Somchai', 20);

