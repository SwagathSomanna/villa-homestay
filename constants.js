export const VILLA_NAME = "Anudina Kuteera";
export const PORT = 4000;
export const TARGET_TYPE = ["floor", "villa", "room"];
export const FLOORS = ["F1", "F2"];
export const ROOMS = ["R1", "R2"];
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
