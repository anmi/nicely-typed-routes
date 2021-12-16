import test from 'ava';

import { createRoutesDeclaration, route } from './route';

test('Parse params', (t) => {
  const categoriesRoute = route('/users/{userId:number}/categories/:category');
  const productsRoute = route('/products/{productId:number}');

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
