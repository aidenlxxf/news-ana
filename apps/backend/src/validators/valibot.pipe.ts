import {
  ArgumentMetadata,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  Optional,
  PipeTransform,
} from "@nestjs/common";
import * as v from "valibot";
import { TypeschemaOptions } from "./valibot.constants";
import { ValibotDto } from "./valibot.dto";

export interface ValidationPipeOptions {
  exceptionFactory?: <
    TSchema extends
      | v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>
      | v.BaseSchemaAsync<unknown, unknown, v.BaseIssue<unknown>>,
  >(
    error: v.ValiError<TSchema>,
  ) => Error;
}

@Injectable()
export class ValidationPipe implements PipeTransform {
  constructor(
    @Optional()
    @Inject(TypeschemaOptions)
    private readonly options?: ValidationPipeOptions,
    @Optional() protected readonly logger?: Logger,
  ) {}
  async transform(value: unknown, metadata: ArgumentMetadata) {
    if (!metadata.metatype || !this.isValibotDto(metadata.metatype)) {
      return value;
    }
    try {
      const result = await v.parseAsync(metadata.metatype.schema, value);
      return new metadata.metatype(result);
    } catch (error) {
      this.logger?.error(error, undefined, "ValidationPipe");
      if (error instanceof v.ValiError) {
        throw (
          this.options?.exceptionFactory?.(error) ??
          this.exceptionFactory(error)
        );
      }
      throw new BadRequestException(error);
    }
  }

  protected isValibotDto(type: unknown): type is ReturnType<typeof ValibotDto> {
    return (
      typeof type === "function" &&
      "_typeschema" in type &&
      type._typeschema === true
    );
  }

  protected exceptionFactory<
    TSchema extends
      | v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>
      | v.BaseSchemaAsync<unknown, unknown, v.BaseIssue<unknown>>,
  >(error: v.ValiError<TSchema>) {
    return new BadRequestException(error);
  }
}
