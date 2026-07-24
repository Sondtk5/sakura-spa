import { useState } from "react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Customers, CustomerDetail } from "./pages/Customers";
import { Services } from "./pages/Services";
import { Products } from "./pages/Products";
import { Invoices } from "./pages/Invoices";
import { Inventory } from "./pages/Inventory";
import { Reports } from "./pages/Reports";
import { Labels } from "./pages/Labels";
import { Settings } from "./pages/Settings";

export function App() {
  const [page, setPage] = useState("/");
  const [customerId, setCustomerId] = useState<string | null>(null);

  const handleNavigate = (path: string) => {
    if (path.startsWith("/customer/")) {
      const id = path.replace("/customer/", "");
      setCustomerId(id);
      setPage("/customer");
    } else {
      setPage(path);
      setCustomerId(null);
    }
  };

  const renderPage = () => {
    switch (page) {
      case "/":
        return <Dashboard onNavigate={handleNavigate} />;
      case "/customers":
        return <Customers onNavigate={handleNavigate} />;
      case "/customer":
        return customerId ? <CustomerDetail customerId={customerId} onNavigate={handleNavigate} /> : <Customers onNavigate={handleNavigate} />;
      case "/services":
        return <Services onNavigate={handleNavigate} />;
      case "/products":
        return <Products onNavigate={handleNavigate} />;
      case "/invoices":
        return <Invoices onNavigate={handleNavigate} />;
      case "/inventory":
        return <Inventory onNavigate={handleNavigate} />;
      case "/reports":
        return <Reports />;
      case "/labels":
        return <Labels />;
      case "/settings":
        return <Settings />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <Layout currentPage={page} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  );
}