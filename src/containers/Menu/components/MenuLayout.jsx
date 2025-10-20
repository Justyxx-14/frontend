import FormCreateUser from "./FormCreateUser";
import FormCreateGame from "./FormCreateGame";
import Table from "./Table";

const MenuLayout = ({ games, formRef, joinGame, createGame }) => {
  return (
<div className="h-screen bg-[url('/menu_bg.webp')] dark:bg-gray-900 p-12 py-11">
  <div className="flex flex-col md:flex-row gap-10 h-full">
    <div className="flex flex-col gap-6 w-full md:w-1/4 justify-center">
      <FormCreateUser formRef={formRef} />
      <FormCreateGame createGame={createGame} />
    </div>

    <div className="flex-1 p-6 rounded-xl flex flex-col bg-[#2b0a0a] shadow-[0_0_15px_rgba(139,0,0,0.7)] border border-red-900">
      <div className="flex-1 border border-red-900 rounded overflow-hidden flex flex-col">
        <h1 className="text-center text-3xl p-2 font-serif text-red-300 tracking-wide border-b border-red-900">
          GAMES
        </h1>
        <div className="flex-1 overflow-y-auto bg-[#471d1d] opacity-80">
          <Table eventDoubleClick={joinGame} games={games} />
        </div>
      </div>
    </div>
  </div>
</div>

  );
};
export default MenuLayout;