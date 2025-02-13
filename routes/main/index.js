const express = require('express');
const router = express.Router();
const Main = require('../../database/main/index');

router.get('/', async(req,res)=>{
    try {
        const expect = await Main.findMainExpectBoard('expect');
        const worry = await Main.findMainExpectBoard('worry');

        const result ={
            expectList: expect,
            worryList: worry
        }
        res.status(200).json({resultCd:"200", resultMsg: "조회성공", resultData: result });
    }catch (e) {
        console.log(e)
        res.status(500).json({resultCd:"500", resultMsg: "load fail"})
    }
});


module.exports = router;