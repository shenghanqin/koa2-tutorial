module.exports = ()=>{
  return async (ctx, next)=> {
    ctx.state = {
      __sourceMap(path){
        return path
      }
    }
    await next()
  }
}