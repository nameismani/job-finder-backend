const sessionAuth = (req, res, next) => {
    if (req.session.loggedin) {
    //   res.locals.user = req.session;
      console.log("sessionAuth in");
      next();
    } else {
      console.log("sessionAuth else");
      res.writeHead(301, { location: "/" });
      res.end();
    }
  };

export default sessionAuth