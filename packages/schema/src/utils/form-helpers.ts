import * as v from "valibot";

export const formInteger = (defaultVal: number) =>
  v.pipe(
    v.nullish(v.string(), defaultVal.toString()),
    v.transform((v) => Number.parseInt(v, 10)),
  );

/**
 * accept empty string as null
 */
export const formNullish = <
  const TWrapped extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
>(
  wrapped: TWrapped,
) =>
  v.union([
    v.pipe(
      v.literal(""),
      v.transform(() => null),
    ),
    v.nullish(wrapped, null),
  ]);

export const formNumber = (defaultVal: number) =>
  v.pipe(
    v.nullish(v.string(), defaultVal.toString()),
    v.transform((v) => Number.parseFloat(v)),
  );
