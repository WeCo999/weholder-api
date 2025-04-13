const express = require('express');
const router = express.Router();
const User = require('../../database/user/index');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {verifyToken} = require("../../middleware/auth");
const secretKey = 'MFswDQYJKoZIhvcNAQEBBQADSgAwRwJAeswwZ+ANz25d7nMVcWkwGrEx3IVUz39/LghHQxW4lLjgXJbz4F+Dam2mNIAmukFdY0F0YzH+52xPiS33Y3FaKwIDAQAB'; // JWT를 서명하는 데 사용할 시크릿 키

/* 로그인 */
router.post('/login', async (req, res) => {
    try {
        const { email, password, autoLogin } = req.body;

        /*필수값 체크*/
        if(!email || !password){
            return res.status(400).json({ resultCd:"400", resultMsg: "필수값 누락" });
        }
        const user = await User.findUserByEmail(email);

        if(!user){
            return res.status(400).json({ resultCd:"400", resultMsg: "계정을 찾을수없습니다." });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ resultCd: "400", resultMsg: "비밀번호가 틀렸습니다." });
        }
        const admin = ["zcad8546", "co9dae", "admin"]
        const tokenParam = {
            email: user.email,
            userId: user.user_id,
            username: user.username,
            auth:admin.includes(user.email) ? 'admin' : 'user',
        };
        const accessToken = jwt.sign(
            tokenParam,
            secretKey,
            {
                expiresIn: autoLogin ? '100y' : '1m' // 100년 또는 1시간
            }
        );

        // 리프레시 토큰 생성
        const refreshToken = jwt.sign(tokenParam, secretKey, { expiresIn: '7d' });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: process.env.NODE_ENV === 'production' ? true : false,
            secure: process.env.NODE_ENV === 'production' ? true : false, // 로컬에서는 false로 설정
            sameSite: 'none',
            maxAge: 5 * 60 * 1000 //7 * 24 * 60 * 60 * 1000 // 1일 동안 유효
        });

        return res.status(200).json({
            resultCd: "200",
            resultMsg: "로그인 했습니다.",
            token: accessToken
        });

    } catch (error) {
        res.status(500).json({
            code: 500,
            message: '서버 에러',
        });
    }
});
/*토큰 재발급*/
router.post('/refresh-token', async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            return res.status(403).json({ resultCd: "403", resultMsg: "리프레시 토큰이 없습니다." });
        }

        // 리프레시 토큰 검증
        jwt.verify(refreshToken, secretKey, async (err, decoded) => {
            console.log("err", err)
            if (err) {
                return res.status(403).json({ resultCd: "403", resultMsg: "리프레시 토큰이 유효하지 않습니다." });
            }

            // 새로운 액세스 토큰 생성
            const newToken = jwt.sign(
                { email: decoded.email, userId: decoded.userId,username: decoded.username},
                secretKey,
                { expiresIn: '1h' }
            );
            console.log("newToken", newToken)
            // 새 토큰 반환
            return res.status(200).json({
                resultCd: "200",
                resultMsg: "새로운 액세스 토큰을 발급했습니다.",
                token: newToken
            });
        });
    } catch (error) {
        console.error(error);
        return res.status(403).json({ resultCd: "403", resultMsg: "서버 에러" });
    }
});
router.post('/signup', async (req, res) => {
    try {
        const {email, password, username, walletAddress} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        //필수값 체크
        if (!email || !password || !username) {
            return res.status(200).json({resultCd: "400", resultMsg: "필수값이 누락되었습니다."});
        }

        if (email.length >= 20 || email.length < 2) {
            return res.status(200).json({ resultCd: "400", resultMsg: "아이디는 2자리 이상 20자리 미만으로 입력해주세요." });
        }

        // 중복 이메일 검사
        const emailCheck = await User.findUserByEmailIncludeDelete(email);
        if (emailCheck){
            return res.status(200).json({resultCd: "400", resultMsg: "이미 가입된 이메일입니다."});
        }

        // 중복 닉네임 검사
        const usernameCheck = await User.findUserByUsernameIncludeDelete(username);
        if (usernameCheck){
            return res.status(200).json({resultCd: "400", resultMsg: "이미 가입된 닉네임입니다."});
        }
        await User.insertUser(email, username, hashedPassword, walletAddress);

        res.status(200).json({resultCd:"200", resultMsg: "회원가입에 성공했습니다."});
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: 'server error',
        });
    }
});
router.post('/session-check',verifyToken,async (req, res) => {
    try {
        res.status(200).json({resultCd:"200", resultMsg: "session check success"})
    } catch (e) {
        console.log(e)
        res.status(401).json({resultCd:"401", resultMsg: "session check fail"})
    }
});
module.exports = router;