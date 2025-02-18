const express = require('express');
const serveStatic = require("serve-static");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

const cors = require("cors");
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? 'https://www.weholder.net' // 배포 환경에서의 URL
        : 'http://localhost:3000', // 개발 환경에서의 URL
    credentials: true, // 쿠키나 인증 정보를 포함한 요청을 허용
};
app.use(cors(corsOptions));
app.use(cookieParser()); // 👈 필수! 쿠키를 읽을 수 있도록 추가
app.use(serveStatic(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: false,
    })
);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const indexRouter = require('./routes/index');
const testRouter = require('./routes/test/index');
const mainRouter = require('./routes/main/index');
const boardRouter = require('./routes/board/index');
const authRouter = require('./routes/auth/index');
const noticeRouter = require('./routes/notice/index');
app.use('/api/weholder', indexRouter);
app.use('/api/test', testRouter);
app.use('/api/main', mainRouter);
app.use('/api/board', boardRouter);
app.use('/api/auth', authRouter);
app.use('/api/notice', noticeRouter);
// 기본 라우트
app.get('/', (req, res) => {
    res.send('Hello, Express!');
});

// 서버 시작
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log('__dirname :' + __dirname);
});

module.exports = app;