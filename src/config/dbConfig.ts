import { Pool } from "pg";

const connection = new Pool({
    user: 'yunkim',
    host: process.env.pghost || '10.200.82.102',
    database: process.env.pgdb || 'dvdrental',
    password: process.env.pgpw || 'VMware1!',
    port: 5432,
    max: 5
});

export default connection;
