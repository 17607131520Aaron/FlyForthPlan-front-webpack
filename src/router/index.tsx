import { lazy } from 'react';
import { createHashRouter, redirect } from 'react-router-dom';
import { getCookie } from '@/utils/StorageValue';

const Layout = lazy(() => import('@/Layout'));
const Home = lazy(() => import('@/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const isUserAuthenticated = () => {
  const user = getCookie('user');
  if (!user) {
    return redirect('/login');
  }
  return null;
};

const routers = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    loader: isUserAuthenticated,
    children: [
      {
        path: '/',
        element: <Home />,
      },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default routers;
