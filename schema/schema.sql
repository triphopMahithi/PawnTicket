create schema project;
use project;
create table Customer (
 Customer_ID varchar(10) not null primary key,
 first_name varchar(225) not null,
 last_name varchar(225) not null,
 national_ID char(13) not null,
 date_of_birth date,
 address varchar(500) not null,
 phone_number int(10) not null,
 kyc_status enum('PENDING','PASSED','FAILED','REJECTED') not null);
 
 create table Employee (
 Staff_ID varchar(10) not null primary key,
 first_name varchar(225) not null,
 last_name varchar(225) not null,
 phone_number varchar(225) not null,
 position varchar(99) not null );
 
 create table PawnItem (
item_ID varchar(10) not null primary key,
item_Type varchar(225) not null,
description varchar(225) not null,
appraised_value decimal(12,2) not null,
item_status enum('GOLD','JEWELRY','ELECTRONICS','WATCH','OTHER') not null );
   
create table PawnTicket (
ticket_ID varchar(10) not null primary key,
Contract_Date datetime not null,
Loan_Amount decimal(12,2) not null,
interest_rate decimal(5,2) not null,
due_date_date datetime,
notice_date datetime,
contract_status enum('ACTIVE', 'ROLLED_OVER','CANCELLED','EXPIRED') not null,
Customer_ID varchar(10) not null,
Staff_ID varchar(10) not null,
item_ID varchar(10) not null,
foreign key (Customer_ID) references Customer(Customer_ID),
foreign key (Staff_ID) references Employee(Staff_ID),
foreign key (item_ID) references PawnItem(item_ID));

create table Appraisal (
appraisal_ID varchar(10) not null primary key,
appraised_value decimal(12,2) not null,
appraisal_Date datetime,
evidence blob not null,
item_ID varchar(10) not null,
Staff_ID varchar(10) not null,
foreign key (item_ID) references PawnItem(item_ID),
foreign key (Staff_ID) references Employee(Staff_ID));

create table Payment (
payment_ID varchar(10) not null primary key,
ticket_ID varchar(10) not null,
payment_date datetime,
amount_paid decimal(12,2) not null,
payment_type enum('CASH','TRANSFER','CARD','ONLINE') not null,
foreign key (ticket_ID) references PawnTicket(ticket_ID));

create table Disposition (
disposition_ID varchar(10) not null primary key,
item_ID varchar(10) not null,
sale_date datetime,
sale_method enum('AUCTION','DIRECT_SALE','ONLINE', 'SCRAP') not null,
sale_price decimal(12,2) not null,
foreign key (item_ID) references PawnItem(item_ID));
