import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Products from './components/products';
import Home from './components/home';
import Categories from './components/categories'
import Outgoing from './components/outgoing';
import Suppliers from './components/suppliers';
const App = () => {
    return (
      <Router>
      <Routes>
         <Route path='/home' element={<Home/>} />
         <Route path='/products' element={<Products/>} />
         <Route path='/outgoing' element={<Outgoing/>} />
         <Route path='/categories' element={<Categories/>} />
         <Route path='/suppliers' element={<Suppliers/>} />
      </Routes>
   </Router>
    );
};

export default App;
