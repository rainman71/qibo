// app/layout.js
import "./globals.css";
import ProductTour from "../components/ProductTour";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ProductTour />
      </body>
    </html>
  );
}
