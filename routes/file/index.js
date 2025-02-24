const express = require('express');
const router = express.Router();
const multer = require("multer");
const  bucket = require("../../server/firebase");
const { format } = require("util");
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
        console.error("❌ 파일이 없습니다.");
        return res.status(400).send("파일이 없습니다.");
    }

    console.log("📂 업로드된 파일:", req.file.originalname);

    const filePath = `uploads/${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(filePath);
    console.log("bucket",bucket)
    console.log("📦 Firebase Storage에 저장될 경로:", file.name);
    console.log("🚀 현재 버킷 이름:", bucket.name); // 버킷 이름 확인

    const stream = file.createWriteStream({
        metadata: {
            contentType: req.file.mimetype,
        },
    });

    stream.on("error", (err) => {
        console.error("❌ 업로드 중 오류 발생:", err);
        res.status(500).send(err);
    });

    stream.on("finish", async () => {
        console.log("✅ 업로드 완료:", file.name);

        // Storage 권한을 확인하기 위해 로그 추가
        try {
            await file.makePublic();
            console.log("🌍 파일을 공개로 설정 완료");
        } catch (err) {
            console.error("⚠️ 파일 공개 설정 실패:", err);
        }

        const publicUrl = format(
            `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media`
        );
        console.log("🔗 파일 URL:", publicUrl);

        res.send({ url: publicUrl });
    });

    stream.end(req.file.buffer);
});

module.exports = router;

