import { useState } from "react";

const FormCreateGame = ({ createGame }) => {
  const [formData, setFormData] = useState({
    name: "",
    min: "",
    max: "",
  });

  const [validSubmit, setValidSubmit] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const newForm = { ...prev, [name]: value };

      // Form not empty validation
      if (newForm.min !== "" && newForm.max !== "") {
        setValidSubmit(Number(newForm.min) <= Number(newForm.max));
      }

      return newForm;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Normalize data
    const payload = {
      ...formData,
      min: formData.min === "" ? null : Number(formData.min),
      max: formData.max === "" ? null : Number(formData.max),
    };

    createGame(payload);
  };

  return (
    <div className="flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-100 space-y-4 p-6 rounded-2xl bg-[#2b0a0a] shadow-[0_0_15px_rgba(139,0,0,0.7)] border border-red-900"
      >
        <h2 className="text-xl font-serif text-red-300 tracking-wide">
          Create game
        </h2>

        <label className="text-red-200">Game name</label>
        <input
          type="text"
          onChange={handleChange}
          name="name"
          value={formData.name}
          placeholder="Game name"
          minLength={5}
          className="w-full p-2 border border-red-700 rounded-md bg-black text-red-100 placeholder-red-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-opacity-70 font-mono"
          required
        />

        <label htmlFor="min" className="text-red-200">Minimum players</label>
        <input
          id="min"
          type="number"
          onChange={handleChange}
          name="min"
          min={2}
          max={6}
          placeholder="2..6"
          value={formData.min}
          className="w-full p-2 border border-red-700 rounded-md bg-black text-red-100 placeholder-red-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-opacity-70 font-mono"
          required
        />

        <label htmlFor="max" className="text-red-200">Maximum players</label>
        <input
          id="max"
          type="number"
          onChange={handleChange}
          name="max"
          min={2}
          max={6}
          placeholder="2..6"
          value={formData.max}
          className="w-full p-2 border border-red-700 rounded-md bg-black text-red-100 placeholder-red-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-opacity-70 font-mono"
          required
        />

        {!validSubmit && (
          <p className="text-red-600 text-sm font-serif italic">
            The minimum cannot be greater than the maximum
          </p>
        )}

        <button
          type="submit"
          disabled={!validSubmit}
          className="w-full bg-red-800 text-red-100 py-2 rounded-md hover:bg-red-900 transition-all shadow-[0_0_10px_rgba(255,0,0,0.5)] font-semibold"
        >
          Create game
        </button>
      </form>
    </div>
  );
};

export default FormCreateGame;
