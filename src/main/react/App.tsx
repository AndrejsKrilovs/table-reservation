import { Admin } from "./admin/Admin"
import { Reservation } from "./reservation/Reservation"
import { Menu } from "./menu/Menu"
import { BrowserRouter, Navigate, Route, Routes } from "react-router"

const Header = () => {
  return (
    <header className="club-header">
      <a className="club-logo">
        ONE MORE CLUB
      </a>
    </header>
  )
}
const Home = () => (
  <>
    <Header />
    <Reservation />
    <Menu />
  </>
)

export const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin-console" element={<Admin />} />
      {/* любой неизвестный путь перенаправляем на главную */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
)
