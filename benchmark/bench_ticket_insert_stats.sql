USE project;
DELIMITER $$

CREATE PROCEDURE bench_ticket_insert_stats (
    IN p_customer_id INT,
    IN p_staff_id    INT,
    IN p_item_id     INT,
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
    DECLARE v_now     DATE;

    SET v_runs = p_repeat;
    SET v_now = CURDATE();
    SET v_i = 0;

    WHILE v_i < (p_repeat + p_warmup) DO
        SET v_i = v_i + 1;

        SET v_start = NOW(6);

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
        VALUES (
            v_now,
            9876543.21,                           
            9.99,                                 
            DATE_ADD(v_now, INTERVAL 30 DAY),
            'ACTIVE',
            NULL,
            p_customer_id,
            p_staff_id,
            p_item_id
        );

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
            'PawnTicket INSERT only'   AS query_text,
            v_runs                     AS runs,
            p_warmup                   AS warmup_runs,
            v_min                      AS min_us,
            v_max                      AS max_us,
            ROUND(v_sum / v_runs, 2)   AS avg_us,
            ROUND(
                SQRT(
                    (v_sum_sq / v_runs) - POW(v_sum / v_runs, 2)
                ),
                2
            ) AS stddev_us;
    END IF;
END$$

DELIMITER ;
