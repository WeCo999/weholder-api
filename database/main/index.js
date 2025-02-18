const getConnection = require("../mysql");

const findMainBoardByCode = async (categoryCode) => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        // 쿼리 실행
        const [rows, fields] = await conn.promise().query(`
            SELECT
                b.board_id AS id,
                b.title,
                b.content,
                u.username,
                b.views,
                DATE_FORMAT(b.created_at, '%Y-%m-%d %H:%i:%s') AS date,
                COUNT(cm.comment_id) AS commentCnt
            FROM Board b
                     LEFT JOIN User u ON b.user_id = u.user_id
                     LEFT JOIN Category c ON b.category_id = c.category_id
                     LEFT JOIN Comment cm ON b.board_id = cm.board_id
            WHERE c.code = ?
              AND b.is_deleted = 0  -- 삭제되지 않은 게시글만 조회
            GROUP BY b.board_id, b.title, b.content, u.username, b.views
            ORDER BY b.created_at DESC
            LIMIT 10;
        `, [categoryCode]);

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
const findMainBoardByCodes = async (categoryCodes) => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        // 쿼리 실행: categoryCodes가 배열인 경우, IN 조건을 사용하여 여러 카테고리를 조회
        const [rows, fields] = await conn.promise().query(`
            SELECT
                b.board_id AS id,
                b.title,
                b.content,
                u.username,
                b.views,
                DATE_FORMAT(b.created_at, '%Y-%m-%d %H:%i:%s') AS date,
                COUNT(cm.comment_id) AS commentCnt,
                c.code AS categoryCode
            FROM Board b
            LEFT JOIN User u ON b.user_id = u.user_id
            LEFT JOIN Category c ON b.category_id = c.category_id
            LEFT JOIN Comment cm ON b.board_id = cm.board_id
            WHERE c.code IN (?)  -- 여러 개의 categoryCode를 IN으로 처리
              AND b.is_deleted = 0  -- 삭제되지 않은 게시글만 조회
            GROUP BY b.board_id, b.title, b.content, u.username, b.views, c.code
            ORDER BY b.created_at DESC
            LIMIT 10;
        `, [categoryCodes]);

        return rows;  // 결과를 카테고리 구분 없이 하나의 리스트로 반환
    } catch (err) {
        console.error('Error executing query:', err);
        throw err;  // 에러 던지기
    } finally {
        if (conn) {
            conn.release();  // 연결 반환
        }
    }
};

module.exports = {findMainBoardByCode, findMainBoardByCodes};