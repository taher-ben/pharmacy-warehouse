import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import API from "../services/api";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contact: "",
    address: "",
  });

  const [editSupplier, setEditSupplier] = useState(null); // State for editing a supplier

  // Fetch suppliers from the server
  const fetchSuppliers = async () => {
    try {
      const response = await API.get("/suppliers");
      setSuppliers(response.data); // Assuming the backend sends an array of suppliers
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  // Add a new supplier
  const addSupplier = async () => {
    if (!newSupplier.name || !newSupplier.contact || !newSupplier.address) {
      alert("All fields are required!");
      return;
    }
    try {
      const response = await API.post("/suppliers", newSupplier);
      alert(response.data.message || "Supplier added successfully");
      setNewSupplier({ name: "", contact: "", address: "" });
      fetchSuppliers();
    } catch (error) {
      console.error("Error adding supplier:", error);
    }
  };

  // Edit a supplier
  const handleEdit = (supplier) => {
    setEditSupplier({ ...supplier }); // Load the supplier into the edit form
  };

  const updateSupplier = async () => {
    if (!editSupplier.name || !editSupplier.contact || !editSupplier.address) {
      alert("All fields are required!");
      return;
    }
    try {
      const response = await API.put(`/suppliers/${editSupplier.supplier_id}`, editSupplier);
      alert(response.data.message || "Supplier updated successfully");
      setEditSupplier(null); // Close the edit form
      fetchSuppliers();
    } catch (error) {
      console.error("Error updating supplier:", error);
    }
  };

  // Delete a supplier
  const deleteSupplier = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        await API.delete(`/suppliers/${id}`);
        setSuppliers(suppliers.filter((supplier) => supplier.supplier_id !== id));
      } catch (error) {
        console.error("Error deleting supplier:", error);
      }
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  return (
    <div className="p-container my-4 d-flex">
      <Sidebar />
      <div className="content flex-grow-1 d-flex flex-column mx-2">
        <Topbar />
        <h1 className="mb-4">Suppliers</h1>

        {/* Add Supplier Section */}
        <div className="mb-4">
          <h4>Add New Supplier</h4>
          <div className="row g-2">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Name"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Contact"
                value={newSupplier.contact}
                onChange={(e) => setNewSupplier({ ...newSupplier, contact: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Address"
                value={newSupplier.address}
                onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
              />
            </div>
            <div className="col-12 mt-2">
              <button className="btn btn-primary w-100" onClick={addSupplier}>
                Add Supplier
              </button>
            </div>
          </div>
        </div>

        {/* Edit Supplier Section */}
        {editSupplier && (
          <div className="mb-4">
            <h4>Edit Supplier</h4>
            <div className="row g-2">
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Name"
                  value={editSupplier.name}
                  onChange={(e) => setEditSupplier({ ...editSupplier, name: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Contact"
                  value={editSupplier.contact}
                  onChange={(e) => setEditSupplier({ ...editSupplier, contact: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Address"
                  value={editSupplier.address}
                  onChange={(e) => setEditSupplier({ ...editSupplier, address: e.target.value })}
                />
              </div>
              <div className="col-6 mt-2">
                <button className="btn btn-success w-100" onClick={updateSupplier}>
                  Save Changes
                </button>
              </div>
              <div className="col-6 mt-2">
                <button className="btn btn-secondary w-100" onClick={() => setEditSupplier(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Display Suppliers */}
        <div className="row">
          {suppliers.map((supplier) => (
            <div key={supplier.supplier_id} className="col-md-4">
              <div className="card mb-4">
                <div className="card-body">
                  <h5 className="card-title">{supplier.name}</h5>
                  <p className="card-text">
                    <strong>Contact:</strong> {supplier.contact_details} <br />
                    <strong>Address:</strong> {supplier.address}
                  </p>
                  <button
                    className="btn btn-warning btn-sm me-2"
                    onClick={() => handleEdit(supplier)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteSupplier(supplier.supplier_id)}
                  >
                    Delete
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
