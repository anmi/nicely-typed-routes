import { Params } from './typesHelpers';

type Route<Tkey extends string> = {
  readonly key: Tkey;
  readonly params: Params<Tkey>;
};

type RouteDeclaration<Tpath extends string> = {
  readonly key: Tpath;
  readonly parse: (uri: string) => Route<Tpath> | null;
  readonly link: (route: Params<Tpath>) => string;
};

export type RouteFrom<T> = T extends RouteDeclaration<infer TPath>
  ? Route<TPath>
  : never;

type RouteCombination<TRoute> = {
  readonly parse: (uri: string) => TRoute | null;
  readonly build: (route: TRoute) => string;
  readonly add: <T2 extends string>(
    declaration: RouteDeclaration<T2>
  ) => RouteCombination<TRoute | Route<T2>>;
};

export function createRoutesDeclaration<Tpath extends string>(
  routeDeclaration: RouteDeclaration<Tpath>
): RouteCombination<Route<Tpath>> {
  const combination: RouteCombination<Route<Tpath>> = {
    parse(uri: string) {
      return routeDeclaration.parse(uri);
    },
    build(route: Route<Tpath>) {
      return routeDeclaration.link(route.params);
    },
    add<T2 extends string>(declaration: RouteDeclaration<T2>) {
      return combine(combination, declaration);
    },
  };

  return combination;
}

function combine<TRoute extends { readonly key: string }, Tpath extends string>(
  combination: RouteCombination<TRoute>,
  declaration: RouteDeclaration<Tpath>
) {
  const result: RouteCombination<TRoute | Route<Tpath>> = {
    parse(uri: string): TRoute | Route<Tpath> | null {
      return combination.parse(uri) || declaration.parse(uri);
    },
    build(route: TRoute | Route<Tpath>) {
      if (route.key === declaration.key) {
        return declaration.link((route as Route<Tpath>).params);
      }
      return combination.build(route as TRoute);
    },
    add<T2 extends string>(
      declaration2: RouteDeclaration<T2>
    ): RouteCombination<TRoute | Route<Tpath> | Route<T2>> {
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
          subtype: char === ':' ? 'str' : '',
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
            subtype: char === ':' ? 'str' : '',
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

/* eslint-disable functional/no-let, functional/prefer-readonly-type, functional/no-loop-statement, functional/immutable-data */
export function parse(pattern: string, uri: string) {
  const parsed = prepare(pattern);
  let index = 0;
  let matched = true;
  const params: { [key: string]: number | string } = {};

  parsed.forEach((block) => {
    if (block.type === 'literal') {
      const part = uri.slice(index, index + block.value.length);
      if (part !== block.value) {
        matched = false;
      }
      index += block.value.length;
    } else if (block.type === 'param') {
      let part = '';
      for (; index < uri.length; index++) {
        const char = uri.charAt(index);

        if (char !== '/') {
          part += char;
        } else {
          break;
        }
      }
      if (block.subtype === 'number') {
        const num = parseInt(part, 10);
        if (Number.isNaN(num)) {
          matched = false;
        } else {
          params[block.name] = num;
        }
      } else if (block.subtype === 'str') {
        params[block.name] = part;
      }
    }
  });

  if (!matched) {
    return null;
  }

  return params;
}
/* eslint-enable functional/no-let, functional/prefer-readonly-type, functional/no-loop-statement, functional/immutable-data */

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
      /* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
      const params = parse(pathPattern, uri) as any as Params<TPattern>;

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
