const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    res.json({ message: '用户注册成功', userId: 1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const token = jwt.sign({ userId: 1 }, 'secret', { expiresIn: '1d' });
    res.json({ token, userId: 1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};