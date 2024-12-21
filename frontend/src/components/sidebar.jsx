import { useNavigate } from "react-router-dom";
import { BsHouse } from "react-icons/bs";
import { BsList } from "react-icons/bs";
import { BsBoxArrowRight } from "react-icons/bs";
import { BsBoxArrowInLeft } from "react-icons/bs";
import { BsPersonLinesFill, BsBoxArrowLeft, BsCalendar} from "react-icons/bs";
import "./sidebar.css"; 



const handleNavigation = (event, path) => {
  event.preventDefault();
  window.location.href = path; // Navigate to the specified path
};


const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    // Reset authentication status
    setTimeout(() => {
      navigate("/");
    }, 1000);
    
  };

  return (
    <div dir="rtl" className="bg-dark  text-white h-100 min-vh-100 p-3 lg:p-5">
      <h3 className="text-center mb-4">نظام إدارة المخازن</h3>
      <ul className="nav flex-column p-0">
        <li className="nav-item d-flex align-items-center">
          <BsHouse className="mx-1 fs-4 icon"  />
          <a
            href="/dashboard"
            className="nav-link "
            onClick={(event) => handleNavigation(event, "/home")}
          >
            لوحة التحكم
          </a>
        </li>

        <li className="nav-item d-flex align-items-center">
          <BsList className="mx-1 fs-4"  />
          <a
            href="/categories"
            className="nav-link   "
            onClick={(event) => handleNavigation(event, "/categories")}
          >
            الفئات
          </a>
        </li>
        <li className="nav-item d-flex align-items-center">
          <BsBoxArrowRight className="mx-1 fs-4 center"    />
          <a
            href="/products/outward"
            className="nav-link  "
            onClick={(event) => handleNavigation(event, "/outgoing")}
          >
            المنتجات الصادرة
          </a>
        </li>
        <li className="nav-item d-flex align-items-center">
          <BsBoxArrowInLeft className="mx-1 fs-4 center"    />
          <a
            href="/products/incoming"
            className="nav-link  "
            onClick={(event) => handleNavigation(event, "/products")}
          >
            المنتجات الواردة
          </a>
        </li>
        <li className="nav-item d-flex align-items-center">
          <BsPersonLinesFill className="mx-1 fs-4 center"    />
          <a
            href="/suppliers"
            className="nav-link  "
            onClick={(event) => handleNavigation(event, "/suppliers")}
          >
            الموردون
          </a>
        </li>
        <li className="nav-item d-flex align-items-center">
          <BsCalendar className="mx-1 fs-4 center"    />
          <a href="/ExpiredProducts" className="nav-link  " onClick={(event) => handleNavigation(event, "/ExpiredProducts")}>
            المنتجات منتهية الصلاحية
          </a>
        </li>
        <li className="nav-item d-flex align-items-center ">
          <BsBoxArrowLeft className="mx-1 fs-4 center"    />
          <button className="nav-link  " onClick={(event) => handleLogout()}>
            تسجيل الخروج
            </button>
        </li> 
      </ul>
    </div>
  );
};

export default Sidebar;
