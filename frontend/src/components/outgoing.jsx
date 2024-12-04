import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import API from "../services/api";
import { Modal, Button, Form } from "react-bootstrap";
import { BrowserMultiFormatReader } from "@zxing/library"; // Import ZXing library

const Outgoing = () => {
  const [scannedProducts, setScannedProducts] = useState([]); // State for scanned products
  const [categories, setCategories] = useState([]); // State to store categories
  const [isLoading, setIsLoading] = useState(true);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false); // Barcode scan modal state
  const [showProductModal, setShowProductModal] = useState(false); // Product details modal state
  const [scanStatus, setScanStatus] = useState(""); // Scan status message
  const [productDetails, setProductDetails] = useState(null); // Scanned product details
  const [editProduct, setEditProduct] = useState(null); // Edit product modal state
  const [errorMessage, setErrorMessage] = useState("");
  const videoRef = useRef(null); // Reference for the video element

  // Fetch scanned products and categories on component mount
  useEffect(() => {
    const fetchScannedProducts = async () => {
      try {
        const response = await API.get("/scanned_products");
        setScannedProducts(response.data);
      } catch (error) {
        console.error("Error fetching scanned products:", error);
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

    fetchScannedProducts();
    fetchCategories();
    setIsLoading(false);
  }, []);

  // Handle barcode scanning logic
  const handleScan = async (result) => {
    if (result) {
      try {
        const barcode = result.text; // Extract the barcode from the scanned result
        const response = await API.get(`/products/${barcode}`); // Fetch product details

        if (response.data) {
          setProductDetails({
            barcode: barcode,
            name: response.data.name,
            expiryDate: response.data.expiry_date,
            quantity: 1, // Default quantity
          });
          setShowProductModal(true); // Show the product details modal
        } else {
          setScanStatus("Product not found in the database.");
        }
        setShowBarcodeModal(false); // Close barcode scanning modal
      } catch (error) {
        console.error("Error fetching product details:", error);
        setScanStatus("Error fetching product details. Please try again.");
      }
    } else {
      setScanStatus("No barcode detected. Please try again.");
    }
  };

  const handleError = (err) => {
    console.error("Barcode Scan Error: ", err);
    setScanStatus("Error scanning. Please check your camera or barcode.");
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

  // Handle editing a product
  const handleEdit = (product) => {
    setEditProduct(product);
  };

  // Save edits
  const saveEdit = async () => {
    try {
      await API.put(`/scanned_products/${editProduct.id}`, editProduct);
      alert("Product updated successfully!");
      setEditProduct(null);
      const updatedProducts = await API.get("/scanned_products");
      setScannedProducts(updatedProducts.data);
    } catch (error) {
      console.error("Error updating product:", error);
      setErrorMessage("Failed to update the product.");
    }
  };

 // Handle deleting a product
const handleDelete = async (id, barcode) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        // Send a DELETE request with barcode as a query parameter
        await API.delete(`/scanned_products/${id}?barcode=${barcode}`);
        
        // Update the state to remove the deleted product
        setScannedProducts(scannedProducts.filter((product) => product.id !== id));
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };
  

 // Function to save the scanned product (i.e., add a new scan to the database)
const saveScannedProduct = async () => {
    try {
      // Send a POST request to add the new scan to the database
      const response = await API.post("/scanned_products", {
        barcode: productDetails.barcode, // Assuming productDetails includes barcode
        quantity: productDetails.quantity, // Send the quantity from product details
        scanned_at: new Date(), // Optionally, send the scan timestamp
      });
  
      alert("Product added successfully!");
      setShowProductModal(false); // Close the modal
  
      // Optionally, refresh the list of products if needed
      const updatedProducts = await API.get("/scanned_products");
      setScannedProducts(updatedProducts.data); // Update the list of scanned products
    } catch (error) {
      console.error("Error adding product:", error);
      setErrorMessage("Failed to add the product.");
    }
  };
  
  

  return (
    <div className="p-container d-flex">
      <Sidebar />
      <div className="content flex-grow-1 d-flex flex-column mx-2">
        <Topbar />
        <div className="p-3">
          <Button className="mb-3" onClick={() => setShowBarcodeModal(true)}>
            Scan Product Barcode
          </Button>
          {isLoading ? (
            <p>Loading scanned products...</p>
          ) : (
            <table className="table table-hover">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Barcode</th>
                  <th scope="col">Product Name</th>
                  <th scope="col">Scan Time</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scannedProducts.length === 0 ? (
                  <tr>
                    <td colSpan="5">No scanned products found.</td>
                  </tr>
                ) : (
                  scannedProducts.map((product) => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>{product.barcode}</td>
                      <td>{product.product_name}</td>
                      <td>{new Date(product.scanned_at).toLocaleDateString("en-GB")}</td>
                      <td>{product.quantity}</td>
                      <td>
                        <Button variant="warning" onClick={() => handleEdit(product)}>
                          Edit
                        </Button>{" "}
                        <Button variant="danger" onClick={() => handleDelete(product.id, product.barcode)}>
                          Delete
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

      {/* Modal for Barcode Scanning */}
      <Modal show={showBarcodeModal} onHide={() => setShowBarcodeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Scan Product Barcode</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <video ref={videoRef} style={{ width: "100%" }} id="video" autoPlay playsInline></video>
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

      {/* Modal for Product Details */}
<Modal show={showProductModal} onHide={() => setShowProductModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>Product Details</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {productDetails ? (
      <div>
        <p><strong>Name:</strong> {productDetails.name}</p>
        <p><strong>Expiry Date:</strong> {new Date(productDetails.expiryDate).toLocaleDateString("en-GB")}</p>
        <p><strong>Quantity:</strong>
          <input
            type="number"
            value={productDetails.quantity || 1} 
            onChange={(e) => setProductDetails({ ...productDetails, quantity: parseInt(e.target.value) })} // Update quantity
            min="1" // Prevent the user from entering less than 1
            style={{ width: "100px" }} // Adjust input width for better presentation
          />
        </p>
      </div>
    ) : (
      <p>No product details available.</p>
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="primary" onClick={saveScannedProduct}>
      Save Changes
    </Button>
    <Button variant="secondary" onClick={() => setShowProductModal(false)}>
      Close
    </Button>
  </Modal.Footer>
</Modal>

      {/* Modal for Editing a Product */}
      <Modal show={!!editProduct} onHide={() => setEditProduct(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                value={editProduct?.quantity || ""}
                onChange={(e) =>
                  setEditProduct({ ...editProduct, quantity: e.target.value })
                }
              />
            </Form.Group>
          </Form>
          {errorMessage && <div className="alert alert-danger mt-3">{errorMessage}</div>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={saveEdit}>
            Save Changes
          </Button>
          <Button variant="secondary" onClick={() => setEditProduct(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Outgoing;
