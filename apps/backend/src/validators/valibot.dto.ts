import type { BaseIssue, BaseSchema, InferOutput } from "valibot";

export const ValibotDto = <
  TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
>(
  schema: TSchema,
): {
  new (
    parsed: InferOutput<TSchema>,
  ): {
    data: InferOutput<TSchema>;
  };
  schema: TSchema;
  OPENAPI_METADATA: Record<string, unknown>;
} => {
  class ValibotDtoMixin<
    S extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  > {
    static schema = schema;
    static _typeschema = true;
    static OPENAPI_METADATA = {};
    static _OPENAPI_METADATA_FACTORY() {
      // biome-ignore lint/complexity/noThisInStatic: intentional
      return this.OPENAPI_METADATA;
    }
    data: InferOutput<S>;

    constructor(parsed: InferOutput<S>) {
      this.data = parsed;
    }
  }
  return ValibotDtoMixin<TSchema>;
};
