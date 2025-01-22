const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const mongoose = require('mongoose');
const Post = require('./models/Post');  // 이 줄 추가

app.use(bodyParser.json()); // for parsing application/json


mongoose.connect('mongodb+srv://admin:sh22767636@cluster0.wxftu.mongodb.net/')
  .then(() => console.log('MongoDB 연결 성공'))
  .catch(err => console.error('MongoDB 연결 실패:', err));


const usersFile = path.join(__dirname, "users.json"); // 사용자 데이터를 저장할 파일
const postsFile = path.join(__dirname, "posts.json"); // 사용자 데이터를 저장할 파일
let users = [];

if (fs.existsSync(usersFile)) {
  users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
}

// CORS 설정
app.use(cors());

// 게시물 데이터를 저장할 배열
let posts = [];

// POST 데이터를 처리하기 위한 설정
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 정적 파일 제공
app.use(express.static(path.join(__dirname, "public")));

// 서버 실행


// 기본 페이지
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// "게시물 읽기" 페이지
app.get("/read", function (req, res) {
  res.send("게시물을 읽는 페이지 입니다.");
});

// 특정 작성자용 페이지
app.get("/write/:name", (req, res) => {
  const { name } = req.params;
  const allowedNames = ["Jibi", "Jini", "Seobin", "Beobi", "Ddonggae", "Namgyu", "Seoyeon", "Yumin"];
  
  if (allowedNames.includes(name)) {
    res.sendFile(path.join(__dirname, "public", `write${name}.html`));
  } else {
    res.status(404).send("작성자를 찾을 수 없습니다.");
  }
});

app.delete("/post/:id", async (req, res) => {
  try {
      const { id } = req.params;
      const { username } = req.body;

      // master 계정 확인
      if (username === 'master@0422') {
          await Post.findByIdAndDelete(id);
          return res.status(200).json({ message: "게시물이 성공적으로 삭제되었습니다." });
      }

      // 일반 사용자의 경우 자신의 게시물만 삭제 가능
      const post = await Post.findById(id);
      if (!post) {
          return res.status(404).json({ error: "게시물을 찾을 수 없습니다." });
      }

      if (post.username !== username) {
          return res.status(403).json({ error: "삭제 권한이 없습니다." });
      }

      await Post.findByIdAndDelete(id);
      res.status(200).json({ message: "게시물이 성공적으로 삭제되었습니다." });
  } catch (error) {
      console.error('삭제 오류:', error);
      res.status(500).json({ error: "게시물 삭제 중 오류가 발생했습니다." });
  }
});

app.get("/warning", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "warning.html"));
});


// 게시물 작성 (POST 요청)
app.post("/post", async (req, res) => {
  try {
    const { title, description, username, category } = req.body;
    
    const post = new Post({
      title,
      description,
      username,
      category
    });

    await post.save();
    res.status(201).json({ message: "게시물이 성공적으로 작성되었습니다." });
  } catch (error) {
    console.error('게시물 작성 오류:', error);
    res.status(500).json({ error: "게시물 작성 중 오류가 발생했습니다." });
  }
});

app.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ timestamp: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "게시물 조회 중 오류가 발생했습니다." });
  }
});

// Write 페이지
app.get("/write", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "write.html"));
});


const PORT = process.env.PORT || 1313;
app.listen(PORT, () => {
  console.log(`서버가 실행 중입니다: http://localhost:${PORT}`);
});
