const path = require("path");
const fs = require('fs');

// service默认文件夹service，也可以自定义
// (pathfilename, name)
module.exports = function(dir=path.resolve(__dirname, '../../service'), contentName="service") {
    const contentRootpath = dir;
    let content = {};
    //读取指定文件夹下(dir)的所有文件并遍历
    fs.readdirSync(contentRootpath).forEach(filename => {
        //取出文件的后缀
        let extname = path.extname(filename);
        //只处理js文件
        if (extname === '.js') {
            //将文件名中去掉后缀
            let name = path.basename(filename, extname);
            //读取文件中的内容并赋值绑定
            content[name] = require(path.join(contentRootpath, filename));
        }
    });
    return async (ctx, next)=>{
        //将函数名与全局ctx绑定
        ctx[contentName] = content;
        await next();
    };
}