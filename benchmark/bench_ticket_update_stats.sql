USE project;
DELIMITER $$

DROP PROCEDURE IF EXISTS bench_ticket_update_stats$$

CREATE PROCEDURE bench_ticket_update_stats (
    IN p_customer_id INT,
    IN p_repeat      INT,
    IN p_warmup      INT
)
BEGIN
    DECLARE v_i          INT DEFAULT 0;
    DECLARE v_start      DATETIME(6);
    DECLARE v_end        DATETIME(6);
    DECLARE v_elapsed    BIGINT;
    DECLARE v_min        BIGINT DEFAULT 9223372036854775807;
    DECLARE v_max        BIGINT DEFAULT 0;
    DECLARE v_sum        BIGINT DEFAULT 0;
    DECLARE v_sum_sq     DECIMAL(30,0) DEFAULT 0;
    DECLARE v_effective  INT DEFAULT 0;
    DECLARE v_ticket_id  INT;

    SET v_i = 0;

    main_loop: WHILE v_i < (p_repeat + p_warmup) DO
        SET v_i = v_i + 1;

        -- เลือก ticket test หนึ่งใบ (Loan_Amount พิเศษ)
        SELECT ticket_ID
        INTO v_ticket_id
        FROM PawnTicket
        WHERE Customer_ID = p_customer_id
          AND Loan_Amount = 9876543.21
        ORDER BY ticket_ID DESC
        LIMIT 1;

        IF v_ticket_id IS NULL THEN
            LEAVE main_loop;
        END IF;

        SET v_start = NOW(6);

        UPDATE PawnTicket
        SET interest_rate = interest_rate + 0.01
        WHERE ticket_ID = v_ticket_id;

        SET v_end = NOW(6);

        IF v_i > p_warmup THEN
            SET v_elapsed = TIMESTAMPDIFF(MICROSECOND, v_start, v_end);
            SET v_min = LEAST(v_min, v_elapsed);
            SET v_max = GREATEST(v_max, v_elapsed);
            SET v_sum = v_sum + v_elapsed;
            SET v_sum_sq = v_sum_sq + v_elapsed * v_elapsed;
            SET v_effective = v_effective + 1;
        END IF;
    END WHILE main_loop;

    IF v_effective > 0 THEN
        SELECT
            'PawnTicket UPDATE only'       AS query_text,
            v_effective                    AS runs,
            p_warmup                       AS warmup_runs,
            v_min                          AS min_us,
            v_max                          AS max_us,
            ROUND(v_sum / v_effective, 2)  AS avg_us,
            ROUND(
                SQRT(
                    (v_sum_sq / v_effective) - POW(v_sum / v_effective, 2)
                ),
                2
            ) AS stddev_us;
    END IF;
END$$

DELIMITER ;
