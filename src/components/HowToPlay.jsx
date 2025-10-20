import { useState } from "react";
import { X, HelpCircle } from "lucide-react";

const HowToPlay = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      {/* flex button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition"
      >
        <HelpCircle className="w-5 h-5" />
        ¿Cómo jugar?
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative bg-white w-11/12 md:w-2/3 lg:w-1/2 p-6 rounded-xl shadow-lg z-10">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-xl font-bold mb-4">Cómo jugar</h2>
            <p className="text-gray-700 mb-2">
              Aquí puedes poner las instrucciones de tu juego:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Regla 1: Explicación breve.</li>
              <li>Regla 2: Explicación breve.</li>
              <li>Regla 3: Explicación breve.</li>
              <li>Etc...</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default HowToPlay;
