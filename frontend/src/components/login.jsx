import React, { useState } from "react";
import {
  Form,
  Button,
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Alert,
} from "react-bootstrap";
import API from "../services/api"; // تأكد من أن ملف API يرسل الطلبات بشكل صحيح
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { login, logout } from "../store/authSlice";
const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const username = e.target.formUsername.value.trim();
    const password = e.target.formPassword.value.trim();

    console.log("Sending username:", username);
    console.log("Sending password:", password);

    try {
      const response = await API.post("/login", { username, password });
      dispatch(login(response.data?.token));
      alert("تم تسجيل الدخول بنجاح");
      setTimeout(() => {
        navigate("/home");
      }, 1000);
    } catch (error) {
      if (error.response?.status === 401) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة");
      } else {
        setError(error.response?.data?.error || "حدث خطأ أثناء تسجيل الدخول");
        console.log(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <Row>
        <Col>
          <Card style={{ width: "24rem", padding: "20px" }}>
            <Card.Body>
              <h3 className="text-center mb-4">تسجيل الدخول</h3>
              {error && <Alert variant="danger">{error}</Alert>}{" "}
              {/* عرض رسالة الخطأ */}
              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3" controlId="formUsername">
                  <Form.Label>اسم المستخدم</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="أدخل اسم المستخدم"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formPassword">
                  <Form.Label>كلمة المرور</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="أدخل كلمة المرور"
                    required
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    "تسجيل الدخول"
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
