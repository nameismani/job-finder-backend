const checkUserActivity = (req,res,next) => {
    if(req.session.checkUserActivity.inActiveUser){
     console.log("user_inactive")
     res.writeHead(301, { location: "/lockout/page"  });
     res.end()
    }else{
        next()
    }
  }

export default checkUserActivity