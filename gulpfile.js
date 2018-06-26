var gulp = require('gulp');
var less = require('gulp-less');
var browserSync = require('browser-sync').create();
var reload      = browserSync.reload;//页面强制刷新
var notify = require("gulp-notify");//提示
var concat = require('gulp-concat');//合并
let cleanCSS = require('gulp-clean-css');//css压缩
const rev = require('gulp-rev');//版本控制
var revCollector = require('gulp-rev-collector');//动态改变html引入的文件的文件名
var minifyHTML   = require('gulp-minify-html');//压缩html
var runSequence = require('run-sequence');//同步、异步处理
var del = require('del');//删除
var vinylPaths = require('vinyl-paths');//管道删除
var base64 = require('gulp-base64');//base64
var fs = require('fs');
const imagemin = require('gulp-imagemin');//图片压缩
var spriter = require('gulp-css-spriter');//把小图片合并为雪碧图
const babel = require('gulp-babel');//es6转es5
var uglify = require('gulp-uglify');//压缩js
var rename = require("gulp-rename");//重命名js
const changed = require('gulp-changed');//监视文件变动

var build = {
    images:'./build/images/',
    js:'./build/js/'
}
var src = {
    images:'./src/images/',
    js:'./src/js/'
}
gulp.task('js',function () {
    gulp.src(['./src/js/a.js','./src/js/b.js'])
        .pipe(concat('index.js'))
        .pipe(gulp.dest('./src/js'))
    gulp.src('./src/js/index.js')

        .pipe(babel({
            presets: ['env']
        }))
        .pipe(uglify())
        .pipe(rev())
        .pipe(gulp.dest('./build/js'))
        .pipe(rev.manifest())//生成一个rev-mainfest.json文件
        .pipe(gulp.dest('./rev/js'))
});
gulp.task('del',function () {
    del([
        './build/',
        './rev'
    ])
});

gulp.task('css',function () {
    gulp.src('./src/css/*.less')
        .pipe(less())
        .pipe(gulp.dest('./src/css'))
        .pipe(reload({stream: true}))
        .pipe(notify('编译less --> css [<%=file.relative %>]'));
    gulp.src(['./src/css/index.css','./src/css/header.css'])
        .pipe(concat('index.css'))
        .pipe(spriter({
            'spriteSheet': './build/images/spritesheet.png',
            'pathToSpriteSheetFromCSS': '../images/spritesheet.png'
        }))
        .pipe(base64({
            maxImageSize: 80*1024
        }))
        .pipe(cleanCSS())
        .pipe(rev())
        .pipe(gulp.dest('./build/css'))

        .pipe(rev.manifest())//生成一个rev-mainfest.json文件
        .pipe(gulp.dest('./rev/css'))
        
        .pipe(reload({stream: true}))
        .pipe(notify('合并css --> css [<%=file.relative %>]'))
});
gulp.task('images',function () {
    gulp.src('./src/images/*.*')
        .pipe(imagemin())
        .pipe(gulp.dest('./build/images'))
});
gulp.task('temp',function () {
    fs.exists('./rev/rev-manifest.json',function (aaaa) {
        console.log(aaaa);
    })
});
gulp.task('html',function () {
    gulp.src(['./rev/**/*.json','./src/*.html'])
        .pipe(changed('./src/*.html'))
        .pipe(revCollector({
            replaceReved: true,
            dirReplacements: {
                'css': 'css',
                'js': 'js',
            }
        }))
        .pipe( minifyHTML({
            empty:true,
            spare:true
        }) )
        .pipe(gulp.dest('./build/'))
        .pipe(reload({stream: true}))
});

// 静态服务器
gulp.task('default', function() {
    // gulp.src('./rev')
    //     .pipe(vinylPaths(del));
    runSequence('html','css','images','js');
    browserSync.init({
        server: {
            baseDir: "./build/"
        },
        port:8080
    });
    gulp.watch("src/css/*.less", ['images','css','html','js']);
    gulp.watch("src/*.html", ['html']);
});