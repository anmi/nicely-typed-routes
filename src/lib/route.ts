import { Params, Params2 } from './typesHelpers';

export type Route<Tkey extends string> = {
  readonly key: Tkey;
  readonly params: Params<Tkey>;
};

export type UnkwonObject = Record<string, unknown>;

export type RouteBasic<Tkey extends string, Tparams extends UnkwonObject> = {
  readonly key: Tkey;
  readonly params: Tparams;
};

export type RouteDeclaration<Tpath extends string> = {
  readonly key: Tpath;
  readonly parse: (uri: string) => Route<Tpath> | null;
  readonly link: (route: Params<Tpath>) => string;
};

export type RouteDeclarationBasic<
  Tkey extends string,
  Tparams extends Record<string, unknown>
> = {
  readonly key: Tkey;
  readonly parse: (uri: string) => RouteBasic<Tkey, Tparams> | null;
  readonly link: (route: Tparams) => string;
};

export type RouteFrom<T> = T extends RouteDeclaration<infer TPath>
  ? Route<TPath>
  : never;

export type RouteCombination<TRoute> = {
  readonly parse: (uri: string) => TRoute | null;
  readonly build: (route: TRoute) => string;
  readonly add: <T2key extends string, T2params extends UnkwonObject>(
    declaration: RouteDeclarationBasic<T2key, T2params>
  ) => RouteCombination<TRoute | RouteBasic<T2key, T2params>>;
};

export function createRoutesDeclaration<
  Tkey extends string,
  TParams extends UnkwonObject
>(
  routeDeclaration: RouteDeclarationBasic<Tkey, TParams>
): RouteCombination<RouteBasic<Tkey, TParams>> {
  const combination: RouteCombination<RouteBasic<Tkey, TParams>> = {
    parse(uri: string) {
      return routeDeclaration.parse(uri);
    },
    build(route: RouteBasic<Tkey, TParams>) {
      return routeDeclaration.link(route.params);
    },
    add<T2key extends string, T2params extends UnkwonObject>(
      declaration: RouteDeclarationBasic<T2key, T2params>
    ) {
      return combine(combination, declaration);
    },
  };

  return combination;
}

function combine<
  TRoute extends { readonly key: string },
  Tpath extends string,
  Tparams extends UnkwonObject
>(
  combination: RouteCombination<TRoute>,
  declaration: RouteDeclarationBasic<Tpath, Tparams>
) {
  const result: RouteCombination<TRoute | RouteBasic<Tpath, Tparams>> = {
    parse(uri: string): TRoute | RouteBasic<Tpath, Tparams> | null {
      return combination.parse(uri) || declaration.parse(uri);
    },
    build(route: TRoute | Route<Tpath>) {
      if (route.key === declaration.key) {
        return declaration.link((route as RouteBasic<Tpath, Tparams>).params);
      }
      return combination.build(route as TRoute);
    },
    add<T2key extends string, T2params extends UnkwonObject>(
      declaration2: RouteDeclarationBasic<T2key, T2params>
    ): RouteCombination<
      TRoute | RouteBasic<Tpath, Tparams> | RouteBasic<T2key, T2params>
    > {
      return combine(result, declaration2);
    },
  };

  return result;
}

export type CombineTwo<T1, T2> = T1 extends RouteDeclaration<infer T1path>
  ? T2 extends RouteDeclaration<infer T2path>
    ? RouteCombination<Route<T1path> | Route<T2path>>
    : never
  : never;

/* eslint-disable functional/prefer-readonly-type */
type Block =
  | { readonly type: 'literal'; value: string }
  | {
      readonly type: 'param';
      subtype: string;
      name: string;
      parsingSubtype: boolean;
      readonly notation: '{' | ':';
    };
/* eslint-enable functional/prefer-readonly-type */

/* eslint-disable functional/no-let, functional/prefer-readonly-type, functional/no-loop-statement, functional/immutable-data */
export function prepare(pattern: string) {
  const blocks: Block[] = [];
  let current: Block | null = null;

  for (let i = 0; i < pattern.length; i++) {
    const char = pattern.charAt(i);

    if (current === null) {
      if (char !== '{' && char !== ':') {
        current = { type: 'literal', value: char };
        blocks.push(current);
      } else {
        current = {
          type: 'param',
          subtype: char === ':' ? 'string' : '',
          name: '',
          parsingSubtype: false,
          notation: char as '{' | ':',
        };
        blocks.push(current);
      }
    } else {
      if (current.type === 'literal') {
        if (char !== '{' && char !== ':') {
          current.value += char;
        } else {
          current = {
            type: 'param',
            subtype: char === ':' ? 'string' : '',
            name: '',
            parsingSubtype: false,
            notation: char as '{' | ':',
          };
          blocks.push(current);
        }
      } else if (current.type === 'param') {
        if (current.notation === '{') {
          if (char === ':') {
            current.parsingSubtype = true;
          } else if (char === '}') {
            current = null;
          } else {
            if (current.parsingSubtype) {
              current.subtype += char;
            } else {
              current.name += char;
            }
          }
        } else if (current.notation === ':') {
          if (char === '/') {
            current = { type: 'literal', value: char };
            blocks.push(current);
          } else {
            current.name += char;
          }
        }
      }
    }
  }

  return blocks;
}
/* eslint-enable functional/no-let, functional/prefer-readonly-type, functional/no-loop-statement, functional/immutable-data */

type HandlerCtx = {
  readonly index: number;
  readonly url: string;
};

type MatchCtx<T> = {
  readonly result: T;
  readonly index: number;
};

type UrlTypeHandler<T> = (ctx: HandlerCtx) => MatchCtx<T> | null;
export type UrlTypeCodec<T> = {
  readonly decode: (ctx: HandlerCtx) => MatchCtx<T> | null;
  readonly encode: (value: T) => string;
};

type TypesHandlersType = Record<string, UrlTypeCodec<unknown>>;

/* eslint-disable functional/no-let, functional/no-loop-statement */
export const stringParam: UrlTypeHandler<string> = ({ index, url }) => {
  let part = '';
  for (; index < url.length; index++) {
    const char = url.charAt(index);

    if (char !== '/') {
      part += char;
    } else {
      break;
    }
  }

  return {
    result: part,
    index,
  };
};
const stringCodecs: UrlTypeCodec<string> = {
  decode: stringParam,
  encode: (str) => str,
};
/* eslint-enable functional/no-let, functional/no-loop-statement */

export const numberParam: UrlTypeHandler<number> = ({ index, url }) => {
  const res = stringParam({ index, url });

  if (res === null) return null;

  const num = parseInt(res.result, 10);

  if (Number.isNaN(num)) return null;

  return {
    result: num,
    index: res.index,
  };
};

const numberCodecs: UrlTypeCodec<number> = {
  decode: numberParam,
  encode: (num) => num.toString(),
};

const defaultCodecs = {
  string: stringCodecs,
  number: numberCodecs,
};

/* eslint-disable functional/no-let, functional/prefer-readonly-type, functional/immutable-data */
export function parse(
  pattern: string,
  uri: string,
  typesHandlers: TypesHandlersType
) {
  const parsed = prepare(pattern);
  let index = 0;
  let matched = true;
  const params: { [key: string]: unknown } = {};

  parsed.forEach((block) => {
    if (block.type === 'literal') {
      const part = uri.slice(index, index + block.value.length);
      if (part !== block.value) {
        matched = false;
      }
      index += block.value.length;
    } else if (block.type === 'param') {
      const { decode } = typesHandlers[block.subtype];

      const result = decode({ index, url: uri });

      if (!result) {
        matched = false;
      } else {
        index = result.index;
        params[block.name] = result.result;
      }
    }
  });

  if (uri.length != index) {
    return null;
  }

  if (!matched) {
    return null;
  }

  return params;
}
/* eslint-enable functional/no-let, functional/prefer-readonly-type, functional/immutable-data */

/* eslint-disable functional/no-let */
export function buildUri(
  pattern: string,
  params: { readonly [key: string]: number | string }
): string {
  let result = '';
  const parsed = prepare(pattern);

  parsed.forEach((chunk) => {
    if (chunk.type === 'literal') {
      result += chunk.value;
    } else if (chunk.type === 'param') {
      result += params[chunk.name];
    }
  });

  return result;
}
/* eslint-enable functional/no-let */

export function route<TPattern extends string>(
  pathPattern: TPattern
): RouteDeclaration<TPattern> {
  return {
    key: pathPattern,
    parse(uri: string): null | Route<TPattern> {
      const params = parse(
        pathPattern,
        uri,
        defaultCodecs as TypesHandlersType
        /* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
      ) as any as Params<TPattern>;

      if (params) {
        return { key: pathPattern, params };
      }

      return null;
    },
    link(params: Params<TPattern>): string {
      /* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
      return buildUri(pathPattern, params as any);
    },
  };
}

type Parsers<TypesMap extends Record<string, unknown>> = {
  readonly [K in keyof TypesMap]: UrlTypeCodec<TypesMap[K]>
}

export function getExtendedTypesRoute<TypesMap extends UnkwonObject>(
  argsParsers: Parsers<TypesMap>
) {
  return function route2<
    TPattern extends string
    // TypesMap extends Record<string, unknown>
  >(
    pathPattern: TPattern
  ): RouteDeclarationBasic<TPattern, Params2<TPattern, TypesMap>> {
    return {
      key: pathPattern,
      parse(
        uri: string
      ): null | RouteBasic<TPattern, Params2<TPattern, TypesMap>> {
        /* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
        const params = parse(pathPattern, uri, argsParsers as any) as any as Params2<
          TPattern,
          TypesMap
        >;

        if (params) {
          return { key: pathPattern, params };
        }

        return null;
      },
      link(params: Params2<TPattern, TypesMap>): string {
        /* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
        return buildUri(pathPattern, params as any);
      },
    };
  };
}
