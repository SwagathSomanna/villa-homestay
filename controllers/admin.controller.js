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
    const adminName = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Both username and password are required" });
    }

    if (username !== adminName || password !== adminPassword) {
      return res.status(401).json({ message: "Incorrect Credentials" });
    }

    const accessToken = generateAccessToken();
    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .json({ message: "Login Successful" });
  } catch (error) {
    return res.json(500).json({ message: "something went wrong" });
  }
};
