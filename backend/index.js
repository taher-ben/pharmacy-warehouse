const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// MySQL Database connection
const db = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "warehouse"
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
  } else {
    console.log("Connected to the database");
  }
});

const updateCurrentStock = (barcode) => {
    const query = `
      UPDATE products p
      SET p.current_stock = p.quantity_in_stock- IFNULL(
          (SELECT SUM(sp.quantity)
           FROM scanned_products sp
           WHERE sp.barcode = p.barcode), 0)
      WHERE p.barcode = ?;
    `;
    db.query(query, [barcode], (err, results) => {
      if (err) {
        console.error("Error updating current stock:", err);
      } else {
        console.log("Current stock updated successfully.");
      }
    });
  };
  

// Fetch products from the database
app.get("/api/products", (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) {
      console.error("Error fetching products:", err);
      res.status(500).json({ error: "Failed to fetch products" });
    } else {
      res.json(results);
    }
  });
});

// Fetch categories from the database
app.get("/api/categories", (req, res) => {
  db.query("SELECT * FROM categories", (err, results) => {
    if (err) {
      console.error("Error fetching categories:", err);
      res.status(500).json({ error: "Failed to fetch categories" });
    } else {
      res.json(results);
    }
  });
});

// Fetch suppliers from the database
app.get("/api/suppliers", (req, res) => {
  db.query("SELECT * FROM suppliers", (err, results) => {
    if (err) {
      console.error("Error fetching suppliers:", err);
      res.status(500).json({ error: "Failed to fetch suppliers" });
    } else {
      res.json(results);
    }
  });
});

// Add a new product to the database
app.post("/api/products/add", (req, res) => {
    const { name, category_id, supplier_id, unit_price, quantity_in_stock, minimum_stock_level, expiry_date, barcode } = req.body;
  
    const query = `
      INSERT INTO products (name, category_id, supplier_id, unit_price, quantity_in_stock, minimum_stock_level, expiry_date, barcode) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
  
    const values = [
      name,
      category_id,
      supplier_id,
      unit_price,
      quantity_in_stock,
      minimum_stock_level,
      expiry_date,
      barcode,
    ];
  
    db.query(query, values, (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          // Handling duplicate barcode error
          console.error("Duplicate barcode error:", err);
          return res.status(400).json({ message: "Barcode already exists. Please use a unique barcode." });
        }
        console.error("Error adding product:", err);
        return res.status(500).json({ error: "Failed to add product" });
      }
      
      res.status(201).json({ message: "Product added successfully", productId: result.insertId });
    });
  });
  

// Delete a product
app.delete("/api/products/delete/:id", (req, res) => {
    const productId = req.params.id;
  
    const query = 'DELETE FROM products WHERE product_id = ?';
  
    db.query(query, [productId], (err, result) => {
      if (err) {
        console.error("Error deleting product:", err);
        res.status(500).json({ error: 'Failed to delete product', message: err.message });
      } else if (result.affectedRows === 0) {
        res.status(404).json({ error: 'Product not found' });
      } else {
        res.status(200).json({ message: 'Product deleted successfully' });
      }
    });
  });

  // Edit Product Endpoint
app.put("/api/products/edit/:id", (req, res) => {
    const productId = req.params.id;
    const {
      name,
      category_id,
      supplier_id,
      unit_price,
      quantity_in_stock,
      minimum_stock_level,
      expiry_date,
    } = req.body;
  
    // Update query
    const query = `
      UPDATE products 
      SET 
        name = ?, 
        category_id = ?, 
        supplier_id = ?, 
        unit_price = ?, 
        quantity_in_stock = ?, 
        minimum_stock_level = ?, 
        expiry_date = ?
      WHERE product_id = ?
    `;
  
    const values = [
      name,
      category_id,
      supplier_id,
      unit_price,
      quantity_in_stock,
      minimum_stock_level,
      expiry_date,
      productId,
    ];
  
    // Execute query
    db.query(query, values, (err, result) => {
      if (err) {
        console.error("Error updating product:", err);
        res.status(500).json({ error: 'Failed to update product', message: err.message });
      } else if (result.affectedRows === 0) {
        res.status(404).json({ error: 'Product not found' });
      } else {
        // Fetch updated product to send back
        const selectQuery = 'SELECT * FROM products WHERE product_id = ?';
        db.query(selectQuery, [productId], (selectErr, rows) => {
          if (selectErr) {
            console.error("Error fetching updated product:", selectErr);
            res.status(500).json({ error: 'Failed to fetch updated product', message: selectErr.message });
          } else {
            res.status(200).json(rows[0]);
          }
        });
      }
    });
  });


// Fetch all categories with their products
app.get("/api/category", (req, res) => {
    const query = `
      SELECT 
        c.category_id, 
        c.name AS category_name,  -- Alias to make sure it's clear as category name
        p.product_id,
        p.name AS product_name,   -- Alias to clarify it's the product name
        p.current_stock
      FROM 
        categories c
      LEFT JOIN 
        products p
      ON 
        c.category_id = p.category_id
      ORDER BY 
        c.category_id, p.name;
    `;
  
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching categories and products:", err);
        res.status(500).json({ error: "Failed to fetch data" });
      } else {
        // Group products under their respective categories
        const categoriesMap = {};
        results.forEach((row) => {
          // Initialize the category object if it doesn't exist
          if (!categoriesMap[row.category_id]) {
            categoriesMap[row.category_id] = {
              category_id: row.category_id,
              name: row.category_name,   // Use category_name
              products: [],
            };
          }
  
          // Add product if present
          if (row.product_id) {
            categoriesMap[row.category_id].products.push({
              product_id: row.product_id,
              name: row.product_name,    // Use product_name
              current_stock: row.current_stock,
            });
          }
        });
  
        // Convert the map object to an array of categories
        const categories = Object.values(categoriesMap);
        res.status(200).json(categories);
      }
    });
  });
  

  // Add a new category
app.post("/api/categories/add", (req, res) => {
    const { name } = req.body;
  
    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }
  
    const query = "INSERT INTO categories (name) VALUES (?)";
    db.query(query, [name], (err, result) => {
      if (err) {
        console.error("Error adding category:", err);
        res.status(500).json({ error: "Failed to add category" });
      } else {
        res.status(201).json({ message: "Category added successfully" });
      }
    });
  });

  app.delete("/api/categories/:categoryId", (req, res) => {
    const { categoryId } = req.params;
    const query = "DELETE FROM categories WHERE category_id = ?";
    db.query(query, [categoryId], (err, results) => {
      if (err) {
        console.error("Error deleting category:", err);
        res.status(500).json({ error: "Failed to delete category" });
      } else {
        res.status(200).json({ message: "Category deleted successfully" });
      }
    });
  });

  app.get("/api/scanned_products", (req, res) => {
    const query = `
      SELECT 
        scanned_products.*, 
        products.name AS product_name 
      FROM scanned_products
      JOIN products ON scanned_products.barcode = products.barcode
    `;
  
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ error: "Failed to fetch products" });
      } else {
        res.json(results); // Send the results including the product name
      }
    });
  });
  
  
  app.get("/api/products/:barcode", (req, res) => {
    const { barcode } = req.params;
    db.query("SELECT name, expiry_date FROM products WHERE barcode = ?", [barcode], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database query failed." });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "Product not found." });
      }
      res.json(results[0]);
    });
  });
  
  
  app.put("/api/scanned_products/:id", (req, res) => {
    const { id } = req.params;
    const { quantity, barcode } = req.body;
  
    const query = "UPDATE scanned_products SET quantity = ? WHERE id = ?";
    db.query(query, [quantity, id], (err, result) => {
      if (err) {
        console.error("Error updating scanned product:", err);
        return res.status(500).json({ error: "Failed to update the scanned product" });
      }
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Scanned product not found" });
      }
      updateCurrentStock(barcode); 
      res.json({ message: "Product updated successfully" });
    });
  });

  app.delete("/api/scanned_products/:id", (req, res) => {
    const { id } = req.params;
    const { barcode } = req.query; 
  
    const query = "DELETE FROM scanned_products WHERE id = ?";
    db.query(query, [id], (err, result) => {
      if (err) {
        console.error("Error deleting scanned product:", err);
        return res.status(500).json({ error: "Failed to delete the scanned product" });
      }
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Scanned product not found" });
      }
      updateCurrentStock(barcode); 
  
      res.json({ message: "Product deleted successfully" });
    });
  });
  
  // Function to add a new scanned product (new scan)
app.post("/api/scanned_products", (req, res) => {
    const { barcode, quantity, scanned_at } = req.body; // Get product details from the request body
  
    // SQL query to insert the new scanned product into the database
    const query = "INSERT INTO scanned_products (barcode, quantity, scanned_at) VALUES (?, ?, ?)";
  
    db.query(query, [barcode, quantity, scanned_at], (err, result) => {
      if (err) {
        console.error("Error adding product:", err);
        return res.status(500).json({ message: "Failed to add product." });
      }
      updateCurrentStock(barcode); 
  
      // Successfully added
      return res.status(201).json({ message: "Product added successfully.", productId: result.insertId });
    });
  });

  app.get("/api/products_name", (req, res) => {
    const { name } = req.query;
    const query = "SELECT * FROM products WHERE name LIKE ?";
    db.query(query, [`%${name}%`], (err, results) => {
      if (err) {
        console.error("Error fetching product by name:", err);
        return res.status(500).send("Server error");
      }
      if (results.length > 0) {
        res.json(results[0]);
      } else {
        res.status(404).send("Product not found.");
      }
    });
  });
  
  app.get("/api/suppliers", (req, res) => {
    db.query("SELECT * FROM suppliers", (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error fetching suppliers");
      }
      res.json(results);
    });
  });
  
  app.post("/api/suppliers", (req, res) => {
    const { name, contact, address } = req.body;
    db.query("INSERT INTO suppliers (name, contact_details, address) VALUES (?, ?, ?)", [name, contact, address], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error adding supplier");
      }
      res.json({ message: "Supplier added successfully" });
    });
  });

  app.put("/api/suppliers/:id", (req, res) => {
    const { id } = req.params;
    const { name, contact, address } = req.body;
    db.query(
      "UPDATE suppliers SET name = ?, contact_details = ?, address = ? WHERE supplier_id = ?",
      [name, contact, address, id],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Error updating supplier");
        }
        res.json({ message: "Supplier updated successfully" });
      }
    );
  });
  
  
  app.delete("/api/suppliers/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM suppliers WHERE supplier_id = ?", [id], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error deleting supplier");
      }
      res.json({ message: "Supplier deleted successfully" });
    });
  });
  

// Server Listening
app.listen(8081, () => {
  console.log("Server is listening on port 8081");
});
