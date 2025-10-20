import { useState, useEffect } from "react";
import { useGame } from "@context/useGame";

const FormCreateUser = ({ formRef }) => {
  const { setUser } = useGame();
  const [formData, setFormData] = useState({ name: "", birthday: "" });

  const today = new Date();
  const maxDate = today.toISOString().split("T")[0];
  const minDate = new Date(today);
  minDate.setFullYear(today.getFullYear() - 100);
  const minDateStr = minDate.toISOString().split("T")[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);
    setUser(updatedData);
  };

  // optional: "start" the context
  useEffect(() => {
    setUser(formData);
  }, []);

  return (
    <div className="flex justify-center" ref={formRef}>
      <form className="bg-[#2b0a0a] p-6 rounded-2xl shadow-[0_0_15px_rgba(139,0,0,0.7)] w-100 space-y-4 border border-red-900">
        <h2 className="text-xl font-serif text-red-300 tracking-wide">
          User register
        </h2>

        <label htmlFor="name" className="text-red-200">Name:</label>
        <input
          id="name"
          type="text"
          onChange={handleChange}
          name="name"
          value={formData.name}
          minLength={3}
          placeholder="Username"
          className="w-full p-2 border border-red-700 rounded-md bg-black text-red-100 placeholder-red-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-opacity-70 font-mono"
          required
        />

        <label htmlFor="birthday" className="text-red-200">Birthdate:</label>
        <input
          id="birthday"
          type="date"
          onChange={handleChange}
          name="birthday"
          value={formData.birthday}
          className="w-full p-2 border border-red-700 rounded-md bg-black text-red-100 placeholder-red-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-opacity-70 font-mono"
          min={minDateStr}
          max={maxDate}
          required
        />
      </form>
    </div>
  );
};

export default FormCreateUser;
