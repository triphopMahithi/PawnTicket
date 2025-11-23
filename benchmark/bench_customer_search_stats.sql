USE project;

DROP PROCEDURE IF EXISTS bench_customer_search_stats;

DELIMITER //

CREATE PROCEDURE bench_customer_search_stats(
  IN p_q       VARCHAR(255),
  IN p_repeat  INT,
  IN p_warmup  INT   -- จำนวนรอบสำหรับ warm cache (เช่น 5, 10)
)
BEGIN
  DECLARE i INT DEFAULT 0;
  DECLARE t_start DATETIME(6);
  DECLARE t_end   DATETIME(6);
  DECLARE elapsed BIGINT;
  DECLARE like_q VARCHAR(300);

  -- ป้องกันค่า repeat แปลก ๆ
  IF p_repeat IS NULL OR p_repeat <= 0 THEN
    SET p_repeat = 10;
  END IF;

  -- ป้องกันค่า warmup แปลก ๆ
  IF p_warmup IS NULL OR p_warmup < 0 THEN
    SET p_warmup = 0;
  END IF;

  -- สร้าง pattern สำหรับ LIKE
  SET like_q = CONCAT('%', p_q, '%');

  -- สร้างตารางชั่วคราวเก็บผลแต่ละรอบ
DROP TEMPORARY TABLE IF EXISTS tmp_bench_customer;
  CREATE TEMPORARY TABLE tmp_bench_customer (
    run_no     INT NOT NULL,
    elapsed_us BIGINT NOT NULL
  ) ENGINE = MEMORY;

  
  -- 1) WARM-UP (ไม่เก็บเวลา ใช้ให้ cache อุ่น)
  
  SET i = 0;
  WHILE i < p_warmup DO
    SELECT
      Customer_ID AS id,
      CONCAT_WS(' ', first_name, last_name) AS name,
      national_ID AS nationalId,
      phone_number AS phone,
      address AS addressLine
    FROM Customer
    WHERE
      CONCAT_WS(' ', first_name, last_name) LIKE like_q
      OR national_ID LIKE like_q
      OR phone_number LIKE like_q
      OR address LIKE like_q
    ORDER BY Customer_ID DESC
    LIMIT 20;

    SET i = i + 1;
  END WHILE;


  -- 2) วัดเวลาจริง (warm cache แล้ว)

  SET i = 0;
  WHILE i < p_repeat DO
    SET t_start = NOW(6);

    -- ====== ใส่ query จริงที่ต้องการ benchmark ======
    SELECT
      Customer_ID AS id,
      CONCAT_WS(' ', first_name, last_name) AS name,
      national_ID AS nationalId,
      phone_number AS phone,
      address AS addressLine
    FROM Customer
    WHERE
      CONCAT_WS(' ', first_name, last_name) LIKE like_q
      OR national_ID LIKE like_q
      OR phone_number LIKE like_q
      OR address LIKE like_q
    ORDER BY Customer_ID DESC
    LIMIT 20;
    -- ===============================================

    SET t_end = NOW(6);
    SET elapsed = TIMESTAMPDIFF(MICROSECOND, t_start, t_end);

    INSERT INTO tmp_bench_customer (run_no, elapsed_us)
    VALUES (i + 1, elapsed);

    SET i = i + 1;
  END WHILE;


  -- 3) สรุปสถิติหลัก: min / max / avg / stddev

  SELECT
    p_q                     AS query_text,
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
  FROM tmp_bench_customer;


  -- 4) median (p50) และ p95

  SELECT
    p_q AS query_text,
    p_repeat AS runs,
    (
      SELECT elapsed_us
      FROM (
        SELECT
          elapsed_us,
          ROW_NUMBER() OVER (ORDER BY elapsed_us) AS rn
        FROM tmp_bench_customer
      ) x
      WHERE rn = FLOOR((p_repeat + 1) / 2)
    ) AS p50_us,
    (
      SELECT elapsed_us
      FROM (
        SELECT
          elapsed_us,
          ROW_NUMBER() OVER (ORDER BY elapsed_us) AS rn
        FROM tmp_bench_customer
      ) y
      WHERE rn = CEIL(p_repeat * 0.95)
    ) AS p95_us;


  -- 5) distribution รายรอบ (เอาไป plot / ดู pattern)

  SELECT
    run_no,
    elapsed_us,
    elapsed_us / 1000 AS elapsed_ms
  FROM tmp_bench_customer
  ORDER BY run_no;

END//

DELIMITER ;
