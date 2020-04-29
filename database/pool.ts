const Pool = require('pg').Pool
let pool;

var pg = require('pg');
var config = {
    user: 'zlatic',
    host: 'localhost',
    database: 'PIA',
    password: 'Lozinka.123',
    port: 5432,
};

module.exports = {
    getPool: function () {
      if (pool) return pool;
      pool = new pg.Pool(config);
      return pool;
    }
};