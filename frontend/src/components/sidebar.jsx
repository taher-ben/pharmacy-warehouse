import React, { useState } from "react";

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
    <div dir="rtl" className="bg-dark text-white vh-100 p-3">
      <h3 className="text-center mb-4">نظام إدارة المخازن</h3>
      <ul className="nav flex-column">
        <li className="nav-item">
          <a
            href="/dashboard"
            className="nav-link text-white"
            onClick={(event) => handleNavigation(event, "/home")}
          >
            لوحة التحكم
          </a>
        </li>

        <li className="nav-item">
          <a
            href="/categories"
            className="nav-link text-white"
            onClick={(event) => handleNavigation(event, "/categories")}
          >
            الفئات
          </a>
        </li>
        <li>
              <a
                href="/products/outward"
                className="nav-link text-white"
                onClick={(event) => handleNavigation(event, "/outgoing")}
              >
                المنتجات الصادرة
              </a>
            </li>
        {/* Products Dropdown */}
        {/* <li className="nav-item dropdown">
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
            aria-expanded={showProductsDropdown ? "true" : "false"}
          >
            المنتجات
          </a>
          <ul
            className={`dropdown-menu ${showProductsDropdown ? "show" : ""}`}
            aria-labelledby="navbarDropdown"
          >

          </ul>
        </li> */}

        <li className="nav-item">
              <a
                href="/products/incoming"
                className="nav-link text-white"
                onClick={(event) => handleNavigation(event, "/products")}
              >
                المنتجات الواردة
              </a>
            </li>
        <li className="nav-item">
          <a
            href="#"
            className="nav-link text-white"
            onClick={(event) => handleNavigation(event, "/suppliers")}
          >
            الموردون
          </a>
        </li>
        <li className="nav-item">
          <a href="#" className="nav-link text-white">
            التقارير
          </a>
        </li>
        <li className="nav-item">
          <a href="#" className="nav-link text-white">
            الإعدادات
          </a>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
