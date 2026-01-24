//this file is run once manually to add the villa entries to the database.
import mongoose from "mongoose";
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
    price: 5000,
  },
  {
    roomId: "R2",
    name: "Arabica",
    price: 4000,
  },
  {
    roomId: "R3",
    name: "Excelsa",
    price: 4000,
  },
  {
    roomId: "R4",
    name: "Liberica",
    price: 4000,
  },
];

const floors = [
  {
    floorId: "F1",
    name: "Ground Floor - Robusta + Arabica",
    price: 9000,
    rooms: [rooms[0], rooms[1]],
  },
  {
    floorId: "F2",
    name: "Top Floor - Excelsa + Liberica",
    price: 8000,
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
      price: 15000,
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
