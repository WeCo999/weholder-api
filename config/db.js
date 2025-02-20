require('dotenv').config();

const dbConfig = {
    host: "centerbeam.proxy.rlwy.net",
    port: 13139,
    user: "root",
    password: process.env.DB_PASSWORD || 'RopKTAcsXCQgaWbpiRXkxuXFIkZOKbeb', // 비밀번호만 환경 변수 사용
    database: "weholder",
    waitForConnections: true,
    connectionLimit: 30
};

module.exports = dbConfig;