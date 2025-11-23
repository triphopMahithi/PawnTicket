USE project;

DROP PROCEDURE IF EXISTS bench_tickets_by_customer_stats;

DELIMITER //

CREATE PROCEDURE bench_tickets_by_customer_stats(
  IN p_customer_id INT,
  IN p_repeat INT,
  IN p_warmup INT
)
BEGIN
  DECLARE i INT DEFAULT 0;
  DECLARE t_start DATETIME(6);
  DECLARE t_end   DATETIME(6);
  DECLARE elapsed BIGINT;

  -- กันค่า repeat/warmup แปลก ๆ
  IF p_repeat IS NULL OR p_repeat <= 0 THEN
    SET p_repeat = 10;
  END IF;

  IF p_warmup IS NULL OR p_warmup < 0 THEN
    SET p_warmup = 0;
  END IF;

  -- ตารางชั่วคราวเก็บเวลาแต่ละรอบ
  DROP TEMPORARY TABLE IF EXISTS tmp_bench_ticket;
  CREATE TEMPORARY TABLE tmp_bench_ticket (
    run_no     INT NOT NULL,
    elapsed_us BIGINT NOT NULL
  ) ENGINE = MEMORY;

  -- 1) WARM-UP (ไม่เก็บเวลา)
  SET i = 0;
  WHILE i < p_warmup DO
    SELECT
      pt.ticket_ID,
      pt.Contract_Date,
      pt.Loan_Amount,
      pt.interest_rate,
      pt.due_date,
      pt.notice_date,
      pt.contract_status,
      pt.Staff_ID,
      pt.item_ID
    FROM PawnTicket pt
    WHERE pt.Customer_ID = p_customer_id
    ORDER BY pt.Contract_Date DESC, pt.ticket_ID DESC;

    SET i = i + 1;
  END WHILE;

  -- 2) วัดเวลาจริง (warm cache แล้ว)
  SET i = 0;
  WHILE i < p_repeat DO
    SET t_start = NOW(6);

    SELECT
      pt.ticket_ID,
      pt.Contract_Date,
      pt.Loan_Amount,
      pt.interest_rate,
      pt.due_date,
      pt.notice_date,
      pt.contract_status,
      pt.Staff_ID,
      pt.item_ID
    FROM PawnTicket pt
    WHERE pt.Customer_ID = p_customer_id
    ORDER BY pt.Contract_Date DESC, pt.ticket_ID DESC;

    SET t_end = NOW(6);
    SET elapsed = TIMESTAMPDIFF(MICROSECOND, t_start, t_end);

    INSERT INTO tmp_bench_ticket (run_no, elapsed_us)
    VALUES (i + 1, elapsed);

    SET i = i + 1;
  END WHILE;

  -- 3) สรุปสถิติหลัก
  SELECT
    p_customer_id           AS customer_id,
    p_repeat                AS runs,
    p_warmup                AS warmup_runs,
    MIN(elapsed_us)         AS min_us,
    MAX(elapsed_us)         AS max_us,
    AVG(elapsed_us)         AS avg_us,
    STDDEV_POP(elapsed_us)  AS stddev_us,
    MIN(elapsed_us) / 1000  AS min_ms,
    MAX(elapsed_us) / 1000  AS max_ms,
    AVG(elapsed_us) / 1000  AS avg_ms,
    STDDEV_POP(elapsed_us) / 1000 AS stddev_ms
  FROM tmp_bench_ticket;


END//

DELIMITER ;
