const express = require('express');
const router = express.Router();
const Main = require('../../database/main/index');
const axios = require("axios");
const cheerio = require("cheerio");

router.get('/', async(req,res)=>{
    try {
        const wemadeCodes = ['expect', 'worry'];
        const coinCodes = ['kleva', 'kroma', 'cross', 'etcCoin'];
        const gameCodes = ['lostSword', 'ymir', 'nightCrows', 'mir4', 'mir5', 'war', 'etcGame'];

        const [wemade, coin, game, politics, discussion] = await Promise.all([
            //Main.findMainBoardByCode('humor'),
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
            discussionList: discussion
            //humorList: humor
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

        /*위메이드 주가*/
        const stockCode = '112040';
        const { data } = await axios.get(`https://finance.naver.com/item/main.nhn?code=${stockCode}`);
        const $ = cheerio.load(data);
        // 현재 주가 가져오기
        const price = $(".no_today .blind").first().text().trim();

        const changeInfo = $(".no_exday .blind");
        const changeAmount = changeInfo.eq(0).text().trim(); // 변동 금액
        const changePercent = changeInfo.eq(1).text().trim(); // 변동 퍼센트

        const dayHigh = $(".no_info .blind").eq(1).text().trim(); // 고가
        const dayLow = $(".no_info .blind").eq(5).text().trim(); // 저가

        const isDown = $(".no_exday .ico.down").length > 0; // 하락 여부
        const isUp = $(".no_exday .ico.up").length > 0; // 상승 여부

        const WEMADE = {
            price: price, //현재가
            changeAmount: changeAmount,
            changeRate: parseFloat(changePercent),
            high: dayHigh,
            low: dayLow,
            isDown: isDown,  // 하락 여부 true/false
            isUp: isUp   // 상승 여부 true/false
        }

        const WEMIXResponse  = await axios.get("https://api.bithumb.com/v1/ticker?markets=KRW-WEMIX");

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
            KLEVA: KLEVA,
            WEMADE: WEMADE
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