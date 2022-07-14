<template>
  <div class="home">
    <input

        v-model = 'fileName'
        placeholder="請輸入文件名"
      />
      <button type="primary" @click='downfile'>
        下載
      </button>
      <button style = 'margin-left:20px;' @click = 'stopDonwload'>暫停下載</button>
  </div>
</template>

<script>
import axios from 'axios';
import { asyncPool } from '@krlwlfrt/async-pool/lib/async-pool';

export default {
  data() {
    return {
      fileName: '20MB.pdf',
      SIZE: 10 * 1024 * 1024, // 切片:10MB
    };
  },
  methods: {
    async downfile() {
      const name = this.fileName ? this.fileName : '20MB.pdf';
      // SIZE为分片大小;每10MB為一切片
      const { SIZE } = this;
      const contentLength = await this.filesize(name);
      const chunks = Math.ceil(contentLength / SIZE); // 每10MB一片，總共分幾片
      const chunksl = [...new Array(chunks).keys()];

      // 大文件下載 使用併發 使用了asyncPool庫件
      const results = [];
      await asyncPool(3, chunksl, async (i) => {
        const start = i * SIZE;
        const end = i + 1 === chunks ? contentLength : (i + 1) * SIZE - 1;
        const result = await this.getBinaryContent(start, end, i);
        return result;
      }).then((result) => {
        results.push(result);
        return results;
      }).then(async (resArr) => {
        const res = resArr[0];
        res.sort((a, b) => a.index - b.index);
        const arr = await res.map((r) => r.data);
        // 多个blob排序完合併為一個blob
        const buffers = new Blob(arr);
        this.saveAs(name, buffers);
      });
    },
    // 獲取要下載文件的大小
    filesize: async (name) => {
      const res = await axios.get(`http://localhost:3001/size/${name}`);
      return res.data.data;
    },
    // 根据傳入的參數發起範圍請求
    getBinaryContent: async (start, end, i) => {
      const name = '20MB.pdf';
      const result = await axios.get(`http://localhost:3001/down/${name}`, {
        headers: { Range: `bytes=${start}-${end}` },
        responseType: 'blob',
      });
      return { indes: i, data: result.data };
    },
    // 保存文件
    saveAs: (name, buffers, mime = 'application/octet-stream') => {
      const blob = new Blob([buffers], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = name;
      a.href = blobUrl;
      a.click();
      URL.revokeObjectURL(blob);
    },
    stopDownload: () => {
      console.log(123);
    },
  },

};
</script>
