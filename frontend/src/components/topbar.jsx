import React, { useState } from 'react';

const Topbar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    onSearch(event.target.value); // Send search term to the parent component
  };

  return (
    <div className="navbar navbar-light bg-light d-flex justify-content-between px-3">
      <form className="form-inline">
        <input 
          className="form-control mr-sm-2" 
          type="search" 
          placeholder="Search for products..." 
          aria-label="Search" 
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </form>
      <span>Welcome, Admin</span>
    </div>
  );
};

export default Topbar;
