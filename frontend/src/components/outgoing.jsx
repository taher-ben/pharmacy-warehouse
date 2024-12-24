import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import gifbarcode from "../assets/tenor.gif"
import { BsCardChecklist, BsBoxArrowRight , BsSearch } from "react-icons/bs";
import API from "../services/api";
import { Modal, Button, Form } from "react-bootstrap";
import Swal from 'sweetalert2'

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
  const [searchQuery, setSearchQuery] = useState(""); // state for the search query

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
          setProductDetails({
            barcode: barcode,
            name: response.data.name,
            expiryDate: response.data.expiry_date,
            quantity: 1,
          });

          SetShowProductModal(true); // عرض مودال تفاصيل المنتج
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

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  // Filter the scanned products based on the search query
  const filteredProducts = scannedProducts.filter((product) => {
    return (
      product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.id.toString().includes(searchQuery) // filter by ID, barcode, or product name
    );
  });

  // حفظ التعديلات
  const saveEdit = async () => {
    try {
      await API.put(`/scanned_products/${editProduct.id}`, editProduct);
      Swal.fire({
        title: "نجحت العملية",
        text: "تم تحديث المنتج بنجاح",
        icon: "success"
      });
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
  Swal.fire({
    title: "هل أنت متأكد أنك تريد حذف هذا المنتج؟",
    text: "لن تتمكن من التراجع عن هذا الإجراء!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "نعم، احذفه!",
    cancelButtonText: "إلغاء"
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        // إرسال طلب DELETE مع الباركود كمعامل استعلام
        await API.delete(`/scanned_products/${id}?barcode=${barcode}`);
        
        // تحديث الحالة لإزالة المنتج المحذوف
        setScannedProducts(
          scannedProducts.filter((product) => product.id !== id)
        );

        // عرض رسالة النجاح بعد الحذف
        Swal.fire({
          title: "تم الحذف!",
          text: "تم حذف العنصر بنجاح.",
          icon: "success"
        });
      } catch (error) {
        console.error("خطأ أثناء حذف المنتج:", error);
        Swal.fire({
          title: "خطأ!",
          text: "حدث خطأ أثناء الحذف. يرجى المحاولة مرة أخرى.",
          icon: "error"
        });
      }
    }
  });
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

      Swal.fire({
        title: "نجحت العملية",
        text: "تم اضافة المنتج بنجاح",
        icon: "success"
      });
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
        Swal.fire({
          title: "فشل",
          text: "لم يتم العثور على منتج مطابق",
          icon: "error"
        });
      }
    } catch (error) {
      console.error("خطأ أثناء البحث عن المنتجات بالاسم:", error);
      Swal.fire({
        title: "فشل",
        text: "خطأ أثناء البحث عن المنتجات بالاسم",
        icon: "error"
      });
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
    <div dir="rtl" className="container-fluid row">
      <div className="col-2">
      <Sidebar  />
      </div>
      <div className="content col d-flex flex-column mx-2 overflow-y-scroll">
        <Topbar />
        <div className="p-3">
          <div>
            <div className="d-flex align-items-center my-4">
              <BsBoxArrowRight
                style={{
                  color: "#fff",
                  padding: "3px 6px",
                  fontSize: "45px",
                  backgroundColor: "#0d6efd",
                  borderRadius: "8px",
                }}
              />
              <h3 className="mx-2">تصدير عناصر</h3>
            </div>
            <div className="mb-3 d-flex align-items-center position-relative   sreach-box">
              <Form.Control
                type="text"
                style={{ width: "200px" }}
                placeholder="ادخل اسم العنصر"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <div className="position-absolute top-100 bg-white p-3  shadow-lg rounded z-3 ">
                  {matchingProducts && matchingProducts.length > 0 ? (
                    matchingProducts.map((product) => (
                      <div
                        style={{ width: "200px" }}
                        key={product.id}
                        className="d-flex my-2  align-items-center justify-content-between"
                      >
                        <div>{product.name}</div>
                        <Button
                          onClick={() => {
                            setMatchingProducts([product]);
                            setProductDetails(product);
                            setShowProductModal(true);
                            
                            // setEditProduct(product);
                          }}
                        >
                          اختيار
                        </Button>
                        
                      </div >
                    ))
                  ) : (
                    <p>لا توجد منتجات مطابقة.</p>
                  )}
                </div>
              )}
              <Button className="mx-2" onClick={handleNameSearch}>
                <BsSearch />
              </Button>
              <Button className="" onClick={() => setShowBarcodeModal(true)}>
                مسح باركود المنتج
              </Button>
            </div>
            <div>
              <div>
                <div className="d-flex align-items-center mt-5 mb-3">
                  <BsCardChecklist
                    style={{
                      color: "#fff",
                      padding: "3px 6px",
                      fontSize: "45px",
                      backgroundColor: "#0d6efd",
                      borderRadius: "8px",
                    }}
                  />
                  <h3 className="mx-2 ">قائمة العناصر الصادرة</h3>
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    style={{ width: "300px" }}
                    className="form-control"
                    placeholder="ابحث عن العنصر الصادر"
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
              </div>
            </div>
          </div>
          {isLoading ? (
            <p>جارٍ تحميل المنتجات الممسوحة...</p>
          ) : (
            <div
              className="table-responsive"
              style={{
                maxHeight: "55vh",
                overflowY: "auto",
              }}
            >
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
                      <td colSpan="6">لم يتم العثور على منتجات ممسوحة.</td>
                    </tr>
                  ) : (
                    filteredProducts.reverse().map((product) => (
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
            </div>
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
            <img style={{width:"100%"}} className="text-center d-flex justify-content-center" src={gifbarcode} alt="" />
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
