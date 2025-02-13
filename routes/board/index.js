const express = require('express');
const router = express.Router();
const Board = require('../../database/board/index');
const {verifyToken} = require("../../middleware/auth");

/*게시판 조회*/
router.get('/list', async (req, res) => {
    try {
        let {categoryCode, searchType, keyword, page = 1, pageSize = 10} = req.query;
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
        if (!title || !content || !category || !userId){
            return res.status(400).json({ resultCd:"400", resultMsg: "필수값 누락" });
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
        console.log("vote", vote)
        /*게시물 정보 가져오기*/
        result = await Board.findBoardById(boardId)
        console.log("result", result)

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

/*게시판 조회*/
router.get('/notice', async (req, res) => {
    try {
        let result = [];
        result = await Board.findNoticeList()
        result = result.map(item => ({
            ...item,
            categoryNm: "공지",  // 각 항목에 categoryNm: "공지" 추가
        }));
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
        result = transformComments(comment);
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

module.exports = router;
