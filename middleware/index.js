const path = require("path")
const ip = require("ip")

const miLog = require('./mi-log')

// const miHttpError = require('./mi-http-error')

module.exports = (app) => {

  // app.use(miHttpError({
  //   errorPageFolder: path.resolve(__dirname, '../errorPage') // 自定义错误文件夹
  // })); 

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

  // app.on("error", (err, ctx) => {
  //   if (ctx && !ctx.headerSent && ctx.status < 500) {
  //     ctx.status = 500
  //   }
  //   if (ctx && ctx.log && ctx.log.error) {
  //     if (!ctx.state.logged) {
  //       ctx.log.error(err.stack)
  //     }
  //   }
  // })  
}