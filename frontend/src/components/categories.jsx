import React, { useState, useEffect } from "react";
import Sidebar from "./sidebar"; // استيراد مكون Sidebar
import Topbar from "./topbar"; // استيراد مكون Topbar
import API from "../services/api";
import "bootstrap/dist/css/bootstrap.min.css";
import Swal from 'sweetalert2'
import { BiX } from "react-icons/bi";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");

  // جلب الفئات
  const fetchCategories = async () => {
    try {
      const response = await API.get("/category");
      setCategories(response.data);
    } catch (error) {
      console.error("خطأ في جلب الفئات:", error);
    }
  };

  // إضافة فئة جديدة
  const addCategory = async () => {
    if (!newCategoryName.trim()) {
      Swal.fire({
        title: "تحذير",
        text: "لا يمكن ترك اسم الفئة فارغا",
        icon: "warning"
      });
      return;
    }
    try {
      const response = await API.post("/categories/add", {
        name: newCategoryName,
      });
      const message = response.data.message;
      Swal.fire({
        title: "تمت العملية بنجاح",
        text: message,
        icon: "success"
      });
      setNewCategoryName(""); // إعادة تعيين الحقل
      fetchCategories(); // تحديث الفئات
    } catch (error) {
      console.error("خطأ في إضافة الفئة:", error);
    }
  };

  // حذف فئة
  const deleteCategory = async (categoryId) => {
    try {
      const response = await API.delete(`/categories/${categoryId}`);
      const message = response.data.message;
      Swal.fire({
        title: " رسالة",
        text: message,
        icon: "question"
      });
      // إزالة الفئة المحذوفة من الحالة
      setCategories(
        categories.filter((category) => category.category_id !== categoryId)
      );
    } catch (error) {
      console.error("خطأ في حذف الفئة:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div dir="rtl" className="container-fluid">
      <div className="row">
        {/* الشريط الجانبي */}
        <div className="col-2">

        <Sidebar  />
        </div>
        <div className="col ">
          {/* الشريط العلوي */}
          <Topbar title="الفئات" />

          {/* المحتوى الرئيسي */}
          <div className="container py-4">
            {/* قسم إضافة الفئة */}
            <div className="mb-4">
              <h2>إضافة فئة جديدة</h2>
              <div className="d-flex gap-2 align-items-center">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="أدخل اسم الفئة الجديدة من فضلك."
                  className="form-control flex-grow-1"
                />
                <button onClick={addCategory} className="btn mx-3 btn-primary">
                  إضافة الفئة
                </button>
              </div>
            </div>

            {/* عرض الفئات */}
            <div className="d-flex flex-wrap gap-4">
              {categories.map((category) => (
                <div
                  key={category.category_id}
                  className="card position-relative"
                  style={{ width: "300px", minHeight: "200px" }}
                >
                  {/* العنوان مع اسم الفئة وزر الحذف */}
                  <div className="card-header text-center d-flex  align-items-center">
                    <button
                      onClick={() => deleteCategory(category.category_id)}
                      className="btn btn-sm btn-danger m-2"
                      style={{ fontSize: "20px", height: "40px" }}
                      title="لا يمكن حذف التصنيف إذا كان التصنيف غير فارغ."
                    >
                      <BiX />
                    </button>

                    <h5>{category.name}</h5>
                  </div>

                  {/* محتوى البطاقة */}
                  <div
                    className="card-body p-3"
                    style={{ paddingBottom: "10px" }}
                  >
                    {category.products.length > 0 ? (
                      <table className="table table-striped table-bordered">
                        <thead>
                          <tr>
                            <th>اسم المنتج</th>
                            <th>الكمية</th>
                          </tr>
                        </thead>
                        <tbody>
                          {category.products.map((product) => (
                            <tr key={product.product_id}>
                              <td>{product.name}</td>
                              <td>{product.current_stock}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-center">
                        لا توجد منتجات في هذه الفئة.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;
