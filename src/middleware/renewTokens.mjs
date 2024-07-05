import { getTokens } from "../utils/getTokens.mjs";
import jwt from "jsonwebtoken";

export function renewTokens(req, res, next){
    console.log("middleware2")

    if(res.locals.refresh){
        console.log("refresh in");
        const oldRefreshToken = req.headers.cookie.split("=")[1];
        const refreshTokenInfo = jwt.verify(oldRefreshToken, process.env.REFRESH_SIGNATURE_SECRET);
        const userLogin = refreshTokenInfo.login;
        
        const { accessToken, refreshToken } = getTokens(userLogin);
        
        res.locals.newAccessToken = accessToken;
        res.locals.newRefreshToken = refreshToken;
    }
    next();
}