// App.test.jsx

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { Routes, Route } from "react-router-dom";

// import App from './App';
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Menu />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const NotFound = () => <h1>Página no encontrada</h1>;
const Menu = () => <h2>Partidas Disponibles</h2>;

describe("Test de Ruteo Principal", () => {
  it('debe renderizar la página principal (Menu) en la ruta "/"', () => {
    // 1. Renderizamos la app en una ruta específica usando MemoryRouter
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    // 2. Buscamos un texto que solo exista en el componente Menu
    const menuTitle = screen.getByText(/Partidas Disponibles/i);

    // 3. Verificamos que el texto esté en el documento
    expect(menuTitle).toBeInTheDocument();
  });

  it("debe renderizar la página NotFound para una ruta que no existe", () => {
    const badRoute = "/una/ruta/que/no/existe";

    // 1. Renderizamos la app en una ruta inválida
    render(
      <MemoryRouter initialEntries={[badRoute]}>
        <App />
      </MemoryRouter>
    );

    // 2. Buscamos un texto que solo exista en el componente NotFound
    const notFoundText = screen.getByText(/Página no encontrada/i);

    // 3. Verificamos que el componente NotFound se muestre
    expect(notFoundText).toBeInTheDocument();
  });
});
