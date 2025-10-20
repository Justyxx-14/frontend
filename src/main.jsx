import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { GameProvider } from "./context/GameProvider.jsx";

import "./index.css";

import Menu from "./containers/Menu/Menu.jsx";
import Lobby from "./containers/Lobby/Lobby.jsx";
import NotFound from "./pages/NotFound.jsx";
import InGame from "./containers/InGame/InGame.jsx";
import { Toaster } from "react-hot-toast";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <GameProvider>
        <Routes>
          <Route path="/" element={<Menu />} />
          <Route path="/lobby/:gameId" element={<Lobby />} />
          <Route path="/game/:gameId/" element={<InGame />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </GameProvider>
    </BrowserRouter>
    <Toaster position="top-center" reverseOrder={false} />
  </StrictMode>
);
