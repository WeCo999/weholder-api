const express = require('express');
const router = express.Router();
const Board = require('../../database/board/index');
const Notice = require('../../database/notice/index');
const {verifyToken} = require("../../middleware/auth");

/*게시판 조회*/
router.get('/list', async (req, res) => {
    try {
        let {categoryCode, searchType, keyword, page = 1, pageSize = 10} = req.query;
        let categoryCodes = [];
        page = Number(page);  // 문자열을 숫자로 변환
        pageSize = Number(pageSize);  // 문자열을 숫자로 변환
        if (isNaN(page) || isNaN(pageSize)) {
            throw new Error("Invalid page or pageSize value");
        }

        if (keyword) {
            keyword = decodeURIComponent(keyword);
        }
        let result = [];
        let totalCnt = 0;

        if (categoryCode === 'all' || !categoryCode) {
            result = await Board.findTotalList(searchType, keyword, page, pageSize);
            totalCnt = await Board.getTotalCount(searchType, keyword);
        }else if (categoryCode === 'wemade'){
            categoryCodes = ['expect', 'worry']
            result = await Board.findBoardListV2(categoryCodes, searchType, keyword, page, pageSize);
            totalCnt = await Board.getBoardCountByCategories(categoryCodes, searchType, keyword);
        }else if (categoryCode === 'coins'){
            categoryCodes = ['kleva', 'kroma', 'cross', 'etcCoin']
            result = await Board.findBoardListV2(categoryCodes, searchType, keyword, page, pageSize);
            totalCnt = await Board.getBoardCountByCategories(categoryCodes, searchType, keyword);
        }else if (categoryCode === 'game'){
            categoryCodes = ['lostSword', 'ymir', 'nightCrows', 'mir4', 'mir5', 'war', 'etcGame']
            result = await Board.findBoardListV2(categoryCodes, searchType, keyword, page, pageSize);
            totalCnt = await Board.getBoardCountByCategories(categoryCodes, searchType, keyword);
        }else{
            result = await Board.findBoardListV1(categoryCode, searchType, keyword, page, pageSize);
            totalCnt = await Board.getBoardCountByCategory(categoryCode, searchType, keyword);
        }
        const totalPage = Math.ceil(totalCnt / pageSize);

        res.status(200).json({
            resultCd: "200",
            resultMsg: "조회성공",
            resultData: result,
            pagination: {
                page: page,
                pageSize: pageSize,
                totalCnt: totalCnt,
                totalPage: totalPage
            }
        });
    } catch (e) {
        console.log(e)
        res.status(500).json({resultCd: "500", resultMsg: "load fail"})
    }
});

/*게시판 작성*/
router.post('/write',verifyToken ,async (req, res) => {
    try {
        const {title, content, category} = req.body;
        const userId = req.user?.userId;
        const email = req.user?.email;
        const admin = ["zcad8546", "co9dae", "admin"]

        if (!title || !content || !category || !userId){
            return res.status(400).json({ resultCd:"400", resultMsg: "필수값 누락" });
        }
        if (!admin.includes(email) && category === 'news') {
            return res.status(400).json({ resultCd:"400", resultMsg: "뉴스작성 권한이 없습니다." });
        }
        const findCategory = await Board.findCategoryByCode(category);

        const result = await Board.insertBoard(title, content, findCategory.id, userId);
        if (result){
            return res.status(200).json({ resultCd:"200", resultMsg: "글 작성에 성공했습니다." });
        }
        console.log("result", result)
    } catch (e) {
        console.log(e)
        res.status(500).json({resultCd: "500", resultMsg: "write fail"})
    }
});

/*게시글 수정*/
router.put('/update', verifyToken, async (req, res) => {
    try {
        const { boardId, title, category, content } = req.body;
        const userId = req.user?.userId; // 로그인된 사용자 ID
        const auth = req.user?.auth;
        if (!boardId || !title || !content || !category || !userId) {
            return res.status(400).json({ resultCd: "400", resultMsg: "필수값 누락" });
        }
        const findCategory = await Board.findCategoryByCode(category);

        const result = await Board.updateBoard(boardId, title,  findCategory.id,content, userId, auth);

        if (result.success) {
            return res.status(200).json({ resultCd: "200", resultMsg: result.message });
        } else {
            return res.status(500).json({ resultCd: "500", resultMsg: result.message });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ resultCd: "500", resultMsg: "게시글 수정 실패" });
    }
});

/*게시판 상세조회*/
router.get('/detail', async (req, res) => {
    try {
        const {boardId} = req.query;
        let result = {};
        if (!boardId) {
            return res.status(200).json({ resultCd:"400", resultMsg: "필수값 누락" });
        }
        /*추천, 비추천 가져오기*/
        const vote = await Board.findVoteCountsByBoardId(boardId);

        /*게시물 정보 가져오기*/
        result = await Board.findBoardById(boardId)


        if (vote && vote.board_id) {
            result.upvotes = vote.upvotes;
            result.downvotes = vote.downvotes;
        } else {
            // 투표 결과가 없으면 기본값 0으로 설정
            result.upvotes = 0;
            result.downvotes = 0;
        }
        res.status(200).json({resultCd: "200", resultMsg: "조회성공", resultData: result});
    } catch (e) {
        console.log(e)
        res.status(500).json({resultCd: "500", resultMsg: "load fail"})
    }
});

router.post('/delete', verifyToken, async (req, res) => {
    try {
        const { boardId } = req.body; // 삭제할 게시글 ID
        const userId = req.user?.userId; // 요청한 사용자 ID
        const auth = req.user?.auth;
        console.log(boardId, userId)
        if (!boardId || !userId) {
            return res.status(400).json({ resultCd: "400", resultMsg: "필수값 누락" });
        }

        // auth가 "admin"이면 권한 체크 없이 바로 삭제
        if (auth !== "admin") {
            // 게시글 존재 여부 확인
            const writer = await Board.findUserIdByBoardId(boardId);
            if (!writer) {
                return res.status(404).json({resultCd: "404", resultMsg: "게시글을 찾을 수 없습니다."});
            }

            // 게시글 작성자와 삭제하려는 사용자가 일치하는지 확인
            if (writer !== userId) {
                return res.status(400).json({resultCd: "400", resultMsg: "삭제 권한이 없습니다."});
            }
        }
        // 게시글 삭제 (is_deleted 값을 1로 업데이트)
        const result = await Board.deleteBoard(boardId);
        if (result.success) {
            return res.status(200).json({ resultCd: "200", resultMsg: "게시글 삭제에 성공했습니다." });
        } else {
            return res.status(500).json({ resultCd: "500", resultMsg: "게시글 삭제 실패" });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ resultCd: "500", resultMsg: "서버 오류" });
    }
});

/*카테고리 조회*/
router.get('/category', async (req, res) => {
    try {
        let result = [];
        result = await Board.findCategoryOption();

        res.status(200).json({resultCd: "200", resultMsg: "조회성공", resultData: result});
    } catch (e) {
        console.log(e)
        res.status(500).json({resultCd: "500", resultMsg: "load fail"})
    }
});

/*댓글 조회*/
router.get('/comment/list', async (req, res) => {
    try {
        const {boardId} = req.query;
        let result = [];
        const comment = await Board.findCommentByBoardId(boardId);
        // 댓글이 삭제된 경우 content를 "삭제된 댓글입니다"로 변경
        const processedComments = comment.map(c => {
            if (c.isDeleted === 1) {
                return {
                    ...c,
                    content: "삭제된 댓글입니다." // 삭제된 댓글 내용 변경
                };
            }
            return c;
        });

        result = transformComments(processedComments);
        console.log(result)
        res.status(200).json({resultCd: "200", resultMsg: "조회성공", resultData: result, cnt: comment.length});
    } catch (e) {
        console.log(e)
        res.status(500).json({resultCd: "500", resultMsg: "load fail"})
    }
});

/*댓글 등록*/
router.post('/comment', verifyToken,async (req, res) => {
    try {
        const {boardId, parentId, content} = req.body;
        const userId = req.user?.userId;

        if (!boardId || !content || !userId){
            return res.status(400).json({ resultCd:"400", resultMsg: "필수값 누락" });
        }
        const finalParentId = parentId ? parentId : null;
        const result = await Board.insertComment(boardId, finalParentId, userId, content);
        if (result){
            return res.status(200).json({ resultCd:"200", resultMsg: "댓글 등록에 성공했습니다." });
        }
    } catch (e) {
        console.log(e)
        res.status(500).json({resultCd: "500", resultMsg: "insert fail"})
    }
});

router.post('/delete-comment', verifyToken, async (req, res) => {
    try {
        const { commentId } = req.body;
        const userId = req.user?.userId; // 로그인된 사용자 ID
        const auth = req.user?.auth;

        if (!commentId || !userId) {
            return res.status(400).json({ resultCd: "400", resultMsg: "필수값 누락" });
        }
        // 댓글 조회 (댓글의 작성자와 userId 비교)
        const comment = await Board.findCommentById(commentId);

        if (!comment) {
            return res.status(404).json({ resultCd: "404", resultMsg: "댓글을 찾을 수 없습니다." });
        }

        if (auth === 'admin' || comment.user_id === userId) {
            const result = await Board.deleteComment(commentId);

            if (result.success) {
                return res.status(200).json({ resultCd: "200", resultMsg: result.message });
            } else {
                return res.status(500).json({ resultCd: "500", resultMsg: result.message });
            }
        } else {
            return res.status(400).json({ resultCd: "400", resultMsg: "본인의 댓글만 삭제할 수 있습니다." });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ resultCd: "500", resultMsg: "댓글 삭제 실패" });
    }
});

/*추천, 비추천 등록*/
router.post('/vote', verifyToken, async (req, res) => {
    try {
        const { boardId, commentId, vote } = req.body;  // 요청 본문에서 boardId, commentId, voteType 받아옴

        const userId = req.user?.userId;
        if (!vote || (!boardId && !commentId)) {
            return res.status(200).json({ resultCd: "400", resultMsg: "필수값 누락" });
        }
        if (!userId){
            return res.status(200).json({ resultCd: "400", resultMsg: "로그인이 필요합니다." });
        }

        // voteType이 1 (추천) 또는 -1 (비추천)인지 체크
        if (![1, -1].includes(vote)) {
            return res.status(200).json({ resultCd: "400", resultMsg: "유효하지 않은 voteType 값" });
        }

        // 게시글에 대한 투표 또는 댓글에 대한 투표 삽입
        const result = await Board.insertVote(boardId, commentId, userId, vote);

        if (result.error === 'DUPLICATE_VOTE') {
            return res.status(200).json({ resultCd: "409", resultMsg: "이미 추천 또는 비추천을 했습니다." });
        }

        return res.status(200).json({ resultCd: "200", resultMsg: "투표가 성공적으로 처리되었습니다." });
    } catch (error) {
        console.log("e", error);
        if (error?.errorCode === "DUPLICATE_VOTE") res.status(200).json({ resultCd: "409", resultMsg: "이미 추천 또는 비추천을 했습니다." });
        else res.status(500).json({ resultCd: "500", resultMsg: "서버 에러" });
    }
});


const transformComments = (comments) => {
    const commentMap = new Map();

    // 1. 각 댓글을 Map에 추가 (id를 key로 사용)
    comments.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // 2. 댓글과 대댓글 관계 설정
    const result = [];

    comments.forEach(comment => {
        if (comment.parentId === null) {
            result.push(commentMap.get(comment.id));
        } else {
            const parentComment = commentMap.get(comment.parentId);
            if (parentComment) {
                parentComment.replies.push(commentMap.get(comment.id));
            }
        }
    });

    return result;
};

// 상위 20개 게시물 조회 API
router.get('/best', async (req, res) => {
    try {
        const topBoards = await Board.getBestBoard();
        res.status(200).json({resultCd: "200", resultMsg: "조회성공", resultData: topBoards});
    } catch (error) {
        res.status(500).json({ success: false, message: '서버 오류 발생', error: error.message });
    }
});

/*게시판 작성*/
router.post('/complaint',verifyToken ,async (req, res) => {
    try {
        const {boardId ,title, content} = req.body;
        const userId = req.user?.userId;

        if (!title || !content || !boardId || !userId){
            return res.status(400).json({ resultCd:"400", resultMsg: "필수값 누락" });
        }
        console.log("boardId:", boardId)
        console.log("content:", content)
        console.log("title:", title)
        const result = await Board.insertComplaint(title, content, boardId, userId);
        if (result) {
            res.status(200).json({resultCd: "200", resultMsg: "등록성공"});
        }
    } catch (e) {
        console.log(e)
        res.status(500).json({resultCd: "500", resultMsg: "write fail"})
    }
});

module.exports = router;
