const express = require('express');
const router = express.Router();
const User = require('../../database/user/index');
const {verifyToken} = require("../../middleware/auth");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: '.env.local' }); // .env.local 명시적으로 지정
}
// 사용자 정보 업데이트 라우터
router.put("/username/update", verifyToken,async (req, res) => {
    const userId = req.user?.userId; // 로그인된 사용자 ID
    const tokenEmail = req.user?.email; // 로그인된 사용자 ID
    const { email, username } = req.body;

    try {
        if (!email || !username){
            return res.status(400).json({ resultCd:"400", resultMsg: "필수값 누락" });
        }
        if (tokenEmail !== email) {
            return res.status(400).json({ resultCd:"400", resultMsg: "자신의 이메일만 수정할 수 있습니다." });
        }

        // updateUser 함수 호출
        const result = await User.updateUsername(userId, username);
        if (result) {
            // 새로운 accessToken 생성
            const newAccessToken = jwt.sign(
                {
                    email: email,
                    userId: userId,
                    username: username,
                    auth: 'user'
                },
                process.env.SECRET_KEY,
                { expiresIn: "1h" } // 1시간 유효
            );

            return res.status(200).json({
                resultCd: "200",
                resultMsg: "닉네임 수정에 성공했습니다.",
                token: newAccessToken
            });
        } else {
            return res.status(500).json({
                resultCd: "500",
                resultMsg: "닉네임 수정 중 오류가 발생했습니다."
            });
        }
    } catch (err) {
        // 에러 발생 시 에러 메시지 반환
        console.error("사용자 정보 업데이트 오류:", err);
        res.status(500).json({
            message: "사용자 정보 업데이트 중 오류가 발생했습니다.",
            error: err.message,
            code: 500,
        });
    }
});

/*회원삭제*/
router.post('/delete', verifyToken, async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user?.userId; // 로그인된 사용자 ID
        const email = req.user?.email;

        if (!password || !userId) {
            return res.status(400).json({ resultCd: "400", resultMsg: "필수값 누락" });
        }

        // 1. 사용자 정보 조회 (비밀번호 가져오기)
        const user = await User.findUserByEmail(email);
        if (!user) {
            return res.status(400).json({ resultCd: "400", resultMsg: "사용자를 찾을 수 없습니다." });
        }

        // 2. 비밀번호 검증
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ resultCd: "400", resultMsg: "비밀번호가 일치하지 않습니다." });
        }

        const result = await User.deleteUser(userId, password);

        if (result) {
            return res.status(200).json({ resultCd: "200", resultMsg: result.message });
        } else {
            return res.status(500).json({ resultCd: "500", resultMsg: result.message });
        }

    } catch (e) {
        console.log(e);
        res.status(500).json({ resultCd: "500", resultMsg: "회원 삭제 실패" });
    }
});

/* 비밀번호 변경 */
router.put('/password/update', verifyToken, async (req, res) => {
    try {
        const userId = req.user?.userId; // 로그인된 사용자 ID
        const email = req.user?.email;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ resultCd: "400", resultMsg: "필수값 누락" });
        }

        // 1. 사용자 정보 조회 (비밀번호 가져오기)
        const user = await User.findUserByEmail(email);
        if (!user) {
            return res.status(400).json({ resultCd: "400", resultMsg: "사용자를 찾을 수 없습니다." });
        }

        // 2. 기존 비밀번호 검증
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ resultCd: "400", resultMsg: "현재 비밀번호가 일치하지 않습니다." });
        }

        // 3. 새로운 비밀번호 암호화 후 업데이트
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const result = await User.updatePassword(userId, hashedPassword);

        if (result) {
            return res.status(200).json({ resultCd: "200", resultMsg: "비밀번호 변경 성공" });
        } else {
            return res.status(500).json({ resultCd: "500", resultMsg: "비밀번호 변경 중 오류 발생" });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ resultCd: "500", resultMsg: "비밀번호 변경 실패" });
    }
});

module.exports = router;