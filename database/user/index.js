const getConnection = require("../mysql");
const dayjs = require("dayjs");

const findUserByEmail = async (email) => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        // 쿼리 실행
        const [rows, fields] = await conn.promise().query(`

            SELECT *
            FROM User u
            WHERE u.email = ?
        `, [email]);  // boardId 값으로 조건을 걸어줍니다.

        return rows[0];  // 하나만 나올 것이므로 첫 번째 행을 반환
    } catch (err) {
        console.error('Error executing query:', err);
        throw err;  // 에러 던지기
    } finally {
        if (conn) {
            conn.release();  // 연결 반환
        }
    }
};

const findUserByUsername = async (username) => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        // 쿼리 실행
        const [rows, fields] = await conn.promise().query(`

            SELECT *
            FROM User u
            WHERE u.username = ?
        `, [username]);  // boardId 값으로 조건을 걸어줍니다.

        return rows[0];  // 하나만 나올 것이므로 첫 번째 행을 반환
    } catch (err) {
        console.error('Error executing query:', err);
        throw err;  // 에러 던지기
    } finally {
        if (conn) {
            conn.release();  // 연결 반환
        }
    }
};
const insertUser = async (email, username, password) => {
    let conn;
    try {// 연결 가져오기
        conn = await getConnection();
        const createdAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const data = {
            email: email,
            username: username,
            password: password,
            created_at: createdAt,
        };
        // 쿼리 실행 (게시글 삽입)
        const [result] = await conn.promise().query('INSERT INTO User set ?',data);

        console.log('회권가입이 성공적으로 삽입되었습니다.', result);
        return result; // 삽입 결과 반환
    } catch (err) {
        console.error('Error executing query:', err);
        throw err; // 에러 던지기
    } finally {
        if (conn) {
            conn.release(); // 연결 반환
        }
    }
};
module.exports = {findUserByEmail, findUserByUsername, insertUser};
