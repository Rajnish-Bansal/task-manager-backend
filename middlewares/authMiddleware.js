// const jwt = require('jsonwebtoken');
// const SECRET_KEY = process.env.SECRET_KEY || '123456';

// exports.authenticateToken = (req, res, next) => {
//     const token = req.headers['authorization']?.split(' ')[1];

//     if (!token) {
//         return res.status(401).send('Access Denied');
//     }

//     try {
//         const decoded = jwt.verify(token, SECRET_KEY);
//         req.user = decoded;
//         next();
//     } catch (error) {
//         res.status(403).send('Invalid Token');
//     }
// };

// module.exports = authenticateToken;