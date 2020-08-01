create table wallets(
  wallet_no bigserial primary key,
  wallet_balance real not null default 0.00 
);

create table digishopkeeper(
  digishopkeeper_id bigserial primary key,
  digishopkeeper_name text not null,
  digishopkeeper_phonenumber char(10) not null unique,
  digishopkeeper_pass text not null,
  digishopkeeper_latt real not null,
  digishopkeeper_long real not null,
  digishopkeeper_wallet_no bigserial references wallets(wallet_no) not null 
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
