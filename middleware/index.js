const path = require("path")
const ip = require("ip")
const views = require("koa-views")
const nunjucks = require('nunjucks')
const staticFiles = require('koa-static')
const BodyParser = require('koa-bodyparser')


const miLog = require('./mi-log')
const miHttpError = require('./mi-http-error')
const miSend = require('./mi-send')
const miRule = require('./mi-rule')
const miInit = require('./mi-init')

const nunjucksEnvironment = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(path.join(__dirname, '../views'))
)

module.exports = (app) => {

  app.use(miHttpError({
    errorPageFolder: path.resolve(__dirname, '../errorPage') // 自定义错误文件夹
  })); 

  /**
   * 记录URL以及页面执行时间
   */
  app.use(async (ctx, next) => {
    let start = Date.now()
    await next()
    let delta = Date.now() - start
    ctx.log && ctx.log.info({
      responseTime: delta
    })
  })

  /**
   * 初始化log
   */
  app.use(miLog(app.env, {
    env: app.env,
    category: 'xxxxx',
    projectName: 'node-tutorial',
    appLogLevel: 'debug',
    dir: 'logs',
    serverIp: ip.address()
  }));

  app.use(views(path.join(__dirname, '../views'), {
    options: {
      nunjucksEnv: nunjucksEnvironment
    },
    map: {
      html: "nunjucks"
    }
  }))
  app.use(staticFiles(path.resolve(__dirname, "../public")))
  
  app.use(BodyParser())

  // 增加 send json
  app.use(miSend())

  // add rule middleware
  app.use(miRule(path.resolve(__dirname, '../service'), "service"))
  app.use(miRule(path.resolve(__dirname, '../controller'), "controller"))

  app.use(miInit())
  
  app.on("error", (err, ctx) => {
    if (ctx && !ctx.headerSent && ctx.status < 500) {
      ctx.status = 500
    }
    if (ctx && ctx.log && ctx.log.error) {
      if (!ctx.state.logged) {
        ctx.log.error(err.stack)
      }
    }
  })  
}