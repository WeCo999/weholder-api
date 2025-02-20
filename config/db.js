if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: '.env.local' }); // .env.local 명시적으로 지정
}
const dbConfig = {
    host: "centerbeam.proxy.rlwy.net",
    port: 13139,
    user: "root",
    password: process.env.DB_PASSWORD , // 비밀번호만 환경 변수 사용
    database: "weholder",
    waitForConnections: true,
    connectionLimit: 30
};

module.exports = dbConfig;