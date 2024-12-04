import React, { useState } from 'react';

const handleNavigation = (event, path) => {
    event.preventDefault();
    window.location.href = path; // Navigate to the specified path
};

const Sidebar = () => {
    const [showProductsDropdown, setShowProductsDropdown] = useState(false);

    // Toggle the dropdown menu
    const toggleProductsDropdown = () => {
        setShowProductsDropdown(!showProductsDropdown);
    };

    return (
        <div className="bg-dark text-white vh-100 p-3">
            <h2 className="text-center mb-4">Inventory System</h2>
            <ul className="nav flex-column">
                <li className="nav-item">
                    <a href="/dashboard" className="nav-link text-white" onClick={(event) => handleNavigation(event, '/home')}>Dashboard</a>
                </li>
                
                {/* Products Dropdown */}
                <li className="nav-item dropdown">
                    <a
                        href="/products/incoming" // Default route for Products
                        className="nav-link text-white dropdown-toggle"
                        id="navbarDropdown"
                        role="button"
                        onClick={(event) => {
                            event.preventDefault();
                            toggleProductsDropdown();
                        }}
                        data-bs-toggle="dropdown"
                        aria-expanded={showProductsDropdown ? 'true' : 'false'}
                    >
                        Products
                    </a>
                    <ul
                        className={`dropdown-menu ${showProductsDropdown ? 'show' : ''}`}
                        aria-labelledby="navbarDropdown"
                    >
                        <li>
                            <a
                                href="/products/incoming"
                                className="dropdown-item"
                                onClick={(event) => handleNavigation(event, '/products')}
                            >
                                Incoming Products
                            </a>
                        </li>
                        <li>
                            <a
                                href="/products/outward"
                                className="dropdown-item"
                                onClick={(event) => handleNavigation(event, '/outgoing')}
                            >
                                Outgoing Products
                            </a>
                        </li>
                    </ul>
                </li>

                <li className="nav-item">
                    <a href="/categories" className="nav-link text-white" onClick={(event) => handleNavigation(event, '/categories')}>Categories</a>
                </li>
                <li className="nav-item">
                    <a href="#" className="nav-link text-white" onClick={(event) => handleNavigation(event, '/suppliers')}>Suppliers</a>
                </li>
                <li className="nav-item">
                    <a href="#" className="nav-link text-white">Reports</a>
                </li>
                <li className="nav-item">
                    <a href="#" className="nav-link text-white">Settings</a>
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;
