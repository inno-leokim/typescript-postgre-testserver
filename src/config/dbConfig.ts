import { Pool } from "pg";

const connection = new Pool({
    user: 'yunkim',
    host: process.env.pghost || '',
    database: process.env.pgdb || 'dvdrental',
    password: process.env.pgpw || '',
    port: 5432,
    max: 5,
});

export default connection;
