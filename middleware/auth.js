const jwt = require('jsonwebtoken');
const secretKey = 'MFswDQYJKoZIhvcNAQEBBQADSgAwRwJAeswwZ+ANz25d7nMVcWkwGrEx3IVUz39/LghHQxW4lLjgXJbz4F+Dam2mNIAmukFdY0F0YzH+52xPiS33Y3FaKwIDAQAB'; // JWT를 서명하는 데 사용할 시크릿 키

exports.verifyToken = (req, res, next) => {
    if (!req.headers.authorization){
        return res.status(401).json({
            code: 401,
            message: '토큰이 유효하지 않습니다.'
        });
    }

    const token = req.headers.authorization.split('Bearer ')[1];
    // 인증 완료
    try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded; // ✅ req.user에 decoded 정보를 저장
        return next();
    }
        // 인증 실패
    catch(error) {
        if (error.name === 'TokenExpireError') {
            return res.status(401).json({
                code: 401,
                message: ' '
            });
        }
        return res.status(401).json({
            code: 401,
            message: '유효하지 않은 토큰입니다.'
        });
    }
}