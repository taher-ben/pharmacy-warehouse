import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import API from "../services/api";
import { Modal, Button, Form, Card } from "react-bootstrap";
import { BsExclamationDiamondFill } from "react-icons/bs";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // State to store categories
  const [suppliers, setSuppliers] = useState([]); // State to store suppliers
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false); // Barcode scan modal state
  const [showLowStockDetails, setShowLowStockDetails] = useState(false); // Modal for low stock details
  const [showExpiringSoonDetails, setShowExpiringSoonDetails] = useState(false);
  const [expiringSoonProducts, setExpiringSoonProducts] = useState([]);
  const [scanStatus, setScanStatus] = useState(""); // Scan status message
  const [editingProduct, setEditingProduct] = useState(null); // Current product being edited
  const [showEditModal, setShowEditModal] = useState(false); // Edit modal visibility
  const [errorMessage, setErrorMessage] = useState("");
  const SCAN_TIMEOUT = 300;
  const [newProduct, setNewProduct] = useState({
    name: "",
    category_id: "",
    supplier_id: "",
    unit_price: "",
    quantity_in_stock: "",
    minimum_stock_level: "",
    expiry_date: "",
    barcode: "", // To store the barcode value
  });

  const [lowStockProducts, setLowStockProducts] = useState([]); // State for low stock products

  const barcodeRef = useRef(""); // Ref to hold the scanned barcode value

  // Fetch products, categories, and suppliers on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await API.get("/products");
        const allProducts = response.data;

        setProducts(allProducts);

        // Filter products with quantity below minimum stock level
        const lowStock = response.data.filter(
          (product) => product.current_stock < product.minimum_stock_level
        );
        setLowStockProducts(lowStock);

        const today = new Date();
        const oneMonthLater = new Date();
        oneMonthLater.setMonth(today.getMonth() + 1);
        const expiringSoon = allProducts.filter((product) => {
          const expiryDate = new Date(product.expiry_date);
          return expiryDate <= oneMonthLater;
        });
        setExpiringSoonProducts(expiringSoon);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await API.get("/categories");
        setCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    const fetchSuppliers = async () => {
      try {
        const response = await API.get("/suppliers");
        setSuppliers(response.data);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    };

    fetchProducts();
    fetchCategories();
    fetchSuppliers();
    setIsLoading(false);
  }, []);

  // Handle input changes in the modal
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  // Add a new product
  const handleAddProduct = async () => {
    try {
      const productWithDefaultBarcode = {
        ...newProduct,
        barcode: newProduct.barcode || 0, // Set default barcode if empty
      };
      const response = await API.post(
        "/products/add",
        productWithDefaultBarcode
      );
      setProducts([...products, response.data]);
      setShowModal(false); // Close modal
      setNewProduct({
        name: "",
        category_id: "",
        supplier_id: "",
        unit_price: "",
        quantity_in_stock: "",
        minimum_stock_level: "",
        expiry_date: "",
        barcode: "", // Reset barcode field after adding product
      });
      window.location.reload();
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setErrorMessage(error.response.data.message); // Set error message
      } else {
        console.error("Error adding product:", error);
      }
    }
  };

  // Delete a product
  const deleteProduct = async (productId) => {
    try {
      await API.delete(`/products/delete/${productId}`);
      setProducts(
        products.filter((product) => product.product_id !== productId)
      );
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleEditProduct = async () => {
    try {
      const response = await API.put(
        `/products/edit/${editingProduct.product_id}`,
        {
          name: editingProduct.name,
          category_id: editingProduct.category_id,
          supplier_id: editingProduct.supplier_id,
          unit_price: editingProduct.unit_price,
          quantity_in_stock: editingProduct.quantity_in_stock,
          minimum_stock_level: editingProduct.minimum_stock_level,
          expiry_date: editingProduct.expiry_date,
        }
      );

      // Update product in the table
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.product_id === editingProduct.product_id
            ? response.data
            : product
        )
      );

      // Close modal
      setShowEditModal(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error editing product:", error);
    }
  };

  const scanTimeoutRef = useRef(null); // Ref for managing timeout

  // Handle keypress events for barcode scanner input
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (showBarcodeModal) {
        if (event.key === "Enter") {
          event.preventDefault(); // Prevent the Enter key from being processed
          return;
        }
        // Clear previous timeout if it's still active
        clearTimeout(scanTimeoutRef.current);

        // Append the current key pressed to the scannedBarcode state
        barcodeRef.current += event.key;

        // Set a new timeout to process the barcode after a pause
        scanTimeoutRef.current = setTimeout(() => {
          processScan(barcodeRef.current); // Use barcodeRef instead of state
          barcodeRef.current = ""; // Clear the barcodeRef for next scan
        }, SCAN_TIMEOUT);
      }
    };

    // Add event listener for keydown (barcode scanner input)
    window.addEventListener("keydown", handleKeyPress);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      clearTimeout(scanTimeoutRef.current); // Clear timeout when unmounting
    };
  }, [showBarcodeModal]);

  // Process the scanned barcode
  const processScan = (barcode) => {
    if (barcode) {
      setNewProduct((prevProduct) => ({
        ...prevProduct,
        barcode, // Store scanned barcode here
      }));
      setScanStatus("Scan Successful!");
      setShowBarcodeModal(false); // Close the barcode modal
    } else {
      setScanStatus("No barcode detected. Please try again.");
    }
  };

  return (
    <div dir="rtl" className="p-container d-flex ">
      <Sidebar />
      <div dir="rtl" className="content flex-grow-1 d-flex flex-column mx-2">
        <Topbar />
        <div className="p-3">
          <div className="d-flex">
            {/* Low Stock Products Card */}
            {lowStockProducts.length > 0 && (
              <Card className="mb-4">
                <Card.Body>
                  <Card.Title>المنتجات التي في المخزون المنخفض</Card.Title>
                  <Card.Text>
                    <BsExclamationDiamondFill color="red" />
                    هناك <strong>({lowStockProducts.length})</strong> products
                    with stock levels below the minimum.
                  </Card.Text>
                  <Button
                    variant="primary"
                    onClick={() => setShowLowStockDetails(true)} // Show low stock details modal
                  >
                    Show Details
                  </Button>
                </Card.Body>
              </Card>
            )}

            {/* Expiring Soon Products Card */}
            {expiringSoonProducts.length > 0 && (
              <Card className="mb-4 flex-grow-1">
                <Card.Body>
                  <Card.Title>المنتجات التي ستنتهي صلاحيتها قريباً</Card.Title>
                  <Card.Text>
                    <BsExclamationDiamondFill color="red" />
                    هناك <strong>({expiringSoonProducts.length})</strong> منتجات
                    ستنتهي صلاحيتها في الشهر القادم.
                  </Card.Text>
                  <Button
                    variant="warning"
                    onClick={() => setShowExpiringSoonDetails(true)}
                  >
                    تفصيل اكثر
                  </Button>
                </Card.Body>
              </Card>
            )}
          </div>

          <Button className="mb-3" onClick={() => setShowModal(true)}>
            إضافة منتج (مسح الرمز الشريطي)
          </Button>
          {isLoading ? (
            <p>Loading products...</p>
          ) : (
            <table className="table table-hover">
              <thead>
                <tr>
                  <th scope="col">المعرف</th>
                  <th scope="col">الاسم</th>
                  <th scope="col">معرف الفئة</th>
                  <th scope="col">معرف المورد</th>
                  <th scope="col">سعر الوحدة</th>
                  <th scope="col">الكمية في المخزن</th>
                  <th scope="col">المخزون الحالي</th>
                  <th scope="col">تاريخ انتهاء الصلاحية</th>
                  <th scope="col">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.product_id}>
                    <th scope="row">({product.barcode})</th>
                    <td>{product.name}</td>
                    <td>{product.category_id}</td>
                    <td>{product.supplier_id}</td>
                    <td>{product.unit_price}</td>
                    <td>{product.quantity_in_stock}</td>
                    <td>{product.current_stock}</td>
                    <td>
                      {new Date(product.expiry_date).toLocaleDateString(
                        "en-GB"
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm me-2"
                        onClick={() => {
                          setEditingProduct(product); // Set the product to be edited
                          setShowEditModal(true); // Open the edit modal
                        }}
                      >
                        تعديل
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteProduct(product.product_id)}
                      >
                        مسح
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal for Barcode Scanning */}
      <Modal show={showBarcodeModal} onHide={() => setShowBarcodeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Scan Product Barcode</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* No video element needed for scanner input */}
          <div>
            <strong>{scanStatus}</strong>
          </div>
          <div className="mt-2">
            {/* Optionally, you can add instructions for the user to scan the barcode */}
            <p>Please scan the product barcode using the scanner device.</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowBarcodeModal(false)}
          >
            اغلاق
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal for Adding a Product */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>إضافة منتج جديد</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>الاسم</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={newProduct.name}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>الفئة</Form.Label>
              <Form.Control
                as="select"
                name="category_id"
                value={newProduct.category_id}
                onChange={handleInputChange}
              >
                <option value="">اختر الفئة</option>
                {categories.map((category) => (
                  <option
                    key={category.category_id}
                    value={category.category_id}
                  >
                    {category.name}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>المورد</Form.Label>
              <Form.Control
                as="select"
                name="supplier_id"
                value={newProduct.supplier_id}
                onChange={handleInputChange}
              >
                <option value="">اختر المورد</option>
                {suppliers.map((supplier) => (
                  <option
                    key={supplier.supplier_id}
                    value={supplier.supplier_id}
                  >
                    {supplier.name}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>سعر الوحدة</Form.Label>
              <Form.Control
                type="number"
                name="unit_price"
                value={newProduct.unit_price}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>الكمية الموجودة في المخزن</Form.Label>
              <Form.Control
                type="number"
                name="quantity_in_stock"
                value={newProduct.quantity_in_stock}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>الحد الأدنى للمخزون</Form.Label>
              <Form.Control
                type="number"
                name="minimum_stock_level"
                value={newProduct.minimum_stock_level}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>تاريخ الانتهاء</Form.Label>
              <Form.Control
                type="date"
                name="expiry_date"
                value={newProduct.expiry_date}
                onChange={handleInputChange}
              />
            </Form.Group>
            <div className="d-flex justify-content-space-between">
              <Button
                className="mb-3"
                variant="primary"
                onClick={handleAddProduct}
              >
                اضافة منتج
              </Button>
              <Button
                className="mb-3"
                onClick={() => setShowBarcodeModal(true)}
              >
                (امسح الرمز الشريطي)
              </Button>
            </div>
          </Form>
          {errorMessage && (
            <div className="alert alert-danger mt-3">{errorMessage}</div>
          )}{" "}
          {/* Display error message here */}
        </Modal.Body>
      </Modal>

      {/* Modal for Low Stock Products Details */}
      <Modal
        show={showLowStockDetails}
        onHide={() => setShowLowStockDetails(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>تفاصيل المنتجات ذات المخزون المنخفض</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {lowStockProducts.length > 0 ? (
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>الفئة</th>
                  <th>المورد</th>
                  <th>الكمية</th>
                  <th>تاريخ انتهاء الصلاحية</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((product) => (
                  <tr key={product.product_id}>
                    <td>{product.name}</td>
                    <td>{product.category_id}</td>
                    <td>{product.supplier_id}</td>
                    <td>{product.current_stock}</td>
                    <td>
                      {new Date(product.expiry_date).toLocaleDateString(
                        "en-GB"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>لم يتم العثور على منتجات ذات مخزون منخفض.</p>
          )}
        </Modal.Body>
      </Modal>

      {/* Modal for Expiring Soon Products */}
      <Modal
        show={showExpiringSoonDetails}
        onHide={() => setShowExpiringSoonDetails(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>تفاصيل المنتجات التي ستنتهي صلاحيتها قريبًا</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {expiringSoonProducts.length > 0 ? (
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>الفئة</th>
                  <th>المورد</th>
                  <th>الكمية</th>
                  <th>تاريخ انتهاء الصلاحية</th>
                </tr>
              </thead>
              <tbody>
                {expiringSoonProducts.map((product) => (
                  <tr key={product.product_id}>
                    <td>{product.name}</td>
                    <td>{product.category_id}</td>
                    <td>{product.supplier_id}</td>
                    <td>{product.current_stock}</td>
                    <td>
                      {new Date(product.expiry_date).toLocaleDateString(
                        "en-GB"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No المنتجات التي ستنتهي صلاحيتها قريباً found.</p>
          )}
        </Modal.Body>
      </Modal>
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>تعديل المنتج</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingProduct && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>الاسم</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      name: e.target.value,
                    })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>الفئة</Form.Label>
                <Form.Control
                  as="select"
                  name="category_id"
                  value={editingProduct.category_id}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      category_id: e.target.value,
                    })
                  }
                >
                  <option value="">اختر الفئة</option>
                  {categories.map((category) => (
                    <option
                      key={category.category_id}
                      value={category.category_id}
                    >
                      {category.name}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>المورد</Form.Label>
                <Form.Control
                  as="select"
                  name="supplier_id"
                  value={editingProduct.supplier_id}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      supplier_id: e.target.value,
                    })
                  }
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option
                      key={supplier.supplier_id}
                      value={supplier.supplier_id}
                    >
                      {supplier.name}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>سعر الوحدة</Form.Label>
                <Form.Control
                  type="number"
                  name="unit_price"
                  value={editingProduct.unit_price}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      unit_price: e.target.value,
                    })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>الكمية في المخزون</Form.Label>
                <Form.Control
                  type="number"
                  name="quantity_in_stock"
                  value={editingProduct.quantity_in_stock}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      quantity_in_stock: e.target.value,
                    })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>الحد الأدنى للمخزون</Form.Label>
                <Form.Control
                  type="number"
                  name="minimum_stock_level"
                  value={editingProduct.minimum_stock_level}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      minimum_stock_level: e.target.value,
                    })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>تاريخ انتهاء الصلاحية</Form.Label>
                <Form.Control
                  type="date"
                  name="expiry_date"
                  value={editingProduct.expiry_date}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      expiry_date: e.target.value,
                    })
                  }
                />
              </Form.Group>
              <Button variant="primary" onClick={() => handleEditProduct()}>
                حفظ التغييرات
              </Button>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Products;
