import jwt from "jsonwebtoken";

export const accessTokenAge = 60000;
export const refreshTokenAge = 1200000000;

export function getTokens(login) {
  return {
    accessToken: jwt.sign({ login }, process.env.ACCESS_SIGNATURE_SECRET, {
      expiresIn: "30m",
      // expiresIn: process.env.ACCESS_TOKEN_TIMESTAMP + "m",
    }),
    refreshToken: jwt.sign({ login }, process.env.REFRESH_SIGNATURE_SECRET, {
      expiresIn: "1h",
      // expiresIn: process.env.REFRESH_TOKEN_TIMESTAMP + "m",
    }),
  };
}
