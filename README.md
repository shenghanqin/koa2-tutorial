# koa2-tutorial
基于koa2定制开发规范及中间件
# Node.js log 中间件指南

## 业务场景

一个真实的项目能够在线上正常运转，版本迭代和后期维护是整个产品运行周期中至关重要的一部分，那么就需要集中记录线上问题，人工操作耗时耗力，我们自然会想到建立排查和跟踪机制，以便于我们发现和跟踪问题。而日志就是实现这种机制的关键。完善的日志记录不仅能够还原问题现场，对于统计访问数据，分析用户行为更有大大的作用。

## 记录日志的目的 

* 监控服务的运行
* 记录的日志帮助开发分析和排查问题
* 可以结合监控系统（如ELK）给出预警

## 写一个log中间件 需要了解哪些知识

### log4js

我们的log中间件是基于log4js 2.x的封装，[Log4js](https://github.com/nomiddlename/log4js-node)是NodeJS中记录日志的成熟的第三方模块，下文中也会根据中间件的使用介绍一些log4js的使用方法。	

### 日志分类

日志可以大体上分为访问日志和异常日志。访问日志一般记录客户端对项目的访问，主要是http请求。异常日志用来记录项目本身的隐藏了一些bug导致项目无法正常运行的情况，记录异常日志可以方便开发人员定位产生bug的具体位置，快速修复。
	
### 日志等级

log4js中日志输出可分为如下7个等级：

![LOG_LEVEL.957353bf.png](http://upload-images.jianshu.io/upload_images/3860275-7e8db4f9d1aed430.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

当定义了某个输出日志级别，会输出级别相等或更高级别的日志。比如： 自定义显示错误级别为error，那么会显示调用error、fatal、mark方法打印的日志。

### 日志切割

当我们的项目逐渐稳定的运行在线上环境，访问量会越来越大，那么记录日志的文件会越来越大。这样带来的麻烦就是不方便开发查看和跟踪问题，也会增大服务器的压力，也可以按照日志的类型将日志分为两个文件。但是文件依旧会很大，我们可以按照日期将日志文件分割。比如：今天会将打印的日志输出到task-2017-10-16.log文件，明天会创建并日志输出到task-2017-10-17.log文件，减小单个文件的大小不仅方便开发人员按照日期排查问题，还方便日志文件的迁移。

 
## 如何实现

### middleware/index.js

基于node.js的洋葱模型，将初始化log中间件的过程置于http-error中间件之后，这样便可以接收到除http-error中间件以外的所有中间件中的日志记录，log中间件中产生的http相关的错误再使用http-error中间件捕捉并展示错误页面。其他错误使用全局监听的错误处理。

```
 /**
   * 初始化log模块
   */
   
  // 引入log中间件
  const miLog = require('./mi-log')

  module.exports = (app) => {
	
    ...http-error中间件
  
    app.use(miLog({
      env: app.env,		// 当前环境变量
      category: 'xxxxx',		// 自定义的分类名称
      projectName: 'node-tutorial', // 项目名称
      appLogLevel: 'debug',	// 显示log级别
      dir: 'logs',			// 自定义输出log文件夹
      serverIp: ip.address()  // 服务器IP
    }));
	
	...其他中间件
		
	/**
    * 全局监听错误事件
    */
    app.on('error', (err, ctx) => {
      if (ctx) {
        ctx.status = 500;
      }
      if (ctx && ctx.log && ctx.log.error) {
        ctx.status = 500;
        if (!ctx.state.logged) {
           ctx.log.error(err.stack);
        }
      }
    })

}
```

传入参数讲解：

*	env--用于模块内不同环境切换打印日志的方式
*	category--设置一个Logger实例的类型 以区分日志
*	projectName--用于记录到日志文件中，便于追踪记录
*	appLogLevel--定义什么级别的日志需要打印出来
*	dir--根据开发者需求定义文件夹名称
*	serverIp--记录日志存在的服务器

### middleware/mi-log/logger.js 

log中间件的核心内容

```
   
  // 引入工具模块 
  const log4js = require('log4js');
  const path = require("path");
  const client = require("./client.js");

	// ALL OFF 这两个等级并不会直接在业务代码中使用
	const methods = ["trace", "debug", "info", 	"warn", "error", "fatal", "mark"];
	
	// 定义传入参数的默认值
	const baseInfo = {
	  appLogLevel: 'debug',
	  dir: 'logs',
	  category: 'default',
	  env: 'local',
	  projectName: 'default',
	  serverIp: '0.0.0.0'
	}

```

按照log4js 2.x文档中定义日志文件的输出格式


```
  const appenders = {
  	 task: {
	    type: 'dateFile',	 // 日志类型
	    filename: `${dir}/task`, // 输出文件名
	    pattern: '-yyyy-MM-dd.log',  //后缀
	    alwaysIncludePattern: true  // 是否总是有后缀名
	 }
  };
```

*	type--dateFile按照日期的格式分割日志
*  filename--将自定义的输出目录与定义的文件名拼接
*  pattern--按照日期的格式 每天新建一个日志文件

判断若是开发环境，将日志同时打印到终端，方便开发查看。

```
	if (env === "dev" || env === "local" || env === "development") {
   	appenders.out = {
      		type: "console"
    	}
	}
```

```
 const config = {
    appenders,
    categories: {
      default: {
        appenders: Object.keys(appenders),
        level: appLogLevel
      }
    }
  }
  const logger = log4js.getLogger(category);
  
  // ALL OFF 这两个等级并不会直接在业务代码中使用
  const methods = ["trace", "debug", "info", "warn", "error", "fatal", "mark"];

  const currentLevel = methods.findIndex(ele => ele === appLogLevel)



  // 将log挂在上下文上
  return async (ctx, next) => {

    log4js.configure(config);
    // level 以上级别的日志方法
    methods.forEach((method, i) => {
      if (i >= currentLevel) {
        contextLogger[method] = (message) => {
          logger[method](client(ctx, message, commonInfo))
        }
      } else {
        contextLogger[method] = () => {}
      }
    });
    ctx.log = contextLogger;
    await next()
  };

```

初始化logger函数，并返回异步函数。调用log函数打印日志时，循环logger中的方法将高于自定义级别的方法挂载到上下文上，低于自定义级别的方法赋值空函数。这里也可以不挂载到上下文上，logger方法暴露，在使用的地方按照模块化引入使用，也是一种不错的选择。

### middleware/mi-log/client.js

为了获取上下文中的请求信息和客户端信息，我们增加一个client文件， 将其一同打印到记录日志的信息中：

```
module.exports = (ctx, message, commonInfo) => {
  const {
    method,
    url,
    host,
    headers
  } = ctx.request;
  const client = {
    method,                             // 请求方式
    url,                                // 请求url
    host,                               // 请求方域名
    message,                            // 打印的错误信息
    referer: headers['referer'],        // 请求的源地址
    userAgent: headers['user-agent']    // 客户端信息采集
  }

  return JSON.stringify(Object.assign(commonInfo, client));
}
```

### middleware/mi-log/index.js

最后，将logger主函数调用时再包一层错误处理，将log中间件内部包裹的中间件中捕捉到的错误信息抛出，让全局监听错误处理函数处理。

```
const convert = require("koa-convert");
const logger = require("./logger");

module.exports = (options) => {

  const loggerMiddleware = convert(logger(options));

  return (ctx, next) => {

    return loggerMiddleware(ctx, next)
    .catch((e) => {
        if (ctx.status < 500) {
            ctx.status = 500;
        }
        ctx.log.error(e.stack);
        ctx.state.logged = true;
        ctx.throw(e); 
    });
  };
}

```


## 总结

以上，为大家介绍了如何写一个log中间件，但仅仅是一个简单的例子，还有很多不足，比如： 性能问题， 写日志其实就是磁盘I/O过程，访问量大时，频繁的写磁盘的操作，会拖慢服务器；没有与监控系统紧密结合。
log4js中还有很多知识点，可以参考[官方文档](http://logging.apache.org/log4j/2.x/)探索更多强大功能。
 
 









