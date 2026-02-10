import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("db connection function valled");
    console.log(
      "check env before connect",
      process.env.MONGODB_URI,
      process.env.DB_NAME,
    );
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${process.env.DB_NAME}`,
    );
    console.log(process.env.MONGODB_URI);
    console.log("DB Connected", connectionInstance.connection.host);
  } catch (error) {
    console.log(error);
  }
};

export default connectDB;
