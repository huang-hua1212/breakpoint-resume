const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');






router.get('/size/:name', (req, res) => {
    let filePath = path.resolve('./' + req.params.name)
    //獲取文件的大小
    let size = fs.statSync(filePath).size || null
    console.log('下載文件大小' + size)
    res.send({
        msg: 'ok',
        data: size.toString()
    })
})

router.get("/down/:name", (req, res) => {
    let filename = req.params.name;
    //獲取文件的位置 和文件的大小
    let filePath = path.resolve('./'+filename);
    let size = fs.statSync(filePath).size;
    //獲取request header的range字段
    let range = req.headers["range"];
    let index = req.headers["index"];
    let file = path.resolve('./'+filename);
    //不使用分片下載  直接傳輸文件
    if (!range) {
        res.set({
            "Content-Type": "application/octet-stream",
            "Content-Disposition": `attachment; filename=${filename}`,
        });
        fs.createReadStream(file).pipe(res);
        return;
    }
    //獲取分片的開始和结束位置
    let bytesV = range.split("=");
    bytesV.shift()
    let [start, end] = bytesV.join('').split("-");
    start = Number(start)
    end = Number(end)
    //分片開始 结束位置不對 拒绝下載
    if (start > size || end > size) {
        res.set({ "Content-Range": `bytes */${size}` });
        res.status(416).send(null);
        return;
    }
    //開始分片下載
    res.status(206);
    res.set({
        "Accept-Ranges": "bytes",
        "Content-Range": `bytes ${start}-${end ? end : size}/${size}`,
    });

    console.log(start + '---' + end)
    calculateHash(file)
    // 下載
    fs.createReadStream(file, { start, end }).pipe(res);
    // 斷點續傳，儲存FILE CHUNK TO /target/[hash_name]
    const chunkName = calculateHash(file);
    var dir = './target/' + chunkName;
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    const inputStream = fs.createReadStream(file, { start, end });
    const chunkPath = path.resolve(dir + '/' + chunkName + '_' + index);
    const outputStream = fs.createWriteStream(chunkPath);
    inputStream.pipe(outputStream);
});


router.get('',(req, res)=>{
    
});

// calculate file hash，as the fileName
function calculateHash(file = './20MB.pdf', range){
    const fileBuffer = fs.readFileSync(file);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const hex = hashSum.digest('hex');
    return hex;
}




module.exports = router;