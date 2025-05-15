const mysql = require('mysql2');
const dbConfig = require('../config/db')
let pool = mysql.createPool(dbConfig);

function getConnection() {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, conn) => {
            if (err) {
                reject(new Error('Error connecting to the database: ' + err.message));
            } else {
                // 세션 타임존 설정
                conn.query("SET time_zone = 'Asia/Seoul'", (err) => {
                    if (err) {
                        conn.release(); // 커넥션은 반드시 반환
                        reject(new Error('Failed to set time zone: ' + err.message));
                    } else {
                        resolve(conn); // 설정 성공 시 커넥션 반환
                    }
                });
            }
        });
    });
}


module.exports = getConnection;