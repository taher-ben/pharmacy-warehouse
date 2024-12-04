import React, { useState, useEffect } from "react";
import Sidebar from "./sidebar"; // Import your Sidebar component
import Topbar from "./topbar";   // Import your Topbar component
import API from "../services/api";
import 'bootstrap/dist/css/bootstrap.min.css';
import { BiX } from 'react-icons/bi';  // Import the bi-x-lg icon from react-icons

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Fetch categories and products
  const fetchCategories = async () => {
    try {
      const response = await API.get("/category");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Add a new category
  const addCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Category name cannot be empty!");
      return;
    }
    try {
      const response = await API.post("/categories/add", { name: newCategoryName });
      alert(response.data.message);
      setNewCategoryName(""); // Reset input
      fetchCategories(); // Refresh categories
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  // Delete a category
  const deleteCategory = async (categoryId) => {
    try {
      const response = await API.delete(`/categories/${categoryId}`);
      alert(response.data.message);
      // Remove the deleted category from the state
      setCategories(categories.filter(category => category.category_id !== categoryId));
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="d-flex min-vh-100">
      {/* Sidebar */}
      <Sidebar />

      <div className="flex-fill d-flex flex-column">
        {/* Topbar */}
        <Topbar title="Categories" />

        {/* Main Content */}
        <div className="container py-4">
          {/* Add Category Section */}
          <div className="mb-4">
            <h2>Add New Category</h2>
            <div className="d-flex gap-2 align-items-center">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
                className="form-control flex-grow-1"
              />
              <button
                onClick={addCategory}
                className="btn btn-primary"
              >
                Add Category
              </button>
            </div>
          </div>

          {/* Display Categories */}
          <div className="d-flex flex-wrap gap-4">
            {categories.map((category) => (
              <div key={category.category_id} className="card position-relative" style={{ width: "300px", minHeight: "200px" }}>
                {/* Header with category name and delete button */}
                <div className="card-header text-center position-relative">
                  <h5>{category.name}</h5>
                  <button
                    onClick={() => deleteCategory(category.category_id)}
                    className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                    style={{ fontSize: "20px", padding: "0.5rem" }}
                  >
                    <BiX /> {/* Using the bi-x-lg icon from react-icons */}
                  </button>
                </div>

                {/* Card Body with reduced padding */}
                <div className="card-body p-3" style={{ paddingBottom: "10px" }}>
                  {category.products.length > 0 ? (
                    <table className="table table-striped table-bordered">
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th>Quantity</th>
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
                    <p className="text-center">No products in this category.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;
