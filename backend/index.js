const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// الاتصال بقاعدة بيانات MySQL
const db = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "warehouse",
});

// الاتصال بقاعدة البيانات
db.connect((err) => {
  if (err) {
    console.error("خطأ في الاتصال بقاعدة البيانات:", err);
  } else {
    console.log("Database connected successfully");
    const query = `SELECT * FROM USERS WHERE username = ?`;
    db.query(query, ["gat warehouse admin"], (err, results) => {
      if (err) {
        console.log(err);
      } else if (results.length === 0) {
        const createQuery = `INSERT INTO USERS (fullName, username, password) VALUES(?, ?, ?)`;
        db.query(
          createQuery,
          ["مسؤول عام", "gat warehouse admin", "ghat warehouse password"],
          (err) => {
            if (err) console.log("حدث خطأ أثناء تسجيل المسؤول", err);
            else console.log("تم تسجيل المسؤول بنجاح");
          }
        );
      } else {
        console.log("يوجد مسؤول بالفعل");
      }
    });
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
      console.error("خطأ في تحديث الكمية الحالية:", err);
    } else {
      console.log("تم تحديث الكمية الحالية بنجاح.");
    }
  });
};

// create token function
const createToken = (userId) => {
  const token = jwt.sign({ id: userId }, "secretKey", { expiresIn: "20h" });
  return token;
};

// تسجيل الدخول
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const query = "SELECT * FROM users WHERE username = ? AND password = ?";
  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error("خطأ في تسجيل الدخول:", err);
      res.status(500).json({ error: "خطأ في تسجيل الدخول" });
    } else if (results.length === 0) {
      res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    } else {
      const token = createToken(results[0].id);
      res.status(200).json({ message: "تم تسجيل الدخول بنجاح", token });
    }
  });
});

// التحقق من تسجيل الدخول
const protect = (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "لم يتم توفير رمز التحقق" });
  }
  jwt.verify(token, "secretKey", (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).json({ error: "رمز التحقق غير صالح" });
    }
    userId = decoded.id;
    const query = "SELECT * FROM users WHERE id = ?";
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error("خطأ في التحقق من تسجيل الدخول:", err);
        res.status(500).json({ error: "خطأ في التحقق من تسجيل الدخول" });
      } else if (results.length === 0) {
        res.status(401).json({ error: "المستخدم غير موجود" });
      } else {
        req.user = results[0];
        next();
      }
    });
  });
};

app.use(protect);

// جلب المنتجات من قاعدة البيانات
app.get("/api/products", (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) {
      console.error("خطأ في جلب المنتجات:", err);
      res.status(500).json({ error: "فشل في جلب المنتجات" });
    } else {
      res.json(results);
    }
  });
});

// جلب الفئات من قاعدة البيانات
app.get("/api/categories", (req, res) => {
  db.query("SELECT * FROM categories", (err, results) => {
    if (err) {
      console.error("خطأ في جلب الفئات:", err);
      res.status(500).json({ error: "فشل في جلب الفئات" });
    } else {
      res.json(results);
    }
  });
});

// جلب الموردين من قاعدة البيانات
app.get("/api/suppliers", (req, res) => {
  db.query("SELECT * FROM suppliers", (err, results) => {
    if (err) {
      console.error("خطأ في جلب الموردين:", err);
      res.status(500).json({ error: "فشل في جلب الموردين" });
    } else {
      res.json(results);
    }
  });
});

// إضافة منتج جديد إلى قاعدة البيانات
app.post("/api/products/add", (req, res) => {
  const {
    name,
    category_id,
    supplier_id,
    unit_price,
    quantity_in_stock,
    minimum_stock_level,
    expiry_date,
    barcode,
    current_stock,
  } = req.body;

  const query = `
      INSERT INTO products (name, category_id, supplier_id, unit_price, quantity_in_stock, minimum_stock_level, expiry_date, barcode,current_stock) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)
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
    quantity_in_stock,
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        // التعامل مع خطأ تكرار رمز الباركود
        console.error("خطأ في التكرار: رمز الباركود موجود بالفعل");
        return res.status(400).json({
          message: "رمز الباركود موجود بالفعل. يرجى استخدام رمز باركود فريد.",
        });
      }
      console.error("خطأ في إضافة المنتج:", err);
      return res.status(500).json({ error: "فشل في إضافة المنتج" });
    }

    res.status(201).json({
      message: "تم إضافة المنتج بنجاح",
      productId: result.insertId,
    });
  });
});

// حذف منتج
app.delete("/api/products/delete/:id", (req, res) => {
  const productId = req.params.id;

  const query = "DELETE FROM products WHERE product_id = ?";

  db.query(query, [productId], (err, result) => {
    if (err) {
      console.error("خطأ في حذف المنتج:", err);
      res
        .status(500)
        .json({ error: "فشل في حذف المنتج", message: err.message });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ error: "المنتج غير موجود" });
    } else {
      res.status(200).json({ message: "تم حذف المنتج بنجاح" });
    }
  });
});

// تعديل منتج
app.put("/api/products/edit/:id", (req, res) => {
  const productId = req.params.id;
  const { barcode } = req.query;
  const {
    name,
    category_id,
    supplier_id,
    unit_price,
    quantity_in_stock,
    minimum_stock_level,
    expiry_date,
  } = req.body;

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

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("خطأ في تعديل المنتج:", err);
      res
        .status(500)
        .json({ error: "فشل في تعديل المنتج", message: err.message });
    } else if (result.affectedRows === 0) {
      res.status(404).json({ error: "المنتج غير موجود" });
    } else {
      const selectQuery = "SELECT * FROM products WHERE product_id = ?";
      db.query(selectQuery, [productId], (selectErr, rows) => {
        if (selectErr) {
          console.error("خطأ في جلب المنتج المعدل:", selectErr);
          res.status(500).json({
            error: "فشل في جلب المنتج المعدل",
            message: selectErr.message,
          });
        } else {
          res.status(200).json(rows[0]);
        }
      });
    }
  });
  updateCurrentStock(barcode);
});

// جلب جميع الفئات مع منتجاتها
app.get("/api/category", (req, res) => {
  const query = `
      SELECT 
        c.category_id, 
        c.name AS category_name, 
        p.product_id,
        p.name AS product_name,   
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
      console.error("خطأ في جلب الفئات والمنتجات:", err);
      res.status(500).json({ error: "فشل في جلب البيانات" });
    } else {
      const categoriesMap = {};
      results.forEach((row) => {
        if (!categoriesMap[row.category_id]) {
          categoriesMap[row.category_id] = {
            category_id: row.category_id,
            name: row.category_name,
            products: [],
          };
        }
        if (row.product_id) {
          categoriesMap[row.category_id].products.push({
            product_id: row.product_id,
            name: row.product_name,
            current_stock: row.current_stock,
          });
        }
      });

      const categories = Object.values(categoriesMap);
      res.status(200).json(categories);
    }
  });
});

// إضافة فئة جديدة
app.post("/api/categories/add", (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "اسم الفئة مطلوب" });
  }

  const query = "INSERT INTO categories (name) VALUES (?)";
  db.query(query, [name], (err, result) => {
    if (err) {
      console.error("خطأ في إضافة الفئة:", err);
      res.status(500).json({ error: "فشل في إضافة الفئة" });
    } else {
      res.status(201).json({ message: "تم إضافة الفئة بنجاح" });
    }
  });
});

// حذف فئة
app.delete("/api/categories/:categoryId", (req, res) => {
  const { categoryId } = req.params;
  const query = "DELETE FROM categories WHERE category_id = ?";
  db.query(query, [categoryId], (err, results) => {
    if (err) {
      console.error("خطأ في حذف الفئة:", err);
      res.status(500).json({ error: "فشل في حذف الفئة" });
    } else {
      res.status(200).json({ message: "تم حذف الفئة بنجاح" });
    }
  });
});

// جلب المنتجات التي تم مسحها ضوئيا
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
      console.error("خطأ في جلب المنتجات:", err);
      res.status(500).json({ error: "فشل في جلب المنتجات" });
    } else {
      res.json(results);
    }
  });
});

// جلب منتج حسب رمز الباركود
app.get("/api/products/:barcode", (req, res) => {
  const { barcode } = req.params;
  db.query(
    "SELECT name, expiry_date FROM products WHERE barcode = ?",
    [barcode],
    (err, results) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ error: "فشل في الاستعلام عن قاعدة البيانات." });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "المنتج غير موجود." });
      }
      res.json(results[0]);
    }
  );
});

// البحث عن المنتجات بالاسم
app.get("/api/products", (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: "اسم المنتج مطلوب." });
  }

  const query = "SELECT * FROM products WHERE name LIKE ?";
  db.query(query, [`%${name}%`], (err, results) => {
    if (err) {
      console.error("خطأ في البحث عن المنتج بالاسم:", err);
      res.status(500).json({ error: "خطأ في البحث عن المنتج بالاسم." });
    } else if (results.length === 0) {
      res.status(404).json({ error: "لا توجد منتجات تحمل الاسم المعطى." });
    } else {
      res.json(results);
    }
  });
});

// تعديل الكمية للمنتجات التي تم مسحها ضوئيا
app.put("/api/scanned_products/:id", (req, res) => {
  const { id } = req.params;
  const { quantity, barcode } = req.body;

  const query = "UPDATE scanned_products SET quantity = ? WHERE id = ?";
  db.query(query, [quantity, id], (err, result) => {
    if (err) {
      console.error("خطأ في تحديث المنتج المسح الضوئي:", err);
      return res
        .status(500)
        .json({ error: "فشل في تحديث المنتج المسح الضوئي" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "المنتج المسح الضوئي غير موجود" });
    }
    updateCurrentStock(barcode);
    res.json({ message: "تم تحديث المنتج بنجاح" });
  });
});

// حذف منتج تم مسحه ضوئيا
app.delete("/api/scanned_products/:id", (req, res) => {
  const { id } = req.params;
  const { barcode } = req.query;

  const query = "DELETE FROM scanned_products WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("خطأ في حذف المنتج المسح الضوئي:", err);
      return res.status(500).json({ error: "فشل في حذف المنتج المسح الضوئي" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "المنتج المسح الضوئي غير موجود" });
    }
    updateCurrentStock(barcode);

    res.json({ message: "تم حذف المنتج بنجاح" });
  });
});

// إضافة منتج مسح ضوئي جديد
app.post("/api/scanned_products", (req, res) => {
  const { barcode, quantity, scanned_at } = req.body;

  const query =
    "INSERT INTO scanned_products (barcode, quantity, scanned_at) VALUES (?, ?, ?)";

  db.query(query, [barcode, quantity, scanned_at], (err, result) => {
    if (err) {
      console.error("خطأ في إضافة المنتج:", err);
      return res.status(500).json({ message: "فشل في إضافة المنتج." });
    }
    updateCurrentStock(barcode);

    return res.status(201).json({
      message: "تم إضافة المنتج بنجاح.",
      productId: result.insertId,
    });
  });
});

// جلب المنتجات حسب الاسم
app.get("/api/products_name", (req, res) => {
  const { name } = req.query;
  const query =
    "SELECT * FROM products WHERE name LIKE ? OR barcode LIKE ? ORDER BY name ASC";
  db.query(query, [`%${name}%`, `%${name}%`], (err, rows) => {
    if (err) {
      console.error("خطأ في جلب البيانات:", err);
      return res.status(500).json({ error: "خطأ في جلب البيانات." });
    }
    res.json(rows);
  });
});

// Server Listening
app.listen(8081, () => {
  console.log("Server is listening on port 8081");
});

// const express = require("express");
// const mysql = require("mysql2");
// const cors = require("cors");

// const app = express();
// app.use(cors());
// app.use(express.json());

// // MySQL Database connection
// const db = mysql.createConnection({
//   host: "localhost",
//   port: 3306,
//   user: "root",
//   password: "",
//   database: "warehouse"
// });

// // Connect to the database
// db.connect((err) => {
//   if (err) {
//     console.error("Error connecting to the database:", err);
//   } else {
//     console.log("Connected to the database");
//   }
// });

// const updateCurrentStock = (barcode) => {
//     const query = `
//       UPDATE products p
//       SET p.current_stock = p.quantity_in_stock- IFNULL(
//           (SELECT SUM(sp.quantity)
//            FROM scanned_products sp
//            WHERE sp.barcode = p.barcode), 0)
//       WHERE p.barcode = ?;
//     `;
//     db.query(query, [barcode], (err, results) => {
//       if (err) {
//         console.error("Error updating current stock:", err);
//       } else {
//         console.log("Current stock updated successfully.");
//       }
//     });
//   };

// // Fetch products from the database
// app.get("/api/products", (req, res) => {
//   db.query("SELECT * FROM products", (err, results) => {
//     if (err) {
//       console.error("Error fetching products:", err);
//       res.status(500).json({ error: "Failed to fetch products" });
//     } else {
//       res.json(results);
//     }
//   });
// });

// // Fetch categories from the database
// app.get("/api/categories", (req, res) => {
//   db.query("SELECT * FROM categories", (err, results) => {
//     if (err) {
//       console.error("Error fetching categories:", err);
//       res.status(500).json({ error: "Failed to fetch categories" });
//     } else {
//       res.json(results);
//     }
//   });
// });

// // Fetch suppliers from the database
// app.get("/api/suppliers", (req, res) => {
//   db.query("SELECT * FROM suppliers", (err, results) => {
//     if (err) {
//       console.error("Error fetching suppliers:", err);
//       res.status(500).json({ error: "Failed to fetch suppliers" });
//     } else {
//       res.json(results);
//     }
//   });
// });

// // Add a new product to the database
// app.post("/api/products/add", (req, res) => {
//     const { name, category_id, supplier_id, unit_price, quantity_in_stock, minimum_stock_level, expiry_date, barcode,current_stock } = req.body;

//     const query = `
//       INSERT INTO products (name, category_id, supplier_id, unit_price, quantity_in_stock, minimum_stock_level, expiry_date, barcode,current_stock)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)
//     `;

//     const values = [
//       name,
//       category_id,
//       supplier_id,
//       unit_price,
//       quantity_in_stock,
//       minimum_stock_level,
//       expiry_date,
//       barcode,
//       quantity_in_stock,
//     ];

//     db.query(query, values, (err, result) => {
//       if (err) {
//         if (err.code === 'ER_DUP_ENTRY') {
//           // Handling duplicate barcode error
//           console.error("Duplicate barcode error:", err);
//           return res.status(400).json({ message: "Barcode already exists. Please use a unique barcode." });
//         }
//         console.error("Error adding product:", err);
//         return res.status(500).json({ error: "Failed to add product" });
//       }

//       res.status(201).json({ message: "Product added successfully", productId: result.insertId });
//     });
//   });

// // Delete a product
// app.delete("/api/products/delete/:id", (req, res) => {
//     const productId = req.params.id;

//     const query = 'DELETE FROM products WHERE product_id = ?';

//     db.query(query, [productId], (err, result) => {
//       if (err) {
//         console.error("Error deleting product:", err);
//         res.status(500).json({ error: 'Failed to delete product', message: err.message });
//       } else if (result.affectedRows === 0) {
//         res.status(404).json({ error: 'Product not found' });
//       } else {
//         res.status(200).json({ message: 'Product deleted successfully' });
//       }
//     });
//   });

//   // Edit Product Endpoint
// app.put("/api/products/edit/:id", (req, res) => {
//     const productId = req.params.id;
//     const { barcode } = req.query;
//     const {
//       name,
//       category_id,
//       supplier_id,
//       unit_price,
//       quantity_in_stock,
//       minimum_stock_level,
//       expiry_date,
//     } = req.body;

//     // Update query
//     const query = `
//       UPDATE products
//       SET
//         name = ?,
//         category_id = ?,
//         supplier_id = ?,
//         unit_price = ?,
//         quantity_in_stock = ?,
//         minimum_stock_level = ?,
//         expiry_date = ?
//       WHERE product_id = ?
//     `;

//     const values = [
//       name,
//       category_id,
//       supplier_id,
//       unit_price,
//       quantity_in_stock,
//       minimum_stock_level,
//       expiry_date,
//       productId,
//     ];

//     // Execute query
//     db.query(query, values, (err, result) => {
//       if (err) {
//         console.error("Error updating product:", err);
//         res.status(500).json({ error: 'Failed to update product', message: err.message });
//       } else if (result.affectedRows === 0) {
//         res.status(404).json({ error: 'Product not found' });
//       } else {
//         // Fetch updated product to send back
//         const selectQuery = 'SELECT * FROM products WHERE product_id = ?';
//         db.query(selectQuery, [productId], (selectErr, rows) => {
//           if (selectErr) {
//             console.error("Error fetching updated product:", selectErr);
//             res.status(500).json({ error: 'Failed to fetch updated product', message: selectErr.message });
//           } else {
//             res.status(200).json(rows[0]);
//           }
//         });
//       }
//     });
//     updateCurrentStock(barcode);
//   });

// // Fetch all categories with their products
// app.get("/api/category", (req, res) => {
//     const query = `
//       SELECT
//         c.category_id,
//         c.name AS category_name,  -- Alias to make sure it's clear as category name
//         p.product_id,
//         p.name AS product_name,   -- Alias to clarify it's the product name
//         p.current_stock
//       FROM
//         categories c
//       LEFT JOIN
//         products p
//       ON
//         c.category_id = p.category_id
//       ORDER BY
//         c.category_id, p.name;
//     `;

//     db.query(query, (err, results) => {
//       if (err) {
//         console.error("Error fetching categories and products:", err);
//         res.status(500).json({ error: "Failed to fetch data" });
//       } else {
//         // Group products under their respective categories
//         const categoriesMap = {};
//         results.forEach((row) => {
//           // Initialize the category object if it doesn't exist
//           if (!categoriesMap[row.category_id]) {
//             categoriesMap[row.category_id] = {
//               category_id: row.category_id,
//               name: row.category_name,   // Use category_name
//               products: [],
//             };
//           }

//           // Add product if present
//           if (row.product_id) {
//             categoriesMap[row.category_id].products.push({
//               product_id: row.product_id,
//               name: row.product_name,    // Use product_name
//               current_stock: row.current_stock,
//             });
//           }
//         });

//         // Convert the map object to an array of categories
//         const categories = Object.values(categoriesMap);
//         res.status(200).json(categories);
//       }
//     });
//   });

//   // Add a new category
// app.post("/api/categories/add", (req, res) => {
//     const { name } = req.body;

//     if (!name) {
//       return res.status(400).json({ error: "Category name is required" });
//     }

//     const query = "INSERT INTO categories (name) VALUES (?)";
//     db.query(query, [name], (err, result) => {
//       if (err) {
//         console.error("Error adding category:", err);
//         res.status(500).json({ error: "Failed to add category" });
//       } else {
//         res.status(201).json({ message: "Category added successfully" });
//       }
//     });
//   });

//   app.delete("/api/categories/:categoryId", (req, res) => {
//     const { categoryId } = req.params;
//     const query = "DELETE FROM categories WHERE category_id = ?";
//     db.query(query, [categoryId], (err, results) => {
//       if (err) {
//         console.error("Error deleting category:", err);
//         res.status(500).json({ error: "Failed to delete category" });
//       } else {
//         res.status(200).json({ message: "Category deleted successfully" });
//       }
//     });
//   });

//   app.get("/api/scanned_products", (req, res) => {
//     const query = `
//       SELECT
//         scanned_products.*,
//         products.name AS product_name
//       FROM scanned_products
//       JOIN products ON scanned_products.barcode = products.barcode
//     `;

//     db.query(query, (err, results) => {
//       if (err) {
//         console.error("Error fetching products:", err);
//         res.status(500).json({ error: "Failed to fetch products" });
//       } else {
//         res.json(results); // Send the results including the product name
//       }
//     });
//   });

//   app.get("/api/products/:barcode", (req, res) => {
//     const { barcode } = req.params;
//     db.query("SELECT name, expiry_date FROM products WHERE barcode = ?", [barcode], (err, results) => {
//       if (err) {
//         console.error(err);
//         return res.status(500).json({ error: "Database query failed." });
//       }
//       if (results.length === 0) {
//         return res.status(404).json({ error: "Product not found." });
//       }
//       res.json(results[0]);
//     });
//   });

//   // Search products by name
// app.get("/api/products", (req, res) => {
//   const { name } = req.query;

//   if (!name) {
//     return res.status(400).json({ error: "Product name is required." });
//   }

//   const query = "SELECT * FROM products WHERE name LIKE ?";
//   db.query(query, [`%${name}%`], (err, results) => {
//     if (err) {
//       console.error("Error searching product by name:", err);
//       res.status(500).json({ error: "Error searching product by name." });
//     } else if (results.length === 0) {
//       res.status(404).json({ error: "No products found with the given name." });
//     } else {
//       res.json(results);
//     }
//   });
// });

//   app.put("/api/scanned_products/:id", (req, res) => {
//     const { id } = req.params;
//     const { quantity, barcode } = req.body;

//     const query = "UPDATE scanned_products SET quantity = ? WHERE id = ?";
//     db.query(query, [quantity, id], (err, result) => {
//       if (err) {
//         console.error("Error updating scanned product:", err);
//         return res.status(500).json({ error: "Failed to update the scanned product" });
//       }

//       if (result.affectedRows === 0) {
//         return res.status(404).json({ error: "Scanned product not found" });
//       }
//       updateCurrentStock(barcode);
//       res.json({ message: "Product updated successfully" });
//     });
//   });

//   app.delete("/api/scanned_products/:id", (req, res) => {
//     const { id } = req.params;
//     const { barcode } = req.query;

//     const query = "DELETE FROM scanned_products WHERE id = ?";
//     db.query(query, [id], (err, result) => {
//       if (err) {
//         console.error("Error deleting scanned product:", err);
//         return res.status(500).json({ error: "Failed to delete the scanned product" });
//       }

//       if (result.affectedRows === 0) {
//         return res.status(404).json({ error: "Scanned product not found" });
//       }
//       updateCurrentStock(barcode);

//       res.json({ message: "Product deleted successfully" });
//     });
//   });

//   // Function to add a new scanned product (new scan)
// app.post("/api/scanned_products", (req, res) => {
//     const { barcode, quantity, scanned_at } = req.body; // Get product details from the request body

//     // SQL query to insert the new scanned product into the database
//     const query = "INSERT INTO scanned_products (barcode, quantity, scanned_at) VALUES (?, ?, ?)";

//     db.query(query, [barcode, quantity, scanned_at], (err, result) => {
//       if (err) {
//         console.error("Error adding product:", err);
//         return res.status(500).json({ message: "Failed to add product." });
//       }
//       updateCurrentStock(barcode);

//       // Successfully added
//       return res.status(201).json({ message: "Product added successfully.", productId: result.insertId });
//     });
//   });

//   app.get("/api/products_name", (req, res) => {
//     const { name } = req.query;
//     const query = "SELECT * FROM products WHERE name LIKE ?";
//     db.query(query, [`%${name}%`], (err, results) => {
//         if (err) {
//             console.error("Error fetching products by name:", err);
//             return res.status(500).send("Server error");
//         }
//         if (results.length > 0) {
//             res.json(results); // Send all matching products
//         } else {
//             res.status(404).send("No products found.");
//         }
//     });
// });

//   app.get("/api/suppliers", (req, res) => {
//     db.query("SELECT * FROM suppliers", (err, results) => {
//       if (err) {
//         console.error(err);
//         return res.status(500).send("Error fetching suppliers");
//       }
//       res.json(results);
//     });
//   });

//   app.post("/api/suppliers", (req, res) => {
//     const { name, contact, address } = req.body;
//     db.query("INSERT INTO suppliers (name, contact_details, address) VALUES (?, ?, ?)", [name, contact, address], (err, result) => {
//       if (err) {
//         console.error(err);
//         return res.status(500).send("Error adding supplier");
//       }
//       res.json({ message: "Supplier added successfully" });
//     });
//   });

//   app.put("/api/suppliers/:id", (req, res) => {
//     const { id } = req.params;
//     const { name, contact, address } = req.body;
//     db.query(
//       "UPDATE suppliers SET name = ?, contact_details = ?, address = ? WHERE supplier_id = ?",
//       [name, contact, address, id],
//       (err, result) => {
//         if (err) {
//           console.error(err);
//           return res.status(500).send("Error updating supplier");
//         }
//         res.json({ message: "Supplier updated successfully" });
//       }
//     );
//   });

//   app.delete("/api/suppliers/:id", (req, res) => {
//     const { id } = req.params;
//     db.query("DELETE FROM suppliers WHERE supplier_id = ?", [id], (err, result) => {
//       if (err) {
//         console.error(err);
//         return res.status(500).send("Error deleting supplier");
//       }
//       res.json({ message: "Supplier deleted successfully" });
//     });
//   });

// // Server Listening
// app.listen(8081, () => {
//   console.log("Server is listening on port 8081");
// });
