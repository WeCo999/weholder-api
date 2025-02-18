const express = require('express');
const router = express.Router();
const Notice = require("../../database/notice/index");

/*공지사항 조회*/
router.get('/list', async (req, res) => {
    try {
        let result = [];
        result = await Notice.findNoticeList()
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
/*게시판 상세조회*/
router.get('/detail', async (req, res) => {
    try {
        const { noticeId } = req.query;
        let result = {};

        // 필수값 누락 처리
        if (!noticeId) {
            return res.status(200).json({ resultCd: "400", resultMsg: "필수값 누락" });
        }

        // 공지사항 정보 가져오기
        result = await Notice.findNoticeById(noticeId);
        console.log("result", result);

        // 공지가  존재하면 결과 반환
        if (result) {
            res.status(200).json({ resultCd: "200", resultMsg: "조회 성공", resultData: result });
        } else {
            res.status(404).json({ resultCd: "404", resultMsg: "게시물을 찾을 수 없습니다." });
        }

    } catch (e) {
        console.log(e);
        res.status(500).json({ resultCd: "500", resultMsg: "load fail" });
    }
});
module.exports = router;