const Table = ({ eventDoubleClick, games }) => {
  return (
    <div className="relative w-full h-64">
      {/* contenedor de la tabla con altura fija */}
      <table className="table-fixed w-full border-collapse border-red-900 h-13">
        <thead>
          <tr>
            <th className="font-serif text-xl text-red-200 tracking-wide text-center px-2 py-1 w-1/2 border-b border-red-900 bg-[#2b0a0a]">
              Game's Names
            </th>
            <th className="font-serif text-xl text-red-200 tracking-wide text-center px-2 py-1 w-1/2 border-b border-red-900 bg-[#2b0a0a]">
              Players
            </th>
          </tr>
        </thead>
        <tbody className="h-full opacity-60">
          {games &&
            games.map((game, i) => (
              <tr
                key={i}
                className="text-center cursor-pointer hover:bg-red-200 transition group"
                onDoubleClick={() => eventDoubleClick(game)}
              >
                <td className="text-red-200 group-hover:text-red-950 overflow-hidden text-ellipsis whitespace-nowrap px-2 py-1 text-center">
                  {game.name}
                </td>
                <td className="px-2 py-1">
                  {game.countPlayers < game.min_players ? (
                    <>
                      <span className="text-red-500 font-bold">
                        {game.countPlayers}
                      </span>
                      <span className="text-red-200 font-bold group-hover:text-red-950">
                        /{game.max_players}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-green-500 font-bold">
                        {game.countPlayers}
                      </span>
                      <span className="text-red-200 font-bold group-hover:text-red-950">
                        /{game.max_players}
                      </span>
                    </>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      {games.length === 0 && (
        <div className="absolute inset-0 flex justify-center items-center">
          <div
            role="status"
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-200"
          ></div>
        </div>
      )}
    </div>
  );
};

export default Table;
