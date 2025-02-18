/*공지사항 조회*/
const getConnection = require("../mysql");
const findNoticeList = async () => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        // 기본 쿼리
        let query = `
            SELECT notice_id as id,
                   title, 
                   u.username, 
                   n.views,
                   DATE_FORMAT(n.created_at, '%Y-%m-%d %H:%i:%s') AS date
            FROM Notice n
            LEFT JOIN User u ON n.user_id = u.user_id
            WHERE n.is_visible = 1
            AND n.is_deleted = 0
            ORDER BY n.created_at DESC;
        `;

        // 쿼리 실행
        const [rows, fields] = await conn.promise().query(query);

        console.log(rows);  // 결과 출력
        return rows;
    } catch (err) {
        console.error('Error executing query:', err);
        throw err;  // 에러 던지기
    } finally {
        if (conn) {
            conn.release();  // 연결 반환
        }
    }
};
/*공지사항 상세 조회*/
const findNoticeById = async (noticeId) => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        await conn.promise().query(`
            UPDATE Notice
            SET views = views + 1
            WHERE notice_id = ?;
        `, [noticeId]);

        // 상세 조회 쿼리
        let query =
            `SELECT notice_id AS id,
                    title, 
                    content, 
                    u.username,
                    u.email,
                    n.views,
                    DATE_FORMAT(n.created_at, '%Y-%m-%d %H:%i:%s') AS date
            FROM Notice n
            LEFT JOIN User u ON n.user_id = u.user_id
            WHERE n.is_visible = 1
            AND n.is_deleted = 0 AND n.notice_id = ?
            LIMIT 1;
             `;

        // 쿼리 실행
        const [rows, fields] = await conn.promise().query(query, [noticeId]);

        return rows[0];  // 단일 공지사항 반환
    } catch (err) {
        console.error('Error executing query:', err);
        throw err;  // 에러 던지기
    } finally {
        if (conn) {
            conn.release();  // 연결 반환
        }
    }
};
module.exports = {findNoticeList, findNoticeById};