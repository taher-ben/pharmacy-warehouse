import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import API from "../services/api";
import { BsFilePerson, BsTelephone , BsGeoAlt } from "react-icons/bs";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contact: "",
    address: "",
  });

  const [editSupplier, setEditSupplier] = useState(null); // حالة لتحرير مزود الخدمة

  // جلب المزودين من الخادم
  const fetchSuppliers = async () => {
    try {
      const response = await API.get("/suppliers");
      setSuppliers(response.data); // افتراض أن الخادم يرسل مصفوفة من المزودين
    } catch (error) {
      console.error("خطأ أثناء جلب المزودين:", error);
    }
  };

  // إضافة مزود جديد
  const addSupplier = async () => {
    if (!newSupplier.name || !newSupplier.contact || !newSupplier.address) {
      alert("جميع الحقول مطلوبة!");
      return;
    }
    try {
      const response = await API.post("/suppliers", newSupplier);
      alert(response.data.message || "تم إضافة المزود بنجاح");
      setNewSupplier({ name: "", contact: "", address: "" });
      fetchSuppliers();
    } catch (error) {
      console.error("خطأ أثناء إضافة المزود:", error);
    }
  };

  // تحرير مزود
  const handleEdit = (supplier) => {
    setEditSupplier({ ...supplier }); // تحميل المزود إلى نموذج التحرير
  };

  const updateSupplier = async () => {
    if (!editSupplier.name || !editSupplier.contact || !editSupplier.address) {
      alert("جميع الحقول مطلوبة!");
      return;
    }
    try {
      const response = await API.put(
        `/suppliers/${editSupplier.supplier_id}`,
        editSupplier
      );
      alert(response.data.message || "تم تحديث المزود بنجاح");
      setEditSupplier(null); // إغلاق نموذج التحرير
      fetchSuppliers();
    } catch (error) {
      console.error("خطأ أثناء تحديث المزود:", error);
    }
  };

  // حذف مزود
  const deleteSupplier = async (id) => {
    if (window.confirm("هل أنت متأكد من أنك تريد حذف هذا المزود؟")) {
      try {
        await API.delete(`/suppliers/${id}`);
        setSuppliers(
          suppliers.filter((supplier) => supplier.supplier_id !== id)
        );
      } catch (error) {
        console.error("خطأ أثناء حذف المزود:", error);
      }
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  return (
    <div dir="rtl" className="container-fluid row d-flex ">
      <div className="col-2">
      <Sidebar />
      </div>
      <div className="content col flex-grow-1 d-flex flex-column mx-2">
        <Topbar />
        <h1 className="mb-4">المزودين</h1>

        {/* قسم إضافة مزود */}
        <div className="mb-4 border-bottom border-primary">
          <h4 className="mb-4">إضافة مزود جديد</h4>
          <div className="row g-2">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="الاسم"
                value={newSupplier.name}
                onChange={(e) =>
                  setNewSupplier({ ...newSupplier, name: e.target.value })
                }
              />
            </div>
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="التواصل"
                value={newSupplier.contact}
                onChange={(e) =>
                  setNewSupplier({ ...newSupplier, contact: e.target.value })
                }
              />
            </div>
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="العنوان"
                value={newSupplier.address}
                onChange={(e) =>
                  setNewSupplier({ ...newSupplier, address: e.target.value })
                }
              />
            </div>
            <div className="col-12 mt-2 mb-4">
              <button className="btn btn-primary w-100" onClick={addSupplier}>
                إضافة مزود
              </button>
            </div>
          </div>
        </div>

        {/* قسم تحرير مزود */}
        {editSupplier && (
          <div className="mb-4">
            <h4>تحرير المزود</h4>
            <div className="row g-2">
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="الاسم"
                  value={editSupplier.name}
                  onChange={(e) =>
                    setEditSupplier({ ...editSupplier, name: e.target.value })
                  }
                />
              </div>
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="التواصل"
                  value={editSupplier.contact}
                  onChange={(e) =>
                    setEditSupplier({
                      ...editSupplier,
                      contact: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="العنوان"
                  value={editSupplier.address}
                  onChange={(e) =>
                    setEditSupplier({
                      ...editSupplier,
                      address: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-6 mt-2">
                <button
                  className="btn btn-success w-100"
                  onClick={updateSupplier}
                >
                  حفظ التعديلات
                </button>
              </div>
              <div className="col-6 mt-2">
                <button
                  className="btn btn-secondary w-100"
                  onClick={() => setEditSupplier(null)}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* عرض المزودين */}
          <h3 className="mb-4"> الموردين </h3>
        <div className="d-flex">
          {suppliers.map((supplier) => (
            <div key={supplier.supplier_id} className="col-md-3 mx-2">
              <div className="card mb-4">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <BsFilePerson className="h2" />
                    <h5 className="card-title mx-2">{supplier.name}</h5>
                  </div>
                  <p className="card-text">
                    <div className="d-flex align-items-center">
                      <BsTelephone className="h5" />
                      <div className="mx-2 pb-2">
                        <strong>التواصل:</strong> {supplier.contact_details}
                      </div>
                      <br />
                    </div>
                    <div className="d-flex align-items-center">
                      <BsGeoAlt className="h5" />
                      <div  className="mx-2 pb-2">
                      <strong>العنوان:</strong> {supplier.address}
                      </div>
                    </div>
                  </p>
                  <button
                    className="btn btn-warning btn-sm me-2 mx-1"
                    onClick={() => handleEdit(supplier)}
                  >
                    تعديل
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteSupplier(supplier.supplier_id)}
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Suppliers;
