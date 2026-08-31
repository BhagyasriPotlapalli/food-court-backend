import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const verifyToken = (req, res, next) => {
  let token = req.headers['x-access-token'] || req.headers['authorization'];

  if (!token) {
    return res.status(403).send({ message: 'No token provided!' });
  }

  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length).trimLeft();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized!' });
    }
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

export const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (user && user.role === 'Admin') {
      next();
      return;
    }
    res.status(403).send({ message: 'Require Admin Role!' });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

export const isCashier = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (user && user.role === 'Cashier') {
      next();
      return;
    }
    res.status(403).send({ message: 'Require Cashier Role!' });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
