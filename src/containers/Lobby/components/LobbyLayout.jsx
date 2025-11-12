import { data } from "react-router-dom";

const LobbyLayout = ({ currentGame, dataPlayers, idPlayer, startGame, leaveGame }) => {
  return (
    <>
      <div
        className="
			    h-screen w-screen 
          bg-[#3b0a0a]
          bg-no-repeat bg-center bg-cover
          bg-[url('/lobby_bg.webp')]
			"
      >
        <div
          className="absolute inset-0 bg-no-repeat bg-center bg-contain"
          style={{ 
            backgroundImage: "url('/lobby_bg2.webp')",
            backgroundPosition: "center 80%"
          }}
        ></div>
        <h1 className="absolute top-[5%] left-1/2 -translate-x-1/2 z-20 cursor-default
                      text-center font-s tracking-wide
                      text-5xl text-red-200/70
                      px-4 py-3 rounded-md
                      bg-[#180707] 
                      shadow-[0_0_15px_rgba(139,0,0,0.7)]"
                      style={{ 
                        textShadow: "0 0 10px rgba(255,192,203,0.75)",
                       }}>
          Lobby: {currentGame?.name}
        </h1>
        <button
          type="button"
          onClick={leaveGame} 
          className="
            absolute bottom-25 right-23 z-20
            px-15 py-4
            rounded-lg
            border border-red-900
            bg-gradient-to-b from-[#3b0a0a] to-[#1a0000]
            text-red-200 font-creepster tracking-wider
            [text-shadow:0_0_10px_rgba(255,180,200,0.7)]
            shadow-[0_0_15px_rgba(139,0,0,0.7)]
            transition-all duration-300
            hover:brightness-140
            hover:shadow-[0_0_25px_rgba(220,38,38,0.9)]
          "
        >
          Leave Game
        </button>
        <div
          className="absolute top-[5%] inset-0 flex items-center justify-center"
        >
          <div className="flex flex-col items-center space-y-3 w-[300px]">
            {Object.entries(dataPlayers).map(([id, name], index) => (
              <div 
                key={`player-${index}`}
                className="w-full px-4 py-2 cursor-default
                          font-s tracking-wide
                          text-red-200/70 text-center text-xl
                          border-b border-red-900/70
                          transition-all duration-300
                          hover:text-red-100 hover:tracking-wider 
                          hover:bg-red-900/30 hover:shadow-[0_0_25px_rgba(220,38,38,0.7)]"
                style={{ textShadow: "0 0 10px rgba(255,180,200,0.6)" }}
              >
                {name}
              </div>
            ))}
          </div>
        </div>

        {currentGame.host_id === idPlayer && (
          <button
            type="button"
            disabled={Object.values(dataPlayers).length < currentGame.min_players}
            onClick={() => startGame()}
            className="
              absolute top-[85%] left-1/2 -translate-x-1/2 -translate-y-1/2
              w-[240px] h-[70px]
              flex items-center justify-center
              rounded-lg overflow-hidden
              border border-red-900
              bg-gradient-to-b from-[#3b0a0a] to-[#1a0000]
              shadow-[0_0_25px_rgba(139,0,0,0.7)]
              transition-all duration-300
              hover:brightness-140
              hover:scale-101 hover:shadow-[0_0_50px_5px_rgba(220,38,38,0.9)]
              disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none
            "
          >
            <span
              className="
                relative z-10
                text-[2rem] text-red-200 font-creepster tracking-widest
                [text-shadow:0_0_15px_rgba(255,180,200,0.9)]
              "
            >
              Start Game
            </span>

            <div
              className="absolute inset-0 from-red-900/30 to-transparent opacity-60 blur-xl"
            ></div>
          </button>
        )}
      </div>
    </>
  );
};
export default LobbyLayout;
