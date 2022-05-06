var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
var logger = require('morgan');
var cors = require('cors'); // 跨域中间件
var multer = require('multer'); // 文件上传和下载中间件

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var router = require('./routes/router');

var app = express();

app.use(cors());
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use(router);

// 文件上传路径
let storage = multer.diskStorage({
  destination: function (req,file, cb){
    cb(null, './public/images')
  },
  // 给上传文件重命名，获取添加后缀名
  filename: function(req,file,cb){
    let fileFormat = (file.originalname).split(".");
     // 给图片加上时间戳防止重名
    // 数组最后一项为后缀名
    cb(null, file.originalname.split(".")[0] + "-" +Date.now() + "." + fileFormat[fileFormat.length-1])
  }
})

let upload = multer({
  storage
})

//图片上传接口
app.post("/image/uploadImage", upload.single("file"), (req, res) => {
  //'file'指的是file对象的key值
  let {
      size,
      mimetype,
      path
  } = req.file;
  //定义允许上传的类型
  let types = ["jpg", "png", "gif", "jpeg"];
  let tmpType = mimetype.split("/")[1];
  //限制大小800k
  if (size > 800 * 1024) {
      return res.send({
          code: -1,
          msg: "图片文件太大"
      })
  } else if (!types.includes(tmpType)) {
      return res.send({
          code: -2,
          msg: "图片后缀名不支持"
      })
  } else { 
     //上传成功后返回给前端图片url
     console.log("上传成功");
      let url = `/images/${req.file.filename}`
      res.send({
          code: 0,
          msg: "文件上传并保存成功",
          url
      })

  }

})


// session
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'blog',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: true,
    maxAge: 2592000000
  },
  store: new MongoStore({
    url: 'mongodb://localhost:27017/blog'
  })
}))

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
