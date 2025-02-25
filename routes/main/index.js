const express = require('express');
const router = express.Router();
const Main = require('../../database/main/index');
const axios = require("axios");

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

router.get('/price', async(req,res)=>{
    try {
        /*코인원 위믹스*/
        //const wemixResponse  = await axios.get("https://api.coinone.co.kr/public/v2/ticker/KRW/WEMIX");
        /*고팍스 위믹스*/
        //const WEMIXResponse  = await axios.get("https://api.gopax.co.kr/trading-pairs/WEMIX-KRW/stats");
        const WEMIXResponse  = await axios.get("https://api.bithumb.com/v1/ticker?markets=KRW-WEMIX");
        console.log(WEMIXResponse.data)
        let WEMIX = WEMIXResponse.data[0]
        const changeRate = calculateChangeRate(WEMIX.prev_closing_price, WEMIX.trade_price);

        WEMIX= {
            tradePrice: WEMIX.trade_price,
            highPrice: WEMIX.high_price,
            lowPrice: WEMIX.low_price,
            changeRate: changeRate,
            changePrice: WEMIX.trade_price - WEMIX.prev_closing_price
        }

        const KLEVAResponse  = await axios.get("https://api.gopax.co.kr/trading-pairs/KLEVA-KRW/stats");
        let KLEVA = KLEVAResponse.data

        KLEVA= {
            close: KLEVA.close, //종가
            low: KLEVA.low,  //저가
            high: KLEVA.high,   //고가
            open: KLEVA.open, //종가
            change: KLEVA.close - KLEVA.open,
            changeRate: Math.floor(((KLEVA.close - KLEVA.open) / KLEVA.open) * 100 * 100) / 100
        }
        const result = {
            WEMIX: WEMIX,
            KLEVA: KLEVA
        };
        res.status(200).json({resultCd:"200", resultMsg: "조회성공", resultData: result });
    }catch (e) {
        console.log(e)
        res.status(500).json({resultCd:"500", resultMsg: "load fail"})
    }
});

function calculateChangeRate(prevClosingPrice, tradePrice) {
    // 변동률 계산
    let changeRate = ((tradePrice - prevClosingPrice) / prevClosingPrice) * 100;

    // 소수점 2자리 절삭
    changeRate = Math.floor(changeRate * 100) / 100;

    // 문자열 `%` 추가
    return changeRate;
}


module.exports = router;