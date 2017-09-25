const Koa = require('koa')
const app = new Koa()
const Router = require('koa-router')()

const router = require("./route")
const middleware = require('./middleware')

middleware(app)

app.use(Router.routes()).use(Router.allowedMethods())
router(Router)

app.listen(3000)
console.log(`app started at port 3000...`);