const express = require('express');
const router = express.Router();
const Test = require('../../database/test/index');

router.get('/', async(req,res)=>{
    try {
        console.log("진입")
        const result = await Test.findTest();
        console.log("result=" , result);


        res.status(200).json({resultCd:"200", resultMsg: "조회성공", resultData: result });
    }catch (e) {
        console.log(e)
        res.status(500).json({resultCd:"500", resultMsg: "load fail"})
    }
});


module.exports = router;