const getConnection = require("../mysql");

const findMainExpectBoard = async (categoryCode) => {
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
            GROUP BY b.board_id, b.title, b.content, u.username, b.views
            ORDER BY b.created_at DESC;
        `, [categoryCode]);

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

module.exports = {findMainExpectBoard};