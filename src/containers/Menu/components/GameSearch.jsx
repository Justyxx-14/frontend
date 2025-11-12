import { Search, X } from "lucide-react";

const GameSearch = ({ searchTerm, onSearchChange, onClearSearch }) => {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search game..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-64 p-2 pl-10 pr-8
         border border-red-500 rounded-md bg-black text-red-100 placeholder-red-400
         focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-40 font-mono text-sm"
      />
      
      {/* Search Icon */}
      <Search 
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-400" 
        size={16}
      />
      
      {/* Button to clear search */}
      {searchTerm && (
        <button
          onClick={onClearSearch}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-400 hover:text-red-200 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default GameSearch;