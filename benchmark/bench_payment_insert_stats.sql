USE project;
DELIMITER $$

CREATE PROCEDURE bench_payment_insert_stats (
    IN p_ticket_id   INT,
    IN p_repeat      INT,
    IN p_warmup      INT
)
BEGIN
    DECLARE v_i       INT DEFAULT 0;
    DECLARE v_start   DATETIME(6);
    DECLARE v_end     DATETIME(6);
    DECLARE v_elapsed BIGINT;
    DECLARE v_min     BIGINT DEFAULT 9223372036854775807;
    DECLARE v_max     BIGINT DEFAULT 0;
    DECLARE v_sum     BIGINT DEFAULT 0;
    DECLARE v_sum_sq  DECIMAL(30,0) DEFAULT 0;
    DECLARE v_runs    INT;

    SET v_runs = p_repeat;
    SET v_i = 0;

    WHILE v_i < (p_repeat + p_warmup) DO
        SET v_i = v_i + 1;

        SET v_start = NOW(6);

        -- INSERT เท่านั้น
        INSERT INTO Payment (ticket_ID, payment_Date, amount_Paid, payment_type)
        VALUES (p_ticket_id, NOW(), 100.00, 'CASH');

        SET v_end = NOW(6);

        IF v_i > p_warmup THEN
            SET v_elapsed = TIMESTAMPDIFF(MICROSECOND, v_start, v_end);
            SET v_min = LEAST(v_min, v_elapsed);
            SET v_max = GREATEST(v_max, v_elapsed);
            SET v_sum = v_sum + v_elapsed;
            SET v_sum_sq = v_sum_sq + v_elapsed * v_elapsed;
        END IF;
    END WHILE;

    IF v_runs > 0 THEN
        SELECT
            'Payment INSERT only'    AS query_text,
            v_runs                   AS runs,
            p_warmup                 AS warmup_runs,
            v_min                    AS min_us,
            v_max                    AS max_us,
            ROUND(v_sum / v_runs, 2) AS avg_us,
            ROUND(
                SQRT(
                    (v_sum_sq / v_runs) - POW(v_sum / v_runs, 2)
                ),
                2
            ) AS stddev_us;
    END IF;
END$$

DELIMITER ;
