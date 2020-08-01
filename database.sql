create table msmes(
  msme_id bigserial primary key,
  msme_name text unique not null,
  msme_owner text not null,
  msme_uam char(12) not null unique,
  msme_address text not null,
  msme_phonenumber char(10) not null unique,
  msme_email text not null,
  msme_website text,
  msme_type text not null,
  msme_password  text not null
);

create table products(
  product_id bigserial primary key,
  msme_id bigserial references msmes(msme_id),
  product_name text not null,
  product_type text not null,
  product_keywords text[] not null,
  product_image text,
  product_locations text[] not null,
  product_price integer not null,
  product_likes integer not null,
  product_buy_count integer not null,  
);

create table comments(
  comment_id bigserial primary key,
  comment_body text,
  comment_by bigserial references grahak(grahak_id),
  product_id bigserial references products(product_id)
);

create table bank_representatives(
  representative_id bigserial primary key,
  representative_name text not null,
  representative_bank_name text not null,
  representative_branch_name text not null,
  representative_ifsc_code text not null,
  representative_phonenumber char(10) not null unique,
  representative_email text not null,
  representative_password text not null,
  representative_photo text,
  representative_idcard text 
);

create table women(
  woman_id bigserial primary key,
  woman_phonenumber char(10) not null unique,
  woman_name text not null,
  woman_date_of_birth text not null,
  woman_password text not null,
  woman_email text,
  woman_isaadhar boolean not null default false,
  woman_aadhar char(12) unique,
  woman_ispan boolean not null default false,
  woman_pan char(10) unique,
  woman_isbankaccount boolean not null default false,
  woman_bankaccountno text,
  woman_isemployed boolean not null default false,
  woman_wallet_no bigserial references wallets(wallet_no) not null
);

create table grahak(
  grahak_id bigserial primary key,
  grahak_name text not null,
  grahak_email text,
  grahak_phonenumber char(10) not null unique,
  grahak_password text not null
);

create table jobs(
  job_id bigserial primary key,
  job_title text not null,
  job_keywords text[],
  job_description text not null,
  job_contact char(10) not null,
  job_email text not null,
  job_msme_id bigserial references msmes(msme_id),
  job_link text,
  job_category text not null
);

create table job_applicants(
  job_application_id bigserial primary key,
  job_id bigserial not null references jobs(job_id),
  woman_id bigserial not null references women(woman_id)
);

create table wallets(
  wallet_no bigserial primary key,
  wallet_balance int not null
);

create table gullak_ledger(
  transaction_id bigserial primary key,
  from_wallet_no bigserial references wallets(wallet_no) not null,
  amnt int not null
);