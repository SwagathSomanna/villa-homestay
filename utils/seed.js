//this file is run once manually to add the villa entries to the database.
import { Villa } from "../models/villa.model.js";
import { VILLA_NAME } from "../constants.js";
import { exit } from "process";

/*
 * R1 - Robusta, R2 - Arabica, R3 - Excelsa, R4 - Liberica
 * F1 - Ground Floor(Robusta + Arabica), F2 - top floor (Excelsa + liberica)
 * Villa - Anudina Kuteera
 */

const rooms = [
  {
    roomId: "R1",
    name: "Robusta",
    price: 5990,
  },
  {
    roomId: "R2",
    name: "Arabica",
    price: 3990,
  },
  {
    roomId: "R3",
    name: "Excelsa",
    price: 4990,
  },
  {
    roomId: "R4",
    name: "Liberica",
    price: 4990,
  },
];

const floors = [
  {
    floorId: "F1",
    name: "Ground Floor - Robusta + Arabica",
    price: 8990,
    rooms: [rooms[0], rooms[1]],
  },
  {
    floorId: "F2",
    name: "Top Floor - Excelsa + Liberica",
    price: 9990,
    rooms: [rooms[2], rooms[3]],
  },
];

const addInitialPrices = async (req, res) => {
  try {
    //check if document is already created (just in case)
    //console.log(...rooms);
    const villaExists = await Villa.findOne({ name: VILLA_NAME });
    if (villaExists) {
      console.log("Values already exist");
      return null;
    }

    const createSeed = await Villa.create({
      name: VILLA_NAME,
      price: 18980,
      floors: [...floors],
    });

    if (!createSeed) {
      console.log("Unable to add initial values");
      exit(1);
    }

    console.log("Inital Prices added");
  } catch (error) {
    console.log(error.message);
  }
};

export default addInitialPrices;
