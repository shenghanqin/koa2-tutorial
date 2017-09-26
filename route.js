module.exports = (ctx, app) => {
  app.get("/", ctx.controller.home.index)
  app.get("/user", ctx.controller.home.login)
  app.post("/user/register", ctx.controller.home.register)
}