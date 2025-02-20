const getConnection = require("../mysql");

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
            and   u.is_deleted = 0
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
            and u.is_deleted = 0
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
        const data = {
            email: email,
            username: username,
            password: password,
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

const updateUsername = async (userId, username) => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        // 쿼리 실행 (사용자 정보 업데이트)
        const [result] = await conn.promise().query(`
            UPDATE User 
            SET username = ?
            WHERE user_id = ?
        `, [ username, userId]);  // userId 값으로 조건을 걸어줍니다.

        console.log('사용자 정보가 성공적으로 업데이트되었습니다.', result);
        return result;  // 업데이트 결과 반환
    } catch (err) {
        console.error('Error executing query:', err);
        throw err;  // 에러 던지기
    } finally {
        if (conn) {
            conn.release();  // 연결 반환
        }
    }
};

const deleteUser = async (userId) => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        // 사용자 삭제 쿼리 실행
        const [result] = await conn.promise().query(`
            UPDATE User SET is_deleted = 1 WHERE user_id = ?
        `, [userId]);


        console.log('사용자 삭제 성공:', result);
        return result;
    } catch (err) {
        console.error('회원 삭제 중 오류 발생:', err);
        throw err;
    } finally {
        if (conn) {
            conn.release(); // 연결 반환
        }
    }
};

const updatePassword = async (userId, newPassword) => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        // 비밀번호 업데이트
        const [result] = await conn.promise().query(`
            UPDATE User 
            SET password = ? 
            WHERE user_id = ? AND is_deleted = 0
        `, [newPassword, userId]);

        console.log('비밀번호 변경 성공:', result);
        return result;
    } catch (err) {
        console.error('비밀번호 변경 중 오류 발생:', err);
        throw err;
    } finally {
        if (conn) {
            conn.release(); // 연결 반환
        }
    }
};

module.exports = {findUserByEmail, findUserByUsername, insertUser, updateUsername, deleteUser, updatePassword};
