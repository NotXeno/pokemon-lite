export default function HowToPlay({ onClose }) {
  return (
    <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4 font-mono">
      <div className="bg-white border-8 border-gray-900 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl animate-[bounce_0.5s_ease-out] relative">
        <h2 className="text-3xl font-black mb-4 text-gray-800 text-center uppercase">How to Play</h2>
        <div className="text-gray-700 font-bold flex flex-col gap-3 mb-6 text-sm md:text-base text-left">
          <p>1. Enter a <span className="text-blue-600 border px-1 rounded border-blue-600 bg-blue-50">ROOM ID</span> and your <span className="text-red-500 border px-1 rounded border-red-500 bg-red-50">NAME</span> and click Join.</p>
          <p>2. Select exactly <strong>3 POKÉMON</strong> to form your squad.</p>
          <p>3. Wait for the opponent to be ready.</p>
          <p>4. Take turns battling! <span className="text-red-600 bg-red-100 border border-red-300 px-1 rounded text-xs align-middle">RULE:</span> You only pick 1 move per turn, and <strong>you cannot use the exact same move twice in a row!</strong></p>
          <p>5. Use logic and elements to your advantage:</p>
          <div className="bg-gray-100 p-3 rounded-xl border-2 border-gray-300 flex flex-col gap-1 text-center text-xs md:text-sm shadow-inner uppercase font-black">
            <p><span className="text-blue-500">WATER</span> beats <span className="text-red-500">FIRE</span></p>
            <p><span className="text-red-500">FIRE</span> beats <span className="text-green-500">GRASS</span></p>
            <p><span className="text-green-500">GRASS</span> beats <span className="text-blue-500">WATER</span></p>
            <p><span className="text-yellow-600">GROUND</span> beats <span className="text-yellow-500">ELECTRIC</span></p>
            <p><span className="text-yellow-500">ELECTRIC</span> beats <span className="text-blue-500">WATER</span></p>
          </div>
        </div>
        <button onClick={onClose} className="w-full bg-green-500 hover:bg-green-400 border-4 border-gray-900 text-white font-black text-xl py-3 px-4 rounded-xl transition-transform active:scale-95 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 uppercase">
          GOT IT!
        </button>
      </div>
    </div>
  );
}
