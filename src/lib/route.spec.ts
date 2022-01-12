import test from 'ava';

import { createRoutesDeclaration, route, RouteDeclarationBasic } from './route';

const categoriesRoute = route('/users/{userId:number}/categories/:category');
const productsRoute = route('/products/{productId:number}');
const customDeclaration: RouteDeclarationBasic<
  'test',
  { readonly someParam: boolean }
> = {
  key: 'test',
  parse(uri: string) {
    if (uri === '/test' || uri === '/test2') {
      return {
        key: 'test',
        params: { someParam: uri === '/test' },
      };
    }
    return null;
  },
  link({ someParam }) {
    return someParam ? '/test' : '/test2';
  },
};

test('Parse params', (t) => {
  const routes = createRoutesDeclaration(categoriesRoute).add(productsRoute);

  const parsed = routes.parse('/users/42/categories/cats');

  t.deepEqual(parsed, {
    key: categoriesRoute.key,
    params: {
      userId: 42,
      category: 'cats',
    },
  });
});

test('Should add custom parser', (t) => {
  const routes = createRoutesDeclaration(categoriesRoute)
    .add(productsRoute)
    .add(customDeclaration);

  t.deepEqual(routes.parse('/users/11/categories/dogs'), {
    key: categoriesRoute.key,
    params: {
      userId: 11,
      category: 'dogs',
    },
  });

  t.deepEqual(routes.parse('/test'), {
    key: customDeclaration.key,
    params: {
      someParam: true,
    },
  });

  t.deepEqual(routes.parse('/test2'), {
    key: customDeclaration.key,
    params: {
      someParam: false,
    },
  });

  t.deepEqual(routes.parse('/other'), null);
});

test('Should not match', (t) => {
  const routes = createRoutesDeclaration(route('/foo/{foo:number}'));

  const match = routes.parse('/foo/42/bar/70');

  t.deepEqual(match, null);
});

test('Should handle dash in path', (t) => {
  const path = route('/foo/{foo:number}/foo-bar/{bar:string}');
  const routes = createRoutesDeclaration(path);

  const match = routes.parse('/foo/42/foo-bar/35');

  t.deepEqual(match, {
    key: path.key,
    params: {
      foo: 42,
      bar: '35',
    },
  });
});
