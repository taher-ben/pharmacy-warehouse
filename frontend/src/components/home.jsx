import "bootstrap/dist/css/bootstrap.min.css";
import Topbar from "./topbar";  
import "./Home.css"; 
import Sidebar from "./sidebar";
import { useEffect, useState } from "react";
import API from "../services/api";

function Home() {
  const [allProducts, setAllProducts] = useState([]);
  const [expiringProducts, setExpiringProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseProducts = await API.get("/products");
        const allProducts = responseProducts.data;
        setAllProducts(allProducts);

        const expiringProducts = allProducts.filter(product => {
          const expiryDate = new Date(product.expiry_date);
          const today = new Date();
          const oneMonthLater = new Date();
          oneMonthLater.setMonth(today.getMonth() + 1);
          return expiryDate <= oneMonthLater;
        });

        setExpiringProducts(expiringProducts);

        const responseCategories = await API.get("/categories");
        setCategories(responseCategories.data);

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container-fluid">
          <div dir="rtl" className="d-flex">
      <div className="col-2">
      <Sidebar />
      </div>
      <div className="content col mx-2 container">
        <Topbar />
        <div className="d-flex flex-wrap justify-content-around container w-100 p-3">
          <div className="col-md-3 mb-4">
            <div className="card shadow-lg border-0 text-white rounded box-items">
              <div className="card-body text-center">
                <h6 className="font-semibold text-sm text-white">جميع العناصر</h6>
                <h3 className="font-bold">{allProducts.length}</h3>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-4">
            <div className="card shadow-lg box-items text-white border-0 rounded">
              <div className="card-body text-center">
                <h6 className="font-semibold text-sm text-white">منتجات القريبة من انتهاء الصلاحية</h6>
                <h3 className="font-bold">{expiringProducts.length}</h3>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-4">
            <div className="card shadow-lg box-items text-white border-0 rounded">
              <div className="card-body text-center">
                <h6 className="font-semibold text-sm text-white">جميع الفئات</h6>
                <h3 className="font-bold">{categories.length}</h3>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
    </div>
  );
}

export default Home;
