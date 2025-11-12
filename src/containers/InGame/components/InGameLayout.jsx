import { Trash2, Search, HelpCircle, Radius } from "lucide-react";
import { motion } from "framer-motion";
import { CirclePlus } from "lucide-react";
import CardZoomModal from "./CardZoomModal";
import PlayerLayout from "./PlayerLayout";
import SecretButton from "./SecretButton";
import SetsButton from "./SetsButton";
import RadiusFill from "./RadiusFill";

const cardtam = "sm:w-20 md:w-25 lg:w-33";
const cardh = "sm:h-30 md:h-40 lg:h-48 ";

const avatartam = "lg:w-20 lg:h-20 md:w-15 md:h-15 sm:w-12 sm:h-12";
const buttontam =
  "lg:h-12 md:h-9 sm:h-8 lg:w-36 md:w-22 sm:w-25 lg:text-lg md:text-md sm:text-sm";

const InGameLayout = ({
  currentPlayer,
  otherPlayers,
  handleNextTurnRequest,
  onConfirmNextTurn,
  onCancelNextTurn,
  showConfirmModal,
  isCurrentTurn,
  hideTurnWarning,
  onHideWarningChange,
  inventoryCards,
  selectedCardIds,
  handleDiscard,
  isDiscardButtonEnabled,
  handleCardClick,
  inventoryDraftCards,
  handleDrawDraftCard,
  handleDrawRegularCard,
  lastCardDiscarded,
  isModalOpen,
  closeModal,
  modalCards,
  modalType,
  modalTitle,
  viewingOwnSecrets,
  onShowSecrets,
  onShowSets,
  openModal,
  currentTurnID,
  handlePlayCard,
  onShowHelp,
  canNoSoFast,
  nsfResetKey
}) => {
  return (
    <div
      className="
      relative w-full h-screen
      text-red-100
      bg-black bg-[url('/game_bg.webp')] bg-cover bg-no-repeat
      overflow-hidden"
      style={{
        textShadow: "0 3px 10px rgba(255,192,203,0.75)",
        fontFamily: "MedievalSharp"
      }}
    >
      {/* --- How to play --- */}
      <motion.button
        onClick={onShowHelp}
        className="fixed bottom-4 left-4 z-50 p-3 bg-neutral-800 bg-opacity-70 rounded-full text-gray-300 hover:text-white hover:bg-neutral-700 shadow-lg transition-all"
        aria-label="How to Play"
        title="How to Play"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        whileHover={{ scale: 1.1 }}
      >
        <HelpCircle className="w-7 h-7" />
      </motion.button>

      {/* Other players */}
      <motion.div
        className="absolute top-1/20 left-1/2 -translate-x-1/2"
        initial={{ opacity: 1, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {otherPlayers.map(([id, player], i) => (
          <PlayerLayout
            key={`player-${i}`}
            playerId={id}
            isCurrentTurn={id === currentTurnID}
            player={player}
            onSecretButtonClick={() => onShowSecrets(id)}
            onSetsButtonClick={() => onShowSets(id)}
            i={i}
            totalPlayers={otherPlayers.length}
          />
        ))}
      </motion.div>

      {/* Decks */}
      <motion.div
        className="
          absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%]
          flex flex-wrap items-center justify-center
          gap-x-10 gap-y-0 max-w-[95vw]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
      >
        {/* Regular Deck */}
        <div
          className="
            flex flex-col items-center space-y-2
            order-1 md:order-1 mt-4"
        >
          <motion.div
            onClick={isCurrentTurn ? () => handleDrawRegularCard(1) : undefined}
            className={`${cardtam} rounded-lg shadow-xl transition-all duration-200
            ${
              !isCurrentTurn
                ? "cursor-not-allowed"
                : "scale: 1.05, boxShadow: '0 0 15px 3px rgba(252, 211, 77, 0.8)'"
            }
            `}
            whileHover={
              isCurrentTurn
                ? {
                    scale: 1.05,
                    boxShadow: "0 0 15px 3px rgba(252, 211, 77, 0.8)"
                  }
                : {}
            }
          >
            <motion.img
              className="rounded-lg shadow-lg"
              src="/cards/C_BACK.webp"
              alt="back of a card"
              draggable={false}
            />
          </motion.div>
          <span className="text-sm text-gray-300 flex justify-center">
            Regular deck
          </span>
        </div>

        {/* Discard */}
        <div
          className="
          flex flex-col items-center space-y-2
          order-2 md:order-3 mt-4
          "
        >
          <div className="space-y-2">
            {lastCardDiscarded ? (
              <motion.img
                key={lastCardDiscarded.id}
                src={`/cards/${lastCardDiscarded.name}.webp`}
                alt={lastCardDiscarded.name}
                className={`${cardtam} rounded-lg shadow-xl transition-all duration-200`}
                whileHover={isCurrentTurn ? { scale: 1.05 } : {}}
                draggable={false}
              />
            ) : (
              <div
                className={`
                ${cardtam} ${cardh} rounded-lg 
                border-2 border-gray-500 bg-gray-800
                opacity-40
              `}
              />
            )}
            <span className="text-sm text-gray-300 flex justify-center">
              Discard deck
            </span>
          </div>
        </div>

        {/* Draft */}
        <div
          className="
            space-y-2
            order-3 md:order-2 mt-4"
        >
          <div className="flex items-center justify-center space-x-3 flex-wrap max-w-[min(95vw,480px)]">
            {inventoryDraftCards.map((card, i) => (
              <motion.img
                key={card.id || i}
                onClick={() => {
                  if (isCurrentTurn) handleDrawDraftCard(card.id);
                }}
                src={`/cards/${card.name}.webp`}
                alt={card.name}
                className={`${cardtam} rounded-lg shadow-xl transition-all duration-200 ${
                  isCurrentTurn
                    ? "cursor-pointer hover:scale-105"
                    : "cursor-not-allowed"
                }`}
                whileHover={isCurrentTurn ? { scale: 1.05 } : {}}
                draggable={false}
              />
            ))}
          </div>
          <span className="text-sm text-gray-300 flex justify-center">
            Draft
          </span>
        </div>
      </motion.div>

      {/* Player */}
      <motion.div
        className="absolute bottom-7 left-1/2 -translate-x-1/2 flex items-end justify-center lg:space-x-3 md:space-x-3 sm:space-x-1"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.5 }}
      >
        {/* Avatar and zoom */}
        <div className="flex flex-col items-center my-5">
          {/* Avatar */}
          <div className="flex flex-col items-center lg:space-x-2 md:space-x-1 sm:space-x-1">
            <div
              className={`
              ${avatartam} rounded-full border-2 border-gray-500 
              ${isCurrentTurn ? "shadow-[0_0_25px_5px_gold]" : ""} 
              flex items-center justify-center bg-neutral-900 overflow-hidden`}
            >
              <img
                src="/avatar.webp"
                alt="Avatar"
                className="w-full h-full object-cover object-center"
                draggable={false}
              />
              {/* Social Disgrace  */}
              {currentPlayer?.socialDisgrace && (
                <motion.div
                  className="absolute pointer-events-none z-[9999]"
                  initial={{ scale: 1 }}
                  animate={{
                    scale: [1, 1.08, 1],
                    filter: [
                      "drop-shadow(0 0 6px rgba(255,0,0,0.6))",
                      "drop-shadow(0 0 14px rgba(255,0,0,1))",
                      "drop-shadow(0 0 6px rgba(255,0,0,0.6))"
                    ]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="relative group flex items-center justify-center pointer-events-auto z-[9999]">
                    <img
                      src="/socialDisgrace.webp"
                      alt="Social Disgrace"
                      draggable={false}
                      className="
          lg:w-20 lg:h-20 md:w-15 md:h-15 sm:w-12 sm:h-12
          opacity-80
          rounded-full
          cursor-help
        "
                    />

                    {/* Tooltip */}
                    <span
                      className="
          absolute -top-10 left-1/2 -translate-x-1/2
          bg-[#55412a] text-white text-xs
          px-2 py-1 rounded-md shadow-lg
          opacity-0 group-hover:opacity-80
          transition-all duration-200 ease-in-out
          pointer-events-none
          z-[10000]
          whitespace-nowrap
        "
                    >
                      Player in social disgrace
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
            <span className="text-lg font-semibold text-center">
              {currentPlayer?.name || ""} (You)
            </span>
          </div>

          {/* Zoom */}
          <div className="absolute flex flex-col space-y-2 mt-2">
            <SecretButton onClick={() => onShowSecrets()} />
            <SetsButton onClick={() => onShowSets()} />
            <button
              data-testid="zoom-button"
              onClick={() => openModal("cards", inventoryCards)}
              className="
                absolute 
                lg:top-4 lg:-left-27 md:top-3 md:-left-19 sm:top-2 sm:-left-14
                lg:w-8 md:w-6 sm:w-4 lg:h-8 md:h-6 sm:h-4 
                rounded-full bg-yellow-700 text-gray-200
                flex items-center justify-center
                hover:scale-110 hover:shadow-[#7a602e]
                transition-all duration-200
                border-1 border-black
               "
              title="Zoom"
            >
              <Search
                className="
                lg:w-5 lg:h-5 md:w-4 md:h-4 sm:w-3 sm:h-3
                text-white"
              />
            </button>
          </div>
        </div>

        {/* Cards and actions */}
        <div
          className="
          flex items-end justify-center
          lg:space-x-3 md:space-x-1 sm:space-x-1"
        >
          {/* Cards */}
          <div
            className={`flex items-center justify-center space-x-2 sm:w-[28rem] md:w-[36rem] lg:w-[50rem] my-3`}
          >
            {inventoryCards.map((card, i) => {
              const isSelected = selectedCardIds?.has(card.id);
              const isNotSoFast = card.name === "E_NSF";
              const shouldAnimate = isNotSoFast && canNoSoFast;

              const isDisabled =
                !isCurrentTurn && !(isNotSoFast && canNoSoFast);

              return (
                <motion.div
                  key={card.id || i}
                  onClick={() => {
                    if (!isDisabled) handleCardClick(card.id);
                  }}
                  className={`relative flex flex-col items-center justify-center
        ${cardtam}
        transition-all duration-300
        ${
          isDisabled
            ? "cursor-not-allowed opacity-90 grayscale brightness-90"
            : "cursor-pointer"
        }
        ${
          isSelected && !isDisabled
            ? "scale-103 ring-4 ring-yellow-500 rounded-xl"
            : "border-gray-200 hover:scale-105"
        }`}
                  animate={
                    shouldAnimate ? { y: -20, scale: 1.08 } : { y: 0, scale: 1 }
                  }
                  transition={{
                    type: "spring",
                    stiffness: 150,
                    damping: 12
                  }}
                >
                  <img
                    src={`/cards/${card.name}.webp`}
                    alt={card.name}
                    className={`rounded-lg shadow-lg ${
                      isDisabled ? "grayscale brightness-90" : ""
                    }`}
                    draggable={false}
                  />

                  <RadiusFill isActive={shouldAnimate} resetKey={nsfResetKey} />

                  {/* gloss */}
                  {shouldAnimate && (
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-yellow-400/10 z-40"
                      animate={{ opacity: [0, 0.5, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}

                  {selectedCardIds.size === 1 &&
                    card.type === "DETECTIVE" &&
                    selectedCardIds?.has(card.id) && (
                      <motion.button
                        data-testid="add-detective-button"
                        onClick={handlePlayCard}
                        className="
              absolute flex items-center justify-center
              lg:-top-10 md:-top-8 sm:-top-6
              rounded-full border-1 border-black
              hover:scale-110
              transition-all duration-200
            "
                        whileTap={{ scale: 0.95 }}
                      >
                        <CirclePlus className="lg:w-8 lg:h-8 md:w-6 md:h-6 sm:w-4 sm:h-4 text-gray-200" />
                      </motion.button>
                    )}
                </motion.div>
              );
            })}
          </div>

          {/* Next turn and discard buttons */}
          <div className="flex flex-col items-center space-y-3 ml-3 my-5">
            <motion.button
              disabled={
                !((isCurrentTurn && selectedCardIds?.size > 0) || canNoSoFast)
              }
              onClick={handlePlayCard}
              className={`
                ${buttontam}
                flex items-center justify-center
                rounded-xl shadow-lg 
                font-bold 
                transition duration-300
                border-1 border-black
              ${
                (isCurrentTurn && selectedCardIds?.size > 0) || canNoSoFast
                  ? "bg-yellow-700 text-gray-200 hover:shadow-[#7a602e] transform hover:scale-105"
                  : "bg-[#55412a] text-gray-400 cursor-not-allowed"
              }`}
              whileTap={
                isCurrentTurn && selectedCardIds?.size > 0
                  ? { scale: 0.95 }
                  : {}
              }
            >
              Play
            </motion.button>

            <motion.button
              disabled={!isCurrentTurn}
              onClick={handleNextTurnRequest}
              className={`
                ${buttontam}
                flex items-center justify-center
                rounded-xl shadow-lg 
                font-bold text-lg
                transition duration-300
                border-1 border-black
              ${
                isCurrentTurn
                  ? "bg-yellow-700 text-gray-200 hover:shadow-[#7a602e] transform hover:scale-105"
                  : "bg-[#55412a] text-gray-400 cursor-not-allowed"
              }`}
              whileTap={isCurrentTurn ? { scale: 0.95 } : {}}
            >
              End Turn
            </motion.button>

            <motion.button
              onClick={handleDiscard}
              disabled={!isDiscardButtonEnabled || !isCurrentTurn}
              className={`
                ${buttontam}
                flex items-center justify-center
                rounded-xl shadow-lg 
                font-bold text-lg
                transition duration-300
                border-1 border-black
              ${
                isDiscardButtonEnabled && isCurrentTurn
                  ? "bg-yellow-700 text-gray-200 hover:shadow-[#7a602e] transform hover:scale-105"
                  : "bg-[#55412a] text-gray-400 cursor-not-allowed"
              }`}
              whileTap={
                isDiscardButtonEnabled && isCurrentTurn ? { scale: 0.95 } : {}
              }
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Discard ({selectedCardIds?.size || 0})
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="bg-neutral-900 rounded-2xl p-8 text-center shadow-2xl border border-gray-700 max-w-sm"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120 }}
          >
            <h2 className="text-xl font-semibold mb-3 text-white">
              Are you sure you want to skip your turn?
            </h2>
            <p className="text-gray-400 mb-6">
              You didn't take any action, and one card will be discarded
            </p>

            <label className="flex items-center justify-center gap-2 mb-6 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideTurnWarning}
                onChange={e => onHideWarningChange(e.target.checked)}
                className="w-4 h-4 accent-yellow-600"
              />
              <span className="text-gray-300 text-sm">
                Don't show this again
              </span>
            </label>

            <div className="flex justify-center gap-4">
              <button
                onClick={onCancelNextTurn}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={onConfirmNextTurn}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-white font-semibold transition"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Zoom modal */}
      <CardZoomModal
        isOpen={isModalOpen}
        onClose={closeModal}
        cards={modalCards}
        title={modalTitle}
        modalType={modalType}
        viewingOwnSecrets={viewingOwnSecrets}
      />
    </div>
  );
};
export default InGameLayout;
