import React from "react";
import PaymentForm from "./PaymentForm.js"; // Import the PaymentForm component

const App = () => {
  return (
    <div style={styles.appContainer}>
      <h1 style={styles.header}>Payment Page</h1>
      <PaymentForm />
    </div>
  );
};

const styles = {
  appContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#000", // Matches Lockout Supplements theme
    color: "#fff",
    padding: "20px",
  },
  header: {
    marginBottom: "20px",
    color: "#ff0000", // Red accent color
  },
};

export default App;
