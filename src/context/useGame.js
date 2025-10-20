import { useContext } from "react";
import { GameContext } from "./gameContext";

export const useGame = () => useContext(GameContext);
