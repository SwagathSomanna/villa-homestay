import jwt from "jsonwebtoken";

const generateAccessToken = (res) => {
  try {
    return jwt.sign(
      {
        username: process.env.ADMIN_USERNAME,
      },
      process.env.ACCESSTOKEN_SECRET,
      {
        expiresIn: process.env.ACCESSTOKEN_EXPIRY,
      },
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const login = (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Both username and password are required" });
    }
  } catch (error) {
    return res.json(500).json({ message: "something went wrong" });
  }
};
