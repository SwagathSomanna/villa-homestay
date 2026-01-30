import { Router } from "express";
import { Villa } from "../models/villa.model.js";
import { VILLA_NAME } from "../constants.js";

const router = Router();

const getPrices = async (req, res) => {
  try {
    const villaInfo = await Villa.findOne({ name: VILLA_NAME });
    return res.status(200).json(villaInfo);
  } catch (error) {
    console.log("error while fetching price", error);
    return res
      .status(500)
      .json({ message: "Something went wrong while fetching prices" });
  }
};

router.route("/pricing").get(getPrices);

export default router;
