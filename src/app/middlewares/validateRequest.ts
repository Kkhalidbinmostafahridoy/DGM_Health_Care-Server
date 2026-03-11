import { NextFunction } from "express";
import { ZodObject } from "zod";

// route and controller er moddhe osongkho middleware thakte pare. tar moddhe ekta hocche validateRequest middleware. ei middleware ta request er body te je data ashtese ta zod schema onujayi validate korbe. jodi validation fail kore tahole error message return korbe, ar jodi validation pass kore tahole next() call kore controller er kache chole jabe.
const validateRequest =
  (schema: ZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // zod schema onujayi request er body te je data ashtese ta validate korbe. jodi validation fail kore tahole error message return korbe, ar jodi validation pass kore tahole next() call kore controller er kache chole jabe.
      // paseAsync method use korar karon holo zod schema onujayi request er body te je data ashtese ta validate korbe. jodi validation fail kore tahole error message return korbe, ar jodi validation pass kore tahole next() call kore controller er kache chole jabe.
      await schema.parseAsync({
        body: req.body,
      });
      return next();
    } catch (err) {
      next(err);
    }
  };

export default validateRequest;
