import jwt from "jsonwebtoken";

export async function checkTokens(req, res, next) {
    console.log("middleware1")
    const oldAccessToken = req.headers.authorization?.split(" ")[1];
    const oldRefreshToken = req.headers.cookie?.split("=")[1];
    console.log("checkTokens ~ oldAccessToken:", oldAccessToken)
    console.log("checkTokens ~ oldRefreshToken:", oldRefreshToken)

    try{
        // const verifyAccessToken = jwt.verify(oldAccessToken, process.env.ACCESS_SIGNATURE_SECRET);
        // const accessTokenTimeLeft = verifyAccessToken.exp - new Date().getTime() / 1000;

        // if (accessTokenTimeLeft >= 1) {
        //     res.locals.refresh = true;
        // }

        // if(oldAccessToken === "null" || oldAccessToken === undefined){
            if (oldRefreshToken === undefined) {
                console.log("set login")
                res.locals.login = true;
            }

            let verifyRefreshToken = "";
            let refreshTokenTimeLeft = 0;
            
            if (oldRefreshToken !== undefined) {
                verifyRefreshToken = jwt.verify(oldRefreshToken, process.env.REFRESH_SIGNATURE_SECRET);
                refreshTokenTimeLeft = verifyRefreshToken.exp - new Date().getTime() / 1000;
            }

            // console.log("checkTokens ~ verifyRefreshToken:", verifyRefreshToken)
            // console.log("checkTokens ~ refreshTokenTimeLeft:", refreshTokenTimeLeft)
            
            // if (refreshTokenTimeLeft <= 0) {
            //     console.log("restart")
            //     res.locals.restart = true;
            // }
            
            if (refreshTokenTimeLeft >= 1) {
                res.locals.refresh = true;
            }
        // }    

        next();
    }
    catch(error){
        res.locals.restart = true;
        next();
    }
}