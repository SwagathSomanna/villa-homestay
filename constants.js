export const VILLA_NAME = "Anudina Kuteera";
export const PORT = 4000;
export const TARGET_TYPE = ["floor", "villa", "room"];
export const rooms = {
  R1: "Robusta",
  R2: "Arabica",
  R3: "Excelsa",
  R4: "Liberica",
};

export const floors = {
  F1: "Ground Floor - Robusta + Arabica",
  F2: "Top Floor - Excelsa + Liberica",
};
export const GUEST_LIMITS = {
  villa: {
    total: 18,
    adults: 13,
  },

  floor: {
    F1: { total: 10, adults: 7 },
    F2: { total: 8, adults: 6 },
  },

  room: {
    R1: { total: 6, adults: 4 },
    R2: { total: 4, adults: 3 },
    R3: { total: 4, adults: 3 },
    R4: { total: 4, adults: 3 },
  },
};
