import './globals.css'

export const metadata = {
  title: 'QiBo ROI Calculator',
  description: 'Calculate your ROI with QiBo intelligent documentation',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
