import jwt from 'jsonwebtoken'


function generateAccessToken(user) {
    return jwt.sign(
        {
            _id: user.user_id,
            email: user.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}

function generateRefreshToken (user) {
    return jwt.sign(
        {
            _id: user.user_id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    )
}

export {
    generateAccessToken,
    generateRefreshToken
}