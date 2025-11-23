USE project;

-- READ (DB)

-- customer 
CALL bench_customer_search_stats('Somchai', 30, 10);
-- customer prefix
CALL bench_customer_search_stats('Som', 30, 10);   -- WHERE name LIKE 'Som%'
-- substring search
CALL bench_customer_search_stats('%chai%', 30, 10); -- WHERE name LIKE '%chai%'

-- One Ticket
CALL bench_tickets_by_customer_stats(1, 30, 10);

-- Many Tickets
CALL bench_tickets_by_customer_stats(1, 30, 10);


-- WRITE (DB)
-- ================ INSERT =========================

-- Write: Payment
SET @t := (
  SELECT ticket_ID
  FROM PawnTicket
  ORDER BY ticket_ID
  LIMIT 1
);

SELECT @t;  -- ดูก่อนว่ามันได้ค่าอะไร
CALL bench_payment_insert_stats(@t, 30, 10);

-- Write: Ticket
CALL bench_ticket_insert_stats(1, 1, 101, 30, 10);


-- ================ DELETE =========================

-- สมมติใช้ ticket_ID ที่มีจริง
SET @t := (
  SELECT ticket_ID
  FROM PawnTicket
  ORDER BY ticket_ID
  LIMIT 1
);
CALL bench_payment_delete_stats(@t, 30, 10);


-- delete ticket
CALL bench_ticket_delete_stats(1, 30, 10);

-- ================ UPDATE =========================
SET @t := (
  SELECT ticket_ID
  FROM PawnTicket
  ORDER BY ticket_ID
  LIMIT 1
);

CALL bench_payment_update_stats(@t, 30, 10);

-- update ticket
CALL bench_ticket_update_stats(1, 30, 10);




