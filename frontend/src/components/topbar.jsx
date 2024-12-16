// import React, { useState } from 'react';

const Topbar = ({ onSearch }) => {
  // const [searchTerm, setSearchTerm] = useState('');

  // const handleSearchChange = (event) => {
  //   setSearchTerm(event.target.value);
  //   onSearch(event.target.value); // Send search term to the parent component
  // };

  return (
    <div dir='rtl' className="navbar navbar-light bg-light d-flex justify-content-between ">
      {/* <form className="form-inline">
        <input 
          className="form-control mr-sm-2" 
          type="search" 
          placeholder="ابحث عن المنتجات..." 
          aria-label="Search" 
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </form> */}
      <div>
      <span>المسؤول الرئيسي</span>
      </div>
    </div>
  );
};

export default Topbar;
