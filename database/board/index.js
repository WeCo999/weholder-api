const getConnection = require("../mysql");
const dayjs = require('dayjs');

/*전체조회*/
const findTotalList = async (searchType, keyword, page = 1, pageSize = 10) => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        // 기본 쿼리
        let query = `
            SELECT 
                b.board_id AS id, 
                c.code AS categoryCd, 
                c.name AS categoryNm, 
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
            WHERE b.is_deleted = 0  
        `;

        // 검색 조건 추가
        const queryParams = [];

        if (searchType && keyword) {
            if (searchType === 'title') {
                query += ` AND b.title LIKE ? `;
                queryParams.push(`%${keyword}%`);
            } else if (searchType === 'username') {
                query += ` AND u.username LIKE ? `;
                queryParams.push(`%${keyword}%`);
            }
        }

        query += ` GROUP BY b.board_id, b.title, b.content, u.username, b.views, b.created_at, c.code, c.name
                   ORDER BY b.created_at DESC`;

        // 페이징 처리
        const offset = (page - 1) * pageSize;
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(pageSize, offset);

        // 쿼리 실행
        const [rows, fields] = await conn.promise().query(query, queryParams);

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
/*전체 조회 카운트*/
const getTotalCount = async (searchType, keyword) => {
    let conn;
    try {
        conn = await getConnection();

        let query = `SELECT COUNT(*) AS totalCnt FROM Board b WHERE b.is_deleted = 0`;
        const queryParams = [];

        // 검색 조건 추가 (AND로 연결)
        if (searchType && keyword) {
            if (searchType === 'title') {
                query += ` AND b.title LIKE ?`;
            } else if (searchType === 'username') {
                query += ` AND EXISTS (
                    SELECT 1 FROM User u WHERE u.user_id = b.user_id AND u.username LIKE ?
                )`;
            }
            queryParams.push(`%${keyword}%`);
        }

        const [rows, fields] = await conn.promise().query(query, queryParams);

        return rows[0].totalCnt;  // 게시물의 총 개수를 반환
    } catch (err) {
        console.error('Error executing query:', err);
        throw err;
    } finally {
        if (conn) {
            conn.release();
        }
    }
};

/*게시판 종류 검색*/
const findBoardListV1 = async (categoryCode, searchType, keyword) => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        // 기본 쿼리
        let query = `
            SELECT 
                b.board_id as id, 
                c.code as categoryCd, 
                c.name as categoryNm, 
                b.title, 
                b.content, 
                u.username, 
                b.views, 
                COUNT(cm.comment_id) AS commentCnt,
                DATE_FORMAT(b.created_at, '%Y-%m-%d %H:%i:%s') AS date
            FROM Board b
            LEFT JOIN User u ON b.user_id = u.user_id
            LEFT JOIN Category c ON b.category_id = c.category_id
            LEFT JOIN Comment cm ON b.board_id = cm.board_id
            WHERE c.code = ?
            AND b.is_deleted = 0 
        `;

        // 검색 조건 추가
        const queryParams = [categoryCode];

        if (searchType && keyword) {
            if (searchType === 'title') {
                query += ` AND b.title LIKE ? `;
                queryParams.push(`%${keyword}%`);
            } else if (searchType === 'username') {
                query += ` AND u.username LIKE ? `;
                queryParams.push(`%${keyword}%`);
            }
        }

        query += ` GROUP BY b.board_id, b.title, b.content, u.username, b.views, c.code, c.name
                   ORDER BY b.created_at DESC;`;

        // 쿼리 실행
        const [rows, fields] = await conn.promise().query(query, queryParams);

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
/*게시판 검색 조회 총 갯수*/
const getBoardCountByCategory = async (categoryCode, searchType, keyword) => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        // 기본 쿼리
        let query = `
            SELECT COUNT(*) AS totalCnt
            FROM Board b
            LEFT JOIN Category c ON b.category_id = c.category_id
            LEFT JOIN User u ON b.user_id = u.user_id
        `;

        // 카테고리 조건 추가
        query += ` WHERE c.code = ? AND b.is_deleted = 0`;

        // 검색 조건 추가
        const queryParams = [categoryCode];

        if (searchType && keyword) {
            if (searchType === 'title') {
                query += ` AND b.title LIKE ? `;
                queryParams.push(`%${keyword}%`);
            } else if (searchType === 'username') {
                query += ` AND u.username LIKE ? `;
                queryParams.push(`%${keyword}%`);
            }
        }

        // 쿼리 실행
        const [rows, fields] = await conn.promise().query(query, queryParams);

        return rows[0].totalCnt;  // 게시물의 총 개수를 반환
    } catch (err) {
        console.error('Error executing query:', err);
        throw err;  // 에러 던지기
    } finally {
        if (conn) {
            conn.release();  // 연결 반환
        }
    }
};

/* 게시글 삽입 */
const insertBoard = async (title, content, categoryId, userId) => {
    let conn;
    try {// 연결 가져오기
        conn = await getConnection();
        const data = {
            title: title,
            content: content,
            category_id: categoryId,
            user_id: userId
        };
        // 쿼리 실행 (게시글 삽입)
        const [result] = await conn.promise().query('INSERT INTO Board set ?',data);

        console.log('게시글이 성공적으로 삽입되었습니다.', result);
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

/*게시글 수정*/
const updateBoard = async (boardId, title, content, userId) => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        // 해당 게시글이 존재하는지 확인 (작성자가 일치하는지도 확인)
        const [rows] = await conn.promise().query(
            'SELECT * FROM Board WHERE board_id = ? AND user_id = ?',
            [boardId, userId]
        );

        if (rows.length === 0) {
            throw new Error("게시글을 찾을 수 없거나 수정 권한이 없습니다.");
        }

        // 게시글 수정 쿼리 실행
        const [result] = await conn.promise().query(
            'UPDATE Board SET title = ?, content = ? WHERE board_id = ?',
            [title, content, boardId]
        );

        if (result.affectedRows > 0) {
            console.log("게시글이 성공적으로 수정되었습니다.");
            return { success: true, message: "게시글이 성공적으로 수정되었습니다." };
        } else {
            console.error("게시글 수정 실패");
            return { success: false, message: "게시글 수정 실패" };
        }
    } catch (err) {
        console.error("Error executing query:", err);
        throw err; // 에러 던지기
    } finally {
        if (conn) {
            conn.release(); // 연결 반환
        }
    }
};

/*상세조회*/
const findBoardById = async (boardId) => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        await conn.promise().query(`
            UPDATE Board
            SET views = views + 1
            WHERE board_id = ?;
        `, [boardId]);

        // 쿼리 실행
        const [rows, fields] = await conn.promise().query(`
            SELECT b.board_id as id, b.title, b.content, u.username, u.email, b.views, DATE_FORMAT(b.created_at,'%Y-%m-%d %H:%i:%s') AS date
            FROM Board b
            LEFT JOIN User u ON b.user_id = u.user_id
            LEFT JOIN Category c ON b.category_id = c.category_id
            WHERE b.board_id = ? AND b.is_deleted = 0
            LIMIT 1;
        `, [boardId]);  // boardId 값으로 조건을 걸어줍니다.

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
/*작성자 찾기*/
const findUserIdByBoardId = async (boardId) => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        // 쿼리 실행: boardId로 userId만 조회
        const [rows] = await conn.promise().query(`
            SELECT u.user_id AS userId
            FROM Board b
            LEFT JOIN User u ON b.user_id = u.user_id
            WHERE b.board_id = ? AND b.is_deleted = 0
            LIMIT 1;
        `, [boardId]);

        return rows[0] ? rows[0].userId : null;  // userId 반환 (없으면 null)
    } catch (err) {
        console.error('Error executing query:', err);
        throw err;  // 에러 던지기
    } finally {
        if (conn) {
            conn.release();  // 연결 반환
        }
    }
};

/*게시글 삭제*/
const deleteBoard = async (boardId) => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        // 게시글 삭제 쿼리 (is_deleted를 1로 업데이트)
        await conn.promise().query(`
            UPDATE Board
            SET is_deleted = 1
            WHERE board_id = ? AND is_deleted = 0;
        `, [boardId]);

        console.log(`Board with ID ${boardId} has been deleted.`);
        return { success: true, message: "게시글이 삭제되었습니다." };
    } catch (err) {
        console.error('Error executing query:', err);
        throw err;  // 에러 던지기
    } finally {
        if (conn) {
            conn.release();  // 연결 반환
        }
    }
};

/*게시판 카테고리 옵션 조회*/
const findCategoryOption = async () => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        // 쿼리 실행
        const [rows, fields] = await conn.promise().query(`
            SELECT c.code as value, c.name
            FROM Category c
        `);

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

const findCategoryByCode = async (code) => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        // 쿼리 실행
        const [rows, fields] = await conn.promise().query(`

            SELECT c.category_id as id, c.name, c.code
            FROM Category c
            WHERE c.code = ?
        `, [code]);  // boardId 값으로 조건을 걸어줍니다.

        console.log(rows);  // 결과 출력
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

/*공지사항 조회*/
const findNoticeList = async () => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        // 기본 쿼리
        let query = `
            SELECT notice_id as id,
                   title, 
                   content, 
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

/*댓글 조회*/
const findCommentByBoardId = async (boardId) => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        // 댓글 조회 쿼리 실행 (재귀적 쿼리 사용)
        const [rows] = await conn.promise().query(`
            WITH RECURSIVE comment_tree AS (
                SELECT
                    comment_id AS id,
                    board_id AS boardId,
                    parent_id AS parentId,
                    content,
                    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS date,
                    user_id,
                    is_deleted,
                0 AS depth
            FROM Comment
            WHERE board_id = ? AND parent_id IS NULL
            UNION ALL
            SELECT
                c.comment_id AS id,
                c.board_id AS boardId,
                c.parent_id AS parentId,
                c.content,
                DATE_FORMAT(c.created_at, '%Y-%m-%d %H:%i:%s') AS date, 
                c.user_id,
                c.is_deleted, 
               ct.depth + 1
            FROM Comment c
                JOIN comment_tree ct ON c.parent_id = ct.id
                )
            SELECT
                ct.id,
                ct.boardId,
                ct.parentId,
                ct.content,
                ct.date,
                ct.depth,
                ct.is_deleted as isDeleted,
                u.username,
                u.email,
                COALESCE(r.upvotes, 0) AS upvotes,  -- 추천 갯수
                COALESCE(d.downvotes, 0) AS downvotes        -- 비추천 갯수
            FROM comment_tree ct
                     JOIN User u ON ct.user_id = u.user_id
                     LEFT JOIN (
                SELECT comment_id, COUNT(*) AS upvotes
                FROM Vote
                WHERE vote_type = 1
                GROUP BY comment_id
            ) r ON ct.id = r.comment_id
                     LEFT JOIN (
                SELECT comment_id, COUNT(*) AS downvotes
                FROM Vote
                WHERE vote_type = -1
                GROUP BY comment_id
            ) d ON ct.id = d.comment_id
            ORDER BY ct.depth, ct.date;
        `, [boardId]); // boardId 값을 바인딩

        return rows; // 댓글 리스트 반환
    } catch (err) {
        console.error('Error executing query:', err);
        throw err; // 에러 던지기
    } finally {
        if (conn) {
            conn.release(); // 연결 반환
        }
    }
};

/*댓글 등록*/
const insertComment = async (boardId, parentId, userId, content) => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        // 데이터 객체 생성
        const data = {
            board_id: boardId,
            parent_id: parentId || null, // 부모 댓글이 없으면 NULL
            user_id: userId,
            content: content
        };

        // 쿼리 실행 (댓글 삽입)
        const [result] = await conn.promise().query('INSERT INTO Comment SET ?', data);

        console.log('댓글이 성공적으로 삽입되었습니다.', result);
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

/* 댓글 삭제 (is_deleted 필드 업데이트) */
const deleteComment = async (commentId) => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        // 댓글이 존재하는지 확인
        const [comment] = await conn.promise().query('SELECT * FROM Comment WHERE comment_id = ?', [commentId]);

        if (comment.length === 0) {
            throw new Error("해당 댓글을 찾을 수 없거나, 삭제 권한이 없습니다.");
        }
        if (comment[0].is_deleted === 1) {
            return { success: false, message: "이 댓글은 이미 삭제되었습니다." };
        }
        // is_deleted 필드를 1로 업데이트하여 댓글을 삭제 처리
        const [result] = await conn.promise().query('UPDATE Comment SET is_deleted = 1 WHERE comment_id = ?', [commentId]);

        if (result.affectedRows > 0) {
            console.log("댓글이 성공적으로 삭제되었습니다.");
            return { success: true, message: "댓글이 성공적으로 삭제되었습니다." };
        } else {
            console.error("댓글 삭제 실패");
            return { success: false, message: "댓글 삭제 실패" };
        }
    } catch (err) {
        console.error('Error executing query:', err);
        throw err; // 에러 던지기
    } finally {
        if (conn) {
            conn.release(); // 연결 반환
        }
    }
};

/* 댓글 조회 (ID로 댓글 찾기) */
const findCommentById = async (commentId) => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        // 댓글 조회
        const [rows] = await conn.promise().query('SELECT * FROM Comment WHERE comment_id = ?', [commentId]);

        return rows[0];  // 댓글이 존재하면 첫 번째 행 반환
    } catch (err) {
        console.error('Error executing query:', err);
        throw err;  // 에러 던지기
    } finally {
        if (conn) {
            conn.release(); // 연결 반환
        }
    }
};

/*게시판 별 추천과 비추천*/
const findVoteCountsByBoardId = async (boardId) => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        // 쿼리 실행
        const [rows, fields] = await conn.promise().query(`
            SELECT 
                board_id,
                SUM(CASE WHEN vote_type = 1 THEN 1 ELSE 0 END) AS upvotes,
                SUM(CASE WHEN vote_type = -1 THEN 1 ELSE 0 END) AS downvotes
            FROM Vote
            WHERE board_id = ?
            GROUP BY board_id;
        `, [boardId]);

        return rows[0];
    } catch (err) {
        console.error('Error executing query:', err);
        throw err;  // 에러 던지기
    } finally {
        if (conn) {
            conn.release();  // 연결 반환
        }
    }
};

/*추천 비추천 등록*/
const insertVote = async (boardId, commentId, userId, voteType = 1) => {
    let conn;
    try {
        // 연결 가져오기
        conn = await getConnection();

        // 중복 투표 확인
        let existingVote;
        if (commentId) {
            // 댓글에 대한 투표 중복 체크
            existingVote = await conn.promise().query(
                'SELECT * FROM Vote WHERE user_id = ? AND comment_id = ?',
                [userId, commentId]
            );
        } else {
            // 게시글에 대한 투표 중복 체크
            existingVote = await conn.promise().query(
                'SELECT * FROM Vote WHERE user_id = ? AND board_id = ?',
                [userId, boardId]
            );
        }

        // 중복 투표가 있으면 오류 반환
        if (existingVote[0].length > 0) {
            throw {errorCode: 'DUPLICATE_VOTE'};
        }

        // 투표 데이터 생성
        let voteData;

        if (commentId) {
            // 댓글에 대한 투표 (comment_id 사용)
            voteData = {
                user_id: userId,
                comment_id: commentId, // 댓글에 대한 투표
                vote_type: voteType, // 기본 추천 (1) 또는 비추천 (-1)
            };
        } else {
            // 게시글에 대한 투표 (board_id 사용)
            voteData = {
                user_id: userId,
                board_id: boardId, // 게시글에 대한 투표
                vote_type: voteType, // 기본 추천 (1) 또는 비추천 (-1)
            };
        }

        // 투표 삽입 쿼리 실행
        const [voteResult] = await conn.promise().query('INSERT INTO Vote SET ?', voteData);
        console.log('투표가 성공적으로 삽입되었습니다.', voteResult);

        return voteResult; // 삽입 결과 반환
    } catch (err) {
        console.error('Error executing query:', err);
        throw err; // 에러 던지기
    } finally {
        if (conn) {
            conn.release(); // 연결 반환
        }
    }
};
/*실시간 베스트글*/
const getBestBoard = async () => {
    let conn;
    try {
        conn = await getConnection();

        const query = `
            SELECT
                b.board_id AS id,
                c.code AS categoryCd,
                c.name AS categoryNm,
                b.title,
                b.content,
                u.username,
                b.views,
                DATE_FORMAT(b.created_at, '%Y-%m-%d %H:%i:%s') AS date,
                COALESCE(v.vote_count, 0) AS voteCnt,
                COALESCE(cmt.comment_count, 0) AS commentCnt,
                (b.views * 0.5 + 
                COALESCE(v.vote_count, 0) * 2 + 
                COALESCE(cmt.comment_count, 0) * 1.5) AS score
            FROM Board b
                LEFT JOIN User u ON b.user_id = u.user_id
                LEFT JOIN Category c ON b.category_id = c.category_id
                LEFT JOIN (
                SELECT board_id, COUNT(*) AS vote_count
                FROM Vote
                WHERE vote_type = 1 -- 추천만 카운트
                GROUP BY board_id
                ) v ON b.board_id = v.board_id
                LEFT JOIN (
                SELECT board_id, COUNT(*) AS comment_count
                FROM Comment
                GROUP BY board_id
                ) cmt ON b.board_id = cmt.board_id
            WHERE b.created_at >= NOW() - INTERVAL 1 DAY
              AND b.is_deleted = 0
            ORDER BY score DESC
                LIMIT 20
        `;

        const [rows] = await conn.promise().query(query);

        return rows; // 상위 20개 게시물 반환
    } catch (err) {
        console.error('Error executing query:', err);
        throw err;
    } finally {
        if (conn) {
            conn.release();
        }
    }
};

module.exports = {
    findTotalList
    , getTotalCount
    , findBoardListV1
    , getBoardCountByCategory
    , insertBoard
    , updateBoard
    , deleteBoard
    , findUserIdByBoardId
    , findCategoryOption
    , findBoardById
    , findCategoryByCode
    , findNoticeList
    , findCommentByBoardId
    , deleteComment
    , findCommentById
    , insertComment
    , findVoteCountsByBoardId
    , insertVote
    , getBestBoard
};