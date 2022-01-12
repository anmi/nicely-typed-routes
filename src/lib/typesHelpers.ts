type NameToTypeMap = {
  readonly bool: boolean;
  readonly number: number;
  readonly string: string;
};

type RemoveSymbolFromEnd<
  TUrl,
  TSymbol extends string
> = TUrl extends `${infer S}${TSymbol}` ? S : TUrl;
type RemoveTailFromUrl<TUrl> = RemoveSymbolFromEnd<
  RemoveSymbolFromEnd<TUrl, '?'>,
  '/'
>;

type NormalizeUrlPathSegment<
  TSegment,
  TPrefix extends string
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
> = TSegment extends `{${infer _H}:${infer _T}}`
  ? TSegment
  : TSegment extends `{${infer S}}`
  ? `{${S}:string}`
  : TSegment extends `${TPrefix}${infer S}`
  ? `{${S}:string}`
  : TSegment;

type NormalizeUrlPath<
  TPath,
  TDelimiter extends string,
  TPrefix extends string
> = TPath extends `${infer H}${TDelimiter}${infer T}`
  ? `${NormalizeUrlPathSegment<H, TPrefix>}${TDelimiter}${NormalizeUrlPath<
      T,
      TDelimiter,
      TPrefix
    >}`
  : NormalizeUrlPathSegment<TPath, TPrefix>;

type NormalizeUrlWithoutTail<TUrl> = TUrl extends `${infer H}?${infer T}`
  ? `${NormalizeUrlPath<H, '/', ':'>}?${NormalizeUrlPath<T, '&', ''>}`
  : NormalizeUrlPath<TUrl, '/', ':'>;

type NormalizeUrl<TUrl> = NormalizeUrlWithoutTail<RemoveTailFromUrl<TUrl>>;

type getTypeFromMap<TName> = TName extends keyof NameToTypeMap
  ? NameToTypeMap[TName]
  : unknown;
type ParamsToUnion<TUrl> =
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TUrl extends `${infer _H}{${infer N}:${infer T}}${infer O}`
    ? readonly [N, getTypeFromMap<T>] | ParamsToUnion<O>
    : never;
type ParamsForNormalizedUrl<TUrl> = {
  readonly [K in ParamsToUnion<TUrl> as K[0]]: K[1];
};

export type Params<TUrl> = ParamsForNormalizedUrl<NormalizeUrl<TUrl>>;

type getTypeFromMap2<
  TName,
  NameToTypeMap extends Record<string, unknown>
> = TName extends keyof NameToTypeMap ? NameToTypeMap[TName] : unknown;
type ParamsToUnion2<TUrl, TypesMap extends Record<string, unknown>> =
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TUrl extends `${infer _H}{${infer N}:${infer T}}${infer O}`
    ? readonly [N, getTypeFromMap2<T, TypesMap>] | ParamsToUnion<O>
    : never;

type ParamsForNormalizedUrl2<TUrl, TypesMap extends Record<string, unknown>> = {
  readonly [K in ParamsToUnion2<TUrl, TypesMap> as K[0]]: K[1];
};

export type Params2<
  TUrl,
  TypesMap extends Record<string, unknown>
> = ParamsForNormalizedUrl2<NormalizeUrl<TUrl>, TypesMap>;
