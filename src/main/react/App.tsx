import { Admin } from "./admin/Admin"
import { Reservation } from "./reservation/Reservation"
import { BrowserRouter, Navigate, Route, Routes } from "react-router"

export const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Reservation />} />
      <Route path="/admin-console" element={<Admin />} />
      {/* любой неизвестный путь перенаправляем на главную */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
)
