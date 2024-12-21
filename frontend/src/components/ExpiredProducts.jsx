import React, { useEffect, useState } from "react";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import API from "../services/api";

import { BsStopwatch } from "react-icons/bs";

function ExpiredProducts() {
    const [expiredProducts, setExpiredProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchExpiredProducts = async () => {
            try {
                const response = await API.get("/products");
                const allProducts = response.data;

                // Filter only expired products
                const today = new Date();
                const expired = allProducts.filter((product) => {
                    const expiryDate = new Date(product.expiry_date);
                    return expiryDate < today; // Products with expiry date in the past
                });

                setExpiredProducts(expired);
            } catch (error) {
                console.error("Error fetching expired products:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchExpiredProducts();
    }, []);

    if (isLoading) {
        return <p>Loading...</p>;
    }

    return (
        <div dir="rtl" className="container-fluid">
            <div className="d-flex">
                {/* Sidebar */}
                <div className="col-2">
                    <Sidebar />
                </div>

                {/* Main Content */}
                <div
                    dir="rtl"
                    className="col overflow-y-scroll d-flex flex-column mx-2"
                >
                    {/* Topbar */}
                    <Topbar />

                    {/* Page Content */}
                    <div className="px-4">
                        <div className="d-flex align-items-center my-3">
                            <BsStopwatch
                                style={{
                                    color: "#fff",
                                    padding: "3px 6px",
                                    fontSize: "45px",
                                    backgroundColor: "#0d6efd",
                                    borderRadius: "8px",
                                }}
                            />
                            <h2>المنتجات منتهية الصلاحية</h2>
                        </div>


                        {expiredProducts.length > 0 ? (
                             <div
                             className="table-responsive"
                             style={{
                               maxHeight: "60vh",
                               overflowY: "auto",
                             }}
                           >
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th scope="col">ر,ع</th>
                                        <th scope="col">الباركود</th>
                                        <th scope="col">الاسم</th>
                                        <th scope="col">رقم الفئة</th>
                                        <th scope="col">ر, الفاتورة</th>
                                        <th scope="col">الكمية الصادرة</th>
                                        <th scope="col">المخزون الحالي</th>
                                        <th scope="col">تاريخ انتهاء الصلاحية</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expiredProducts.map((product, index) => (
                                        <tr key={product.product_id}>
                                            <th scope="row">{index + 1}</th>
                                            <td>{product.barcode}</td>
                                            <td>{product.name}</td>
                                            <td>{product.category_id}</td>
                                            <td>{product.unit_price}</td>
                                            <td>{product.quantity_in_stock}</td>
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
                            </div>
                        ) : (
                            <p>لا توجد منتجات منتهية الصلاحية</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExpiredProducts;
