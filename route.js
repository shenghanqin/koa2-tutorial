const HomeController = require("./controller/home")
module.exports = (app) => {
  app.get("/", HomeController.index)
  app.get("/user", HomeController.login)
  app.post("/user/register", HomeController.register)
}

// 改动点 start 
// module.exports = (ctx, app) => {
//   app.get("/", ctx.controller.home.index)
//   app.get("/user", ctx.controller.home.login)
//   app.post("/user/register", ctx.controller.home.register)
// }
// 改动点 end