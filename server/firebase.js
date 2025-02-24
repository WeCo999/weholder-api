const admin = require("firebase-admin");
const serviceAccount = require("./firebase-service-account.json"); // Firebase 콘솔에서 다운로드한 JSON

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "weholder-49cfc.firebasestorage.app",
});

const bucket = admin.storage().bucket();

module.exports = bucket;