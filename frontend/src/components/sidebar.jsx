import React, { useState } from "react";
import { BsHouse } from "react-icons/bs";
import { BsList } from "react-icons/bs";
import { BsBoxArrowRight } from "react-icons/bs";
import { BsBoxArrowInLeft } from "react-icons/bs";
import { BsPersonLinesFill } from "react-icons/bs";

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
    <div dir="rtl" style={{maxheight:"200px"}} className="bg-dark position-fixed text-white vh-100 p-3  ">
      <h3 className="text-center mb-4">نظام إدارة المخازن</h3>
      <ul className="nav flex-column">
        <li className="nav-item d-flex align-items-center">
          <BsHouse className="mx-1 fs-4" color="white" />
          <a
            href="/dashboard"
            className="nav-link text-white"
            onClick={(event) => handleNavigation(event, "/")}
          >
            لوحة التحكم
          </a>
        </li>

        <li className="nav-item d-flex align-items-center">
          <BsList className="mx-1 fs-4" color="white" />
          <a
            href="/categories"
            className="nav-link text-white"
            onClick={(event) => handleNavigation(event, "/categories")}
          >
            الفئات
          </a>
        </li>
        <li className="nav-item d-flex align-items-center">
          <BsBoxArrowRight className="mx-1 fs-4 center" color="white" />
          <a
            href="/products/outward"
            className="nav-link text-white"
            onClick={(event) => handleNavigation(event, "/outgoing")}
          >
            المنتجات الصادرة
          </a>
        </li>
        <li className="nav-item d-flex align-items-center">
        <BsBoxArrowInLeft className="mx-1 fs-4 center" color="white" />
          <a
            href="/products/incoming"
            className="nav-link text-white"
            onClick={(event) => handleNavigation(event, "/products")}
          >
            المنتجات الواردة
          </a>
        </li>
        <li className="nav-item d-flex align-items-center">
          <BsPersonLinesFill className="mx-1 fs-4 center" color="white" />
          <a
            href="/suppliers"
            className="nav-link text-white"
            onClick={(event) => handleNavigation(event, "/suppliers")}
          >
            الموردون
          </a>
        </li>
        {/* <li className="nav-item d-flex align-items-center">
          <a href="#" className="nav-link text-white">
            التقارير
          </a>
        </li>
        <li className="nav-item">
          <a href="#" className="nav-link text-white">
            الإعدادات
          </a>
        </li> */}
      </ul>
    </div>
  );
};

export default Sidebar;
