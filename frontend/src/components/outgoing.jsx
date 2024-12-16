import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import API from "../services/api";
import { Modal, Button, Form } from "react-bootstrap";

const Outgoing = () => {
  const [scannedProducts, setScannedProducts] = useState([]); // حالة للمنتجات الممسوحة
  const [categories, setCategories] = useState([]); // حالة لتخزين الفئات
  const [isLoading, setIsLoading] = useState(true);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false); // حالة مودال مسح الباركود
  const [showProductModal, setShowProductModal] = useState(false); // حالة مودال تفاصيل المنتج
  const [ShowProductModal, SetShowProductModal] = useState(false);
  const [scanStatus, setScanStatus] = useState(""); // رسالة حالة المسح
  const [productDetails, setProductDetails] = useState(null); // تفاصيل المنتج الممسوح
  const [editProduct, setEditProduct] = useState(null); // حالة مودال تعديل المنتج
  const [errorMessage, setErrorMessage] = useState("");
  const barcodeRef = useRef(""); // مرجع لتخزين قيمة الباركود الممسوح
  const [searchTerm, setSearchTerm] = useState("");
  const [matchingProducts, setMatchingProducts] = useState([]);

  const SCAN_TIMEOUT = 300;

  // جلب المنتجات الممسوحة والفئات عند تحميل المكون
  useEffect(() => {
    const fetchScannedProducts = async () => {
      try {
        const response = await API.get("/scanned_products");
        setScannedProducts(response.data);
      } catch (error) {
        console.error("خطأ في جلب المنتجات الممسوحة:", error);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await API.get("/categories");
        setCategories(response.data);
      } catch (error) {
        console.error("خطأ في جلب الفئات:", error);
      }
    };

    fetchScannedProducts();
    fetchCategories();
    setIsLoading(false);
  }, []);

  // معالجة منطق مسح الباركود
  const processScan = async (barcode) => {
    if (barcode) {
      try {
        const response = await API.get(`/products/${barcode}`); // جلب تفاصيل المنتج

        if (response.data) {
          // تخزين المنتج في matchingProducts
          setMatchingProducts([
            ...matchingProducts,
            {
              barcode: barcode,
              name: response.data.name,
              expiryDate: response.data.expiry_date,
              quantity: 1, // الكمية الافتراضية
            },
          ]);
          setShowProductModal(true); // عرض مودال تفاصيل المنتج
        } else {
          setScanStatus("المنتج غير موجود في قاعدة البيانات.");
        }
        setShowBarcodeModal(false); // إغلاق مودال مسح الباركود
      } catch (error) {
        console.error("خطأ في جلب تفاصيل المنتج:", error);
        setScanStatus(
          "حدث خطأ أثناء جلب تفاصيل المنتج. الرجاء المحاولة مرة أخرى."
        );
      }
    } else {
      setScanStatus("لم يتم اكتشاف أي باركود. الرجاء المحاولة مرة أخرى.");
    }
  };

  const handleError = (err) => {
    console.error("خطأ في مسح الباركود: ", err);
    setScanStatus("خطأ في المسح. الرجاء التحقق من الكاميرا أو الباركود.");
  };

  const scanTimeoutRef = useRef(null); // مرجع لإدارة مهلة المسح

  // معالجة أحداث الضغط على لوحة المفاتيح لإدخال ماسح الباركود
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (showBarcodeModal) {
        if (event.key === "Enter") {
          event.preventDefault(); // منع زر الإدخال من المعالجة
          return;
        }
        // مسح المهلة السابقة إذا كانت لا تزال نشطة
        clearTimeout(scanTimeoutRef.current);

        // إضافة المفتاح الحالي إلى حالة الباركود الممسوح
        barcodeRef.current += event.key;

        // تعيين مهلة جديدة لمعالجة الباركود بعد توقف
        scanTimeoutRef.current = setTimeout(() => {
          processScan(barcodeRef.current); // استخدام barcodeRef بدلاً من الحالة
          barcodeRef.current = ""; // مسح barcodeRef للمسح التالي
        }, SCAN_TIMEOUT);
      }
    };

    // إضافة مستمع للأحداث على keydown (إدخال ماسح الباركود)
    window.addEventListener("keydown", handleKeyPress);

    // تنظيف مستمع الأحداث عند إلغاء تحميل المكون
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      clearTimeout(scanTimeoutRef.current); // مسح المهلة عند الإلغاء
    };
  }, [showBarcodeModal]);

  // معالجة تعديل المنتج
  const handleEdit = (product) => {
    setEditProduct(product);
  };

  // حفظ التعديلات
  const saveEdit = async () => {
    try {
      await API.put(`/scanned_products/${editProduct.id}`, editProduct);
      alert("تم تحديث المنتج بنجاح!");
      setEditProduct(null);
      const updatedProducts = await API.get("/scanned_products");
      setScannedProducts(updatedProducts.data);
    } catch (error) {
      console.error("خطأ أثناء تحديث المنتج:", error);
      setErrorMessage("فشل تحديث المنتج.");
    }
  };

  // معالجة حذف المنتج
  const handleDelete = async (id, barcode) => {
    if (window.confirm("هل أنت متأكد أنك تريد حذف هذا المنتج؟")) {
      try {
        // إرسال طلب DELETE مع الباركود كمعامل استعلام
        await API.delete(`/scanned_products/${id}?barcode=${barcode}`);

        // تحديث الحالة لإزالة المنتج المحذوف
        setScannedProducts(
          scannedProducts.filter((product) => product.id !== id)
        );
      } catch (error) {
        console.error("خطأ أثناء حذف المنتج:", error);
      }
    }
  };

  // وظيفة لحفظ المنتج الممسوح (أي إضافة مسح جديد إلى قاعدة البيانات)
  const saveScannedProduct = async () => {
    try {
      // إرسال طلب POST لإضافة المسح الجديد إلى قاعدة البيانات
      const response = await API.post("/scanned_products", {
        barcode: productDetails.barcode, // يفترض أن productDetails يتضمن الباركود
        quantity: productDetails.quantity, // إرسال الكمية من تفاصيل المنتج
        scanned_at: new Date(), // اختيارياً، إرسال توقيت المسح
      });

      alert("تم إضافة المنتج بنجاح!");
      SetShowProductModal(false); // إغلاق المودال

      // اختيارياً، تحديث قائمة المنتجات إذا لزم الأمر
      const updatedProducts = await API.get("/scanned_products");
      setScannedProducts(updatedProducts.data); // تحديث قائمة المنتجات الممسوحة
    } catch (error) {
      console.error("خطأ أثناء إضافة المنتج:", error);
      setErrorMessage("فشل إضافة المنتج.");
    }
  };

  const handleNameSearch = async () => {
    try {
      const response = await API.get(`/products_name?name=${searchTerm}`);
      if (response.data && response.data.length > 0) {
        setMatchingProducts(response.data); // تخزين جميع المنتجات المطابقة
        setShowProductModal(true); // عرض المودال لاختيار المستخدم
      } else {
        alert("لم يتم العثور على منتجات بالاسم المحدد.");
      }
    } catch (error) {
      console.error("خطأ أثناء البحث عن المنتجات بالاسم:", error);
      alert("حدث خطأ أثناء البحث عن المنتجات.");
    }
  };

  // const [searchData, setSearchData] = useState([]);
  useEffect(() => {
    const search = async () => {
      try {
        const response = await API.get(`/products_name?name=${searchTerm}`);
        if (response.data && response.data.length > 0) {
          setMatchingProducts(response.data); // تخزين جميع المنتجات المطابقة
          // setShowProductModal(true); // عرض المودال لاختيار المستخدم
        }
      } catch (error) {
        setMatchingProducts([]);
        // alert("لم يتم العثور على منتجات بالاسم المحدد.");
      }
    };
    search();
  }, [searchTerm]);

  return (
    <div dir="rtl" className="p-container d-flex ">
      <Sidebar />
      <div className="content flex-grow-1 d-flex flex-column mx-2">
        <Topbar />
        <div className="p-3">
          <Button className="mb-3" onClick={() => setShowBarcodeModal(true)}>
            مسح باركود المنتج
          </Button>
          <div className="mb-3 position-relative">
            <Form.Control
              type="text"
              placeholder="البحث باسم المنتج"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <div className="position-absolute bg-white p-3 w-100 shadow-lg rounded mt-3">
                {matchingProducts && matchingProducts.length > 0 ? (
                  matchingProducts.map((product) => (
                    <div
                      key={product.id}
                      className="d-flex align-items-center justify-content-between"
                    >
                      <div>{product.name}</div>
                      <Button
                        onClick={() => {
                          setMatchingProducts([product]);
                          setProductDetails(product);
                          setShowProductModal(true);
                          // setEditProduct(product);

                          // setSearchTerm("");
                        }}
                      >
                        اختيار
                      </Button>
                    </div>
                  ))
                ) : (
                  <p>لا توجد منتجات مطابقة.</p>
                )}
              </div>
            )}
            <Button className="mt-2" onClick={handleNameSearch}>
              بحث
            </Button>
          </div>
          {isLoading ? (
            <p>جارٍ تحميل المنتجات الممسوحة...</p>
          ) : (
            <table className="table table-hover">
              <thead>
                <tr>
                  <th scope="col">المعرف</th>
                  <th scope="col">الباركود</th>
                  <th scope="col">اسم المنتج</th>
                  <th scope="col">وقت المسح</th>
                  <th scope="col">الكمية</th>
                  <th scope="col">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {scannedProducts.length === 0 ? (
                  <tr>
                    <td colSpan="5">لم يتم العثور على منتجات ممسوحة.</td>
                  </tr>
                ) : (
                  scannedProducts.map((product) => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>{product.barcode}</td>
                      <td>{product.product_name}</td>
                      <td>
                        {new Date(product.scanned_at).toLocaleDateString(
                          "en-US"
                        )}
                      </td>
                      <td>{product.quantity}</td>
                      <td>
                        <Button
                          variant="warning"
                          onClick={() => handleEdit(product)}
                        >
                          تعديل
                        </Button>{" "}
                        <Button
                          variant="danger"
                          onClick={() =>
                            handleDelete(product.id, product.barcode)
                          }
                        >
                          حذف
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* مودال لمسح الباركود */}
      <Modal show={showBarcodeModal} onHide={() => setShowBarcodeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>مسح باركود المنتج</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mt-2">
            <strong>{scanStatus}</strong>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowBarcodeModal(false)}
          >
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>

      {/* مودال لتفاصيل المنتج */}
      <Modal show={ShowProductModal} onHide={() => SetShowProductModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>تفاصيل المنتج</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {productDetails ? (
            <div>
              <p>
                <strong>الاسم:</strong> {productDetails.name}
              </p>
              <p>
                <strong>تاريخ انتهاء الصلاحية:</strong>{" "}
                {new Date(productDetails.expiryDate).toLocaleDateString(
                  "en-US"
                )}
              </p>
              <p>
                <strong>الكمية:</strong>
                <input
                  type="number"
                  value={productDetails.quantity || 1}
                  onChange={(e) =>
                    setProductDetails({
                      ...productDetails,
                      quantity: parseInt(e.target.value),
                    })
                  } // تحديث الكمية
                  min="1" // منع إدخال أقل من 1
                  style={{ width: "100px" }} // ضبط عرض الحقل
                />
              </p>
            </div>
          ) : (
            <p>لا توجد تفاصيل للمنتج متوفرة.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={saveScannedProduct}>
            حفظ التغييرات
          </Button>
          <Button
            variant="secondary"
            onClick={() => SetShowProductModal(false)}
          >
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>

      {/* نافذة تعديل المنتج */}
      <Modal show={!!editProduct} onHide={() => setEditProduct(null)}>
        <Modal.Header closeButton>
          <Modal.Title>تعديل المنتج</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>الكمية</Form.Label>
              <Form.Control
                type="number"
                value={editProduct?.quantity || ""}
                onChange={(e) =>
                  setEditProduct({ ...editProduct, quantity: e.target.value })
                }
              />
            </Form.Group>
          </Form>
          {errorMessage && (
            <div className="alert alert-danger mt-3">{errorMessage}</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={saveEdit}>
            حفظ التغييرات
          </Button>
          <Button variant="secondary" onClick={() => setEditProduct(null)}>
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>
      {/* نافذة اختيار المنتج */}
      <Modal show={showProductModal} onHide={() => setShowProductModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>اختر منتجًا</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {matchingProducts.length > 0 ? (
            <ul>
              {matchingProducts.map((product, index) => (
                <li
                  key={product.barcode}
                  style={{ cursor: "pointer", marginBottom: "10px" }}
                  onClick={() => {
                    // تعيين تفاصيل المنتج
                    setProductDetails({
                      barcode: product.barcode,
                      name: product.name,
                      expiryDate: product.expiry_date,
                      quantity: 1,
                    });

                    // إفراغ مصفوفة المنتجات المتطابقة
                    setMatchingProducts([]);
                    if (matchingProducts.length > 0)
                      // إغلاق وإظهار نافذة المنتج
                      setShowProductModal(false);
                    SetShowProductModal(true);
                  }}
                >
                  {index + 1}. {product.name} - {product.barcode} (تاريخ
                  الانتهاء:{" "}
                  {new Date(product.expiry_date).toLocaleDateString("en-GB")})
                </li>
              ))}
            </ul>
          ) : (
            <p>لم يتم العثور على منتجات متطابقة.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowProductModal(false)}
          >
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Outgoing;
