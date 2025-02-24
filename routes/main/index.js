const express = require('express');
const router = express.Router();
const Main = require('../../database/main/index');

router.get('/', async(req,res)=>{
    try {
        const wemadeCodes = ['expect', 'worry'];
        const coinCodes = ['kleva', 'kroma', 'cross', 'etcCoin'];
        const gameCodes = ['lostSword', 'ymir', 'nightCrows', 'mir4', 'mir5', 'war', 'etcGame'];

        const [humor, wemade, coin, game, politics, discussion] = await Promise.all([
            Main.findMainBoardByCode('humor'),
            Main.findMainBoardByCodes(wemadeCodes),
            Main.findMainBoardByCodes(coinCodes),
            Main.findMainBoardByCodes(gameCodes),
            Main.findMainBoardByCode('politics'),
            Main.findMainBoardByCode('discussion')
        ]);

        const result = {
            wemadeList: wemade,
            coinList: coin,
            gameList: game,
            politicsList: politics,
            discussionList: discussion,
            humorList: humor
        };
        res.status(200).json({resultCd:"200", resultMsg: "조회성공", resultData: result });
    }catch (e) {
        console.log(e)
        res.status(500).json({resultCd:"500", resultMsg: "load fail"})
    }
});


module.exports = router;