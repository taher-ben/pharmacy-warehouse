import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import API from "../services/api";
import { Modal, Button, Form, Card } from "react-bootstrap";
import { BrowserMultiFormatReader } from "@zxing/library"; // Import ZXing library
import { BsExclamationDiamondFill } from "react-icons/bs";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]); // State to store categories
  const [suppliers, setSuppliers] = useState([]);   // State to store suppliers
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false); // Barcode scan modal state
  const [showLowStockDetails, setShowLowStockDetails] = useState(false); // Modal for low stock details
  const [showExpiringSoonDetails, setShowExpiringSoonDetails] = useState(false);
  const [expiringSoonProducts, setExpiringSoonProducts] = useState([]);
  const [scanStatus, setScanStatus] = useState(""); // Scan status message
  const [editingProduct, setEditingProduct] = useState(null); // Current product being edited
const [showEditModal, setShowEditModal] = useState(false);  // Edit modal visibility
  const [errorMessage, setErrorMessage] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    category_id: "",
    supplier_id: "",
    unit_price: "",
    quantity_in_stock: "",
    minimum_stock_level: "",
    expiry_date: "",
    barcode: "", // To store product ID from barcode scan
  });

  const [lowStockProducts, setLowStockProducts] = useState([]); // State for low stock products

  const videoRef = useRef(null); // Reference for the video element

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

  // Handle barcode scanning
  const handleScan = (result) => {
    if (result) {
      // Play the "pip" sound
      const audio = new Audio("/pip.mp3");
      audio.play();

      setNewProduct({ ...newProduct, barcode: result.text }); // Set scanned product ID
      setShowBarcodeModal(false); // Close barcode scan modal
      setScanStatus("Scan Successful!"); // Update status message
    } else {
      setScanStatus("No barcode detected. Please try again.");
    }
  };

  const handleError = (err) => {
    // Handle any scanning errors
    console.error("Barcode Scan Error: ", err);
    setScanStatus("Error scanning. Please check your camera or barcode.");
  };

  // Add a new product
  const handleAddProduct = async () => {
    try {
      const productWithDefaultBarcode = {
        ...newProduct,
        barcode: newProduct.barcode || 0,
      };
      const response = await API.post("/products/add", newProduct);
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
      }); // Reset form
      window.location.reload();
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message);  // Set error message
      } else {
        console.error("Error adding product:", error);
      }
    }
  };

  // Delete a product
  const deleteProduct = async (productId) => {
    try {
      await API.delete(`/products/delete/${productId}`);
      setProducts(products.filter((product) => product.product_id !== productId));
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleEditProduct = async () => {
    try {
      const response = await API.put(`/products/edit/${editingProduct.product_id}`, {
        name: editingProduct.name,
        category_id: editingProduct.category_id,
        supplier_id: editingProduct.supplier_id,
        unit_price: editingProduct.unit_price,
        quantity_in_stock: editingProduct.quantity_in_stock,
        minimum_stock_level: editingProduct.minimum_stock_level,
        expiry_date: editingProduct.expiry_date,
      });
  
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
  
  // Start barcode scanning when the modal is shown
  useEffect(() => {
    if (showBarcodeModal) {
      const codeReader = new BrowserMultiFormatReader();
      codeReader
        .decodeFromVideoDevice(null, videoRef.current, (result, err) => {
          if (result) {
            handleScan(result);
          }
          if (err) {
            handleError(err);
          }
        })
        .catch((err) => {
          handleError(err);
        });

      return () => {
        codeReader.reset(); // Clean up when the modal is closed
      };
    }
  }, [showBarcodeModal]);

  return (
    <div className="p-container d-flex">
      <Sidebar />
      <div className="content flex-grow-1 d-flex flex-column mx-2">
      <Topbar  />
        <div className="p-3">
            <div className="d-flex">
          {/* Low Stock Products Card */}
          {lowStockProducts.length > 0 && (
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Low Stock Products</Card.Title>
                <Card.Text>
                <BsExclamationDiamondFill color="red"/> 
                  There are <strong>({lowStockProducts.length})</strong> products with stock levels below the minimum.
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
                  <Card.Title>Products Expiring Soon</Card.Title>
                  <Card.Text>
                  <BsExclamationDiamondFill color="red"/> 
                    There are <strong>({expiringSoonProducts.length})</strong> products expiring within the next month.
                  </Card.Text>
                  <Button
                    variant="warning"
                    onClick={() => setShowExpiringSoonDetails(true)}
                  >
                    Show Details
                  </Button>
                </Card.Body>
              </Card>
            )}
            </div>

          <Button className="mb-3" onClick={() => setShowModal(true)}>
            Add Product (Scan Barcode)
          </Button>
          {isLoading ? (
            <p>Loading products...</p>
          ) : (
            <table className="table table-hover">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Name</th>
                  <th scope="col">Category ID</th>
                  <th scope="col">Supplier ID</th>
                  <th scope="col">Unit Price</th>
                  <th scope="col">Quantity in Stock</th>
                  <th scope="col">current Stock</th>
                  <th scope="col">Expiry Date</th>
                  <th scope="col">Actions</th>
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
                    <td>{new Date(product.expiry_date).toLocaleDateString("en-GB")}</td>
                    <td>
  <button
    className="btn btn-primary btn-sm me-2"
    onClick={() => {
      setEditingProduct(product); // Set the product to be edited
      setShowEditModal(true); // Open the edit modal
    }}
  >
    Edit
  </button>
  <button
    className="btn btn-danger btn-sm"
    onClick={() => deleteProduct(product.product_id)}
  >
    Delete
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
          <video
            ref={videoRef}
            style={{ width: "100%" }}
            id="video"
            autoPlay
            playsInline
          ></video>
          <div className="mt-2">
            <strong>{scanStatus}</strong>
          </div>
        </Modal.Body>
        <Modal.Footer> 
          <Button variant="secondary" onClick={() => setShowBarcodeModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal for Adding a Product */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={newProduct.name}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Control
                as="select"
                name="category_id"
                value={newProduct.category_id}
                onChange={handleInputChange}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.category_id} value={category.category_id}>
                    {category.name}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Supplier</Form.Label>
              <Form.Control
                as="select"
                name="supplier_id"
                value={newProduct.supplier_id}
                onChange={handleInputChange}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.supplier_id} value={supplier.supplier_id}>
                    {supplier.name}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Unit Price</Form.Label>
              <Form.Control
                type="number"
                name="unit_price"
                value={newProduct.unit_price}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Quantity in Stock</Form.Label>
              <Form.Control
                type="number"
                name="quantity_in_stock"
                value={newProduct.quantity_in_stock}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Minimum Stock Level</Form.Label>
              <Form.Control
                type="number"
                name="minimum_stock_level"
                value={newProduct.minimum_stock_level}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Expiry Date</Form.Label>
              <Form.Control
                type="date"
                name="expiry_date"
                value={newProduct.expiry_date}
                onChange={handleInputChange}
              />
            </Form.Group>
            <div className="d-flex justify-content-space-between">
            <Button className="mb-3" variant="primary" onClick={handleAddProduct}>
              Add Product
            </Button>
            <Button className="mb-3" onClick={() => setShowBarcodeModal(true)}>
            (Scan Barcode)
          </Button>
          </div>
          </Form>
          {errorMessage && <div className="alert alert-danger mt-3">{errorMessage}</div>} {/* Display error message here */}
        </Modal.Body>
      </Modal>

      {/* Modal for Low Stock Products Details */}
      <Modal show={showLowStockDetails} onHide={() => setShowLowStockDetails(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Low Stock Products Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {lowStockProducts.length > 0 ? (
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Supplier</th>
                  <th>Quantity</th>
                  <th>Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((product) => (
                  <tr key={product.product_id}>
                    <td>{product.name}</td>
                    <td>{product.category_id}</td>
                    <td>{product.supplier_id}</td>
                    <td>{product.current_stock}</td>
                    <td>{new Date(product.expiry_date).toLocaleDateString("en-GB")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No low stock products found.</p>
          )}
        </Modal.Body>
      </Modal>

       {/* Modal for Expiring Soon Products */}
       <Modal show={showExpiringSoonDetails} onHide={() => setShowExpiringSoonDetails(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Expiring Soon Products Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {expiringSoonProducts.length > 0 ? (
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Supplier</th>
                  <th>Quantity</th>
                  <th>Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                {expiringSoonProducts.map((product) => (
                  <tr key={product.product_id}>
                    <td>{product.name}</td>
                    <td>{product.category_id}</td>
                    <td>{product.supplier_id}</td>
                    <td>{product.current_stock}</td>
                    <td>{new Date(product.expiry_date).toLocaleDateString("en-GB")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No products expiring soon found.</p>
          )}
        </Modal.Body>
      </Modal>
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>Edit Product</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {editingProduct && (
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            name="name"
            value={editingProduct.name}
            onChange={(e) =>
              setEditingProduct({ ...editingProduct, name: e.target.value })
            }
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Category</Form.Label>
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
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.category_id} value={category.category_id}>
                {category.name}
              </option>
            ))}
          </Form.Control>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Supplier</Form.Label>
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
              <option key={supplier.supplier_id} value={supplier.supplier_id}>
                {supplier.name}
              </option>
            ))}
          </Form.Control>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Unit Price</Form.Label>
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
          <Form.Label>Quantity in Stock</Form.Label>
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
          <Form.Label>Minimum Stock Level</Form.Label>
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
          <Form.Label>Expiry Date</Form.Label>
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
        <Button
          variant="primary"
          onClick={() => handleEditProduct()}
        >
          Save Changes
        </Button>
      </Form>
    )}
  </Modal.Body>
</Modal>

    </div>
  );
};

export default Products;
