USE project;

EXPLAIN FORMAT=JSON SELECT * FROM Customer WHERE first_name LIKE 'Som';
EXPLAIN FORMAT=JSON SELECT * FROM Customer WHERE first_name LIKE '%Som%';

SHOW INDEX FROM Customer;
SHOW VARIABLES WHERE Variable_name IN ('innodb_buffer_pool_size','innodb_flush_log_at_trx_commit','sync_binlog');
SHOW ENGINE INNODB STATUS;

SHOW CREATE TABLE Payment;
SHOW CREATE TABLE PawnTicket;
SHOW TRIGGERS LIKE 'Payment';

SELECT * FROM performance_schema.events_waits_summary_global_by_event_name ORDER BY SUM_TIMER_WAIT DESC LIMIT 20;

