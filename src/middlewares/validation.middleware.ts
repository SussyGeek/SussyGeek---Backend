import { ZodError } from "zod";
import { Response, Request, NextFunction } from "express";
import { ApiError } from "../errors/ApiError";

type SchemaType = {
  body: object,
  params: object,
  query: object
}

function validate(schema: any) {
  return (req: Request, _: Response, next: NextFunction) => {
    try {
      // Case 1: schema is a direct Zod schema for body
      if (schema?.safeParse) {
        const result = schema.safeParse(req.body);
        if (!result.success) {
          return next(formatZodError(result.error));
        }
        req.body = result.data;
        return next();
      }

      // Case 2: schema is an object with body/params/query
      const validated: Partial<SchemaType> = {};

      if (schema.body) {
        const r = schema.body.safeParse(req.body);
        if (!r.success) return next(formatZodError(r.error));
        validated.body = r.data;
      }

      if (schema.params) {
        const r = schema.params.safeParse(req.params);
        if (!r.success) return next(formatZodError(r.error));
        validated.params = r.data;
      }

      if (schema.query) {
        const r = schema.query.safeParse(req.query);
        if (!r.success) return next(formatZodError(r.error));
        validated.query = r.data;
      }

      // overwrite with validated data
      if (validated.body) req.body = validated.body;
      // @ts-ignore
      if (validated.params) req.params = validated.params;


      Object.defineProperty(req, 'query', {
        value: validated.query,
        writable: true,
        configurable: true,
      });

      return next();
    } catch (err) {
      if (err instanceof ZodError) return next(formatZodError(err));
      return next(err);
    }
  };


  function formatZodError(error: ZodError) {
    const issues = error.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
    // @ts-ignore
    return new ApiError(400, "Validation error: ", issues);
  }
}

export default validate;