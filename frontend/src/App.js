import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  redirect,
} from "react-router-dom";

import Products from "./components/products";
import Home from "./components/home";
import Categories from "./components/categories";
import Outgoing from "./components/outgoing";
import Suppliers from "./components/suppliers";
import Login from "./components/login";
import ExpiredProducts from "./components/ExpiredProducts";

import store from "./store";

const protect = () => {
  const { token } = store.getState().auth;
  if (token) return null;
  return redirect("/");
};

const routes = createRoutesFromElements(
  <>
    <Route path="/home" element={<Home />} loader={protect} />
    <Route path="/products" element={<Products />} loader={protect} />
    <Route path="/outgoing" element={<Outgoing />} loader={protect} />
    <Route path="/categories" element={<Categories />} loader={protect} />
    <Route path="/suppliers" element={<Suppliers />} loader={protect} />
    <Route path="/" element={<Login />} />
    <Route path="/Expiredproducts" element={<ExpiredProducts />} loader={protect} />
  </>
);

const router = createBrowserRouter(routes);
const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
