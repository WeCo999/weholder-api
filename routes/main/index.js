const express = require('express');
const router = express.Router();
const Main = require('../../database/main/index');
const axios = require("axios");
const cheerio = require("cheerio");

router.get('/', async(req,res)=>{
    try {

        const [news, discussion,engNews,community] = await Promise.all([
            Main.findMainBoardByCode('news'),
            Main.findMainBoardByCode('discussion'),
            Main.findMainBoardByCode('engNews'),
            Main.findMainBoardByCode('community')
        ]);

        const result = {
            newsList: news,
            discussionList: discussion,
            engNewsList: engNews,
            communityList: community,

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


        // WEMIX 가격 (예외처리 포함)
        let WEMIX = {
            tradePrice: 0,
            highPrice: 0,
            lowPrice: 0,
            changeRate: 0,
            changePrice: 0
        }
        try {
            const WEMIXResponse = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=wemix-token&vs_currencies=krw,usd");
            const WEMIXdata = WEMIXResponse.data;
            WEMIX.tradePrice = WEMIXdata['wemix-token']?.krw || 0;
        } catch (e) {
            console.log("WEMIX 조회 실패", e.message);
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