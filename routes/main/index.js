const express = require('express');
const router = express.Router();
const Main = require('../../database/main/index');

router.get('/', async(req,res)=>{
    try {
        const coinCodes = ['kleva', 'kroma', 'cross', 'etcCoin'];
        const gameCodes = ['lostSword', 'ymir', 'nightCrows', 'mir4', 'mir5', 'war', 'etcGame'];
        const expect = await Main.findMainBoardByCode('expect');
        const worry = await Main.findMainBoardByCode('worry');
        const coin = await Main.findMainBoardByCodes(coinCodes);
        const game = await Main.findMainBoardByCodes(gameCodes);
        const politics = await Main.findMainBoardByCode('politics');
        const discussion = await Main.findMainBoardByCode('discussion');

        const result ={
            expectList: expect,
            worryList: worry,
            coinList: coin,
            gameList: game,
            politicsList: politics,
            discussionList: discussion
        }
        res.status(200).json({resultCd:"200", resultMsg: "조회성공", resultData: result });
    }catch (e) {
        console.log(e)
        res.status(500).json({resultCd:"500", resultMsg: "load fail"})
    }
});


module.exports = router;