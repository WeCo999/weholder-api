const mysql = require('mysql2');
const config = require('../db.config.json');
let pool = mysql.createPool(config);

function getConnection() {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, conn) => {
            if (err) {
                reject(new Error('Error connecting to the database: ' + err.message));
            } else {
                resolve(conn);
            }
        });
    });
}

module.exports = getConnection;