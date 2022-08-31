import express from "express";
import { ZodiosEnpointDescriptions, EndpointError } from "@zodios/core";
import { IfEquals } from "@zodios/core/lib/utils.types";
import {
  Response,
  QueryParams,
  Body,
  Paths,
  PathParams,
  Method,
} from "@zodios/core/lib/zodios.types";
import { z, ZodAny, ZodType, ZodObject } from "zod";

type SucessCodes = 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226;

type WithContext<T, Context extends ZodObject<any>> = Context extends ZodAny
  ? T
  : T & z.infer<Context>;

export interface RequestHandler<
  Api extends ZodiosEnpointDescriptions,
  Context extends ZodObject<any>,
  M extends Method,
  Path extends Paths<Api, M>,
  ReqPath = PathParams<Path>,
  ReqBody = Body<Api, M, Path>,
  ReqQuery = QueryParams<Api, M, Path>,
  Res = Response<Api, M, Path>
> {
  (
    req: WithContext<express.Request<ReqPath, Res, ReqBody, ReqQuery>, Context>,
    res: Omit<express.Response<Res>, "status"> & {
      // rebind context to allow for type inference
      status<
        StatusCode extends number,
        API extends unknown[] = Api,
        METHOD extends Method = M,
        PATH = Path
      >(
        status: StatusCode
      ): StatusCode extends SucessCodes
        ? express.Response<Res>
        : express.Response<EndpointError<API, METHOD, PATH, StatusCode>>;
    },
    next: express.NextFunction
  ): void;
}

export interface ContextRequestHandler<Context extends ZodObject<any>> {
  (
    req: WithContext<express.Request, Context>,
    res: express.Response,
    next: express.NextFunction
  ): void;
}

export type ZodiosHandler<
  Router,
  Context extends ZodObject<any>,
  Api extends ZodiosEnpointDescriptions,
  M extends Method
> = <Path extends Paths<Api, M>>(
  path: Path,
  ...handlers: Array<RequestHandler<Api, Context, M, Path>>
) => Router;

export interface ZodiosUse<Context extends ZodObject<any>> {
  use(...handlers: Array<ContextRequestHandler<Context>>): this;
  use(handlers: Array<ContextRequestHandler<Context>>): this;
  use(path: string, ...handlers: Array<ContextRequestHandler<Context>>): this;
  use(path: string, handlers: Array<ContextRequestHandler<Context>>): this;
}

export interface ZodiosHandlers<
  Api extends ZodiosEnpointDescriptions,
  Context extends ZodObject<any>
> extends ZodiosUse<Context> {
  get: ZodiosHandler<this, Context, Api, "get">;
  post: ZodiosHandler<this, Context, Api, "post">;
  put: ZodiosHandler<this, Context, Api, "put">;
  patch: ZodiosHandler<this, Context, Api, "patch">;
  delete: ZodiosHandler<this, Context, Api, "delete">;
  options: ZodiosHandler<this, Context, Api, "options">;
  head: ZodiosHandler<this, Context, Api, "head">;
}

export interface ZodiosValidationOptions {
  /**
   * validate request parameters - default is true
   */
  validate?: boolean;
  /**
   * transform request parameters - default is false
   */
  transform?: boolean;
}

export interface ZodiosAppOptions<Context extends ZodObject<any>>
  extends ZodiosValidationOptions {
  /**
   * express app intance - default is express()
   */
  express?: ReturnType<typeof express>;
  /**
   * enable express json body parser - default is true
   */
  enableJsonBodyParser?: boolean;
  context?: Context;
}

export interface ZodiosRouterOptions<Context extends ZodObject<any>>
  extends ZodiosValidationOptions {
  /**
   * express router instance - default is express.Router
   */
  router?: ReturnType<typeof express.Router>;
  context?: Context;
}

export type ZodiosApp<
  Api extends ZodiosEnpointDescriptions,
  Context extends ZodObject<any>
> = IfEquals<
  Api,
  any,
  ReturnType<typeof express> & ZodiosUse<Context>,
  Omit<ReturnType<typeof express.Router>, Method> & ZodiosHandlers<Api, Context>
>;

export type ZodiosRouter<
  Api extends ZodiosEnpointDescriptions,
  Context extends ZodObject<any>
> = IfEquals<
  Api,
  any,
  Omit<ReturnType<typeof express.Router>, "use"> &
    ZodiosUse<Context> &
    ContextRequestHandler<Context>,
  Omit<ReturnType<typeof express.Router>, Method | "use"> &
    ZodiosHandlers<Api, Context> &
    ContextRequestHandler<Context>
>;
