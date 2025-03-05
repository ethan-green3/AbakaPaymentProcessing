import React, { useState } from "react";

const PaymentForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    cardNumber: "",
    expirationMonth: "",
    expirationYear: "",
    cvv: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Submitted", formData);
    // Call your API here to process payment
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}></h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.sectionTitle}>Payment Details</h2>

        <div style={styles.inputGroup}>
          <label>First Name:</label>
          <input type="text" name="firstName" onChange={handleChange} required />
        </div>

        <div style={styles.inputGroup}>
          <label>Last Name:</label>
          <input type="text" name="lastName" onChange={handleChange} required />
        </div>

        <div style={styles.inputGroup}>
          <label>Email:</label>
          <input type="email" name="email" onChange={handleChange} required />
        </div>

        <div style={styles.inputGroup}>
          <label>Phone:</label>
          <input type="tel" name="phone" onChange={handleChange} required />
        </div>

        <div style={styles.inputGroup}>
          <label>Address:</label>
          <input type="text" name="address" onChange={handleChange} required />
        </div>

        <div style={styles.row}>
          <div style={styles.inputGroup}>
            <label>City:</label>
            <input type="text" name="city" onChange={handleChange} required />
          </div>

          <div style={styles.inputGroup}>
            <label>State:</label>
            <input type="text" name="state" onChange={handleChange} required />
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label>ZIP Code:</label>
          <input type="text" name="zip" onChange={handleChange} required />
        </div>

        <h2 style={styles.sectionTitle}>Card Details</h2>

        <div style={styles.inputGroup}>
          <label>Card Number:</label>
          <input type="text" name="cardNumber" onChange={handleChange} required />
        </div>

        <div style={styles.row}>
          <div style={styles.inputGroup}>
            <label>Expiration Month:</label>
            <input type="text" name="expirationMonth" onChange={handleChange} required />
          </div>

          <div style={styles.inputGroup}>
            <label>Expiration Year:</label>
            <input type="text" name="expirationYear" onChange={handleChange} required />
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label>CVV:</label>
          <input type="text" name="cvv" onChange={handleChange} required />
        </div>

        <button type="submit" style={styles.button}>Pay Now</button>
      </form>
    </div>
  );
};

// Inline styles for better styling control
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#000",
    color: "#fff",
    minHeight: "100vh",
    padding: "40px",
  },
  title: {
    color: "#ff0000",
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "20px",
  },
  form: {
    backgroundColor: "#fff",
    color: "#000",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0px 0px 10px rgba(255, 0, 0, 0.5)",
    width: "90%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "10px",
    textAlign: "center",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "12px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
  },
  button: {
    backgroundColor: "#ff0000",
    color: "#fff",
    fontSize: "18px",
    fontWeight: "bold",
    padding: "10px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginTop: "10px",
  },
};

export default PaymentForm;
