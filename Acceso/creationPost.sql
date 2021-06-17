CREATE EXTENSION pgcrypto;

CREATE TYPE privilege AS ENUM ('admin', 'user');

CREATE TABLE users (
    name TEXT NOT NULL,
    lastname1 TEXT NOT NULL,
    lastname2 TEXT DEFAULT NULL,
    current_privilege privilege NOT NULL,
    idCard TEXT NOT NULL UNIQUE,
    idUser SERIAL PRIMARY KEY,
    password TEXT NOT NULL
);

CREATE TABLE logs (
    idAccess SERIAL PRIMARY KEY,
    accessTime timestamptz NOT NULL,
    user_fk INTEGER NOT NULL,
    FOREIGN KEY(user_fk) REFERENCES users(idUser) ON DELETE CASCADE ON UPDATE CASCADE
);
