USE project;
-- Table Customer
CREATE INDEX idx_customer_first_name ON customer(first_name);

CREATE INDEX idx_pawnticket_customer_contract_ticket
  ON PawnTicket (Customer_ID, Contract_Date DESC, ticket_ID DESC);

-- Table PawnTicket

CREATE INDEX idx_ticket_customer_date_id ON PawnTicket (Customer_ID, Contract_Date, ticket_ID);


-- Table Payment    
CREATE INDEX idx_payment_ticket_type_date ON Payment (ticket_ID, payment_date, payment_type);

ALTER TABLE Payment
  ADD INDEX idx_payment_ticket_date_id (ticket_ID, payment_date, payment_ID);

ALTER TABLE Payment
  DROP INDEX idx_payment_ticket_date; 

-- Table Disposition
CREATE INDEX idx_disposition_item_sale_method ON Disposition(item_ID, sale_method);


ALTER TABLE Disposition
  ADD INDEX idx_disposition_item_sale (item_ID, sale_date, disposition_ID);

ALTER TABLE Disposition
  DROP INDEX idx_disposition_item,
  DROP INDEX idx_disposition_sale_date;



