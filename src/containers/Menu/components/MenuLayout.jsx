import { useState } from "react";
import FormCreateUser from "./FormCreateUser";
import FormCreateGame from "./FormCreateGame";
import Table from "./Table";
import GameSearch from "./GameSearch";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";

const MenuLayout = ({ games, formRef, joinGame, createGame, validateForm, onShowHelp }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter games based on the search term
  const filteredGames = games?.filter(game => 
    game.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="h-screen bg-[url('/menu_bg.webp')] dark:bg-gray-900 p-12 py-11">
      {/* --- NUEVO: Botón de Ayuda --- */}
      <motion.button
        onClick={onShowHelp}
        className="fixed bottom-4 left-4 z-50 p-3 bg-neutral-800 bg-opacity-70 rounded-full text-gray-300 hover:text-white hover:bg-neutral-700 shadow-lg transition-all"
        aria-label="Cómo Jugar"
        title="Cómo Jugar"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        whileHover={{ scale: 1.1 }}
      >
        <HelpCircle className="w-7 h-7" />
      </motion.button>
    
      <div className="flex flex-col md:flex-row gap-10 h-full">
        <div className="flex flex-col gap-6 w-full md:w-1/4 justify-center">
          <FormCreateUser formRef={formRef} />
          <FormCreateGame createGame={createGame} />
        </div>

        <div className="flex-1 p-6 rounded-xl flex flex-col bg-[#2b0a0a] shadow-[0_0_15px_rgba(139,0,0,0.7)] border border-red-900">
          <div className="flex-1 border border-red-900 rounded overflow-hidden flex flex-col">
            {/* Header with centered title and search bar on the right */}
            <div className="flex justify-between items-center p-2 border-b border-red-900 bg-[#2b0a0a] relative">
              {/* Title GAMES centered */}
              <h1 className="text-3xl font-serif text-red-300 tracking-wide absolute left-1/2 transform -translate-x-1/2">
                GAMES
              </h1>
              
              {/* Search bar aligned to the right */}
              <div className="ml-auto">
                <GameSearch 
                  searchTerm={searchTerm}
                  onSearchChange={handleSearchChange}
                  onClearSearch={handleClearSearch}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#471d1d] opacity-80">
              <Table 
                eventDoubleClick={joinGame} 
                games={filteredGames} 
                validateForm={validateForm} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MenuLayout;