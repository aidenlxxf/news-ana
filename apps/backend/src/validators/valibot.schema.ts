import * as v from "valibot";

export const formInteger = (defaultVal: number) =>
  v.pipe(
    v.optional(v.string(), defaultVal.toString()),
    v.transform((v) => Number.parseInt(v, 10)),
  );

export const formNumber = (defaultVal: number) =>
  v.pipe(
    v.optional(v.string(), defaultVal.toString()),
    v.transform((v) => Number.parseFloat(v)),
  );
