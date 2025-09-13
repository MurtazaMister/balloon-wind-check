import { z } from "zod";

export const RawTriplet = z.tuple([z.number(), z.number(), z.number()]);
export const RawTripletArray = z.array(RawTriplet);
