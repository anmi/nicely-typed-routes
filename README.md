# nicely-typed-routes

Typed routes parser with magic syntax

## What's the problem?

Declaring routes and arguments types can be full of boilerplate and there is a chance intruducting typos.

For example, using `react-router`, you have to manually extract URL params and make sure they match your types. Moreover there is not autocomplete on getting parameters, generating URLs, no typechecking.

`react-router` example

```typescript
const params = new URLSearchParams(props.location.search);
const tags = params.get('tags'):
```

And still it is necessary to make sure there are no typos in `tags` parameter while generating link for example.

## Why not to use any other library?

Sure, there are tons of amazing libraries:

- https://www.npmjs.com/package/typed-route-builder
- https://www.npmjs.com/package/next-typed-routes
- https://github.com/fongandrew/typed-routes

and so on.

But they are pretty verbose and even better typing could be done using TypeScript 4 feature [Template Literal Types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html#template-literal-types).

## API

```typescript
import { route, createRoutesDeclaration } from 'nicely-typed-routes';

const categoriesRoute = route('/users/{userId:number}/categories/:category');
const productsRoute = route('/products/{productId:number}');

const routes = createRoutesDeclaration(categoriesRoute).add(productsRoute);

const parsed = routes.parse(window.location.pathname);

// First, check if url matched one of the routes
if (parsed !== null) {
  // at this moment parsed is sum type of all possible routes

  if (parsed.key === categoriesRoute.key) {
    console.log(parsed.params); // typed as { userId: number, category: string }
  }
  if (parsed.key === productsRoute.key) {
    console.log(parsed.params); // typed as { productId: number }
  }
}

// Routes also usable to generate link

categoriesRoute.link({ userId: 42, category: 'cats' }); // '/users/42/categories/cats`
categoriesRoute.link({ userId: '42', category: 'cats' }); // Typecheck failed
```

## Is it production ready?

No, but I'm looking forward to see how this library could be improved.

## Future plans

### Tier 1

- Finalize syntax specification
- Rewrite better matching algorithm
- Improve test coverage
- Improve documentation
- Search params typing

### Tier 2

- Custom types
- URLs composition, nested routes

## Downsides

- TypeScript 4 is mandatory
- Probably longer compiling time (I should run benchmarks to make sure)
- TypeScript Errors could be not as readable as you want
- Harder to inspect derived types.

## Thanks

This solution is highly inspired by [TypeScript Challenges](https://github.com/type-challenges/type-challenges).
Special thanks to [Grigorii Khromov](https://github.com/gkhromov) for helping me figure out how all of this works :).
