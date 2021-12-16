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
