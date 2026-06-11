export default function Lobby({ 
  roomInput, setRoomInput, 
  nameInput, setNameInput, 
  joinRoom, 
  waitingRooms, fetchRooms, 
  setShowSettings, setShowHowToPlay 
}) {
  return (
    <div className="min-h-screen bg-red-600 font-mono flex items-center justify-center p-4 relative overflow-hidden"> 
      {/* Pokeball line styling in bg */}
      <div className="absolute top-1/2 w-full h-8 bg-gray-900 -translate-y-1/2 z-0"></div>
      <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-gray-900 rounded-full -translate-x-1/2 -translate-y-1/2 z-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-white rounded-full border-8 border-gray-900"></div>
      </div>

      {/* Top Buttons */}
      <div className="absolute top-4 right-4 flex gap-4 z-20">
        <button onClick={() => setShowSettings(true)} className="bg-white hover:bg-gray-100 p-2 px-4 rounded-xl border-4 border-gray-900 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none transition-all font-black text-gray-800 text-xs md:text-sm">
          SETTINGS
        </button>
        <button onClick={() => setShowHowToPlay(true)} className="bg-white hover:bg-gray-100 p-2 px-4 rounded-xl border-4 border-gray-900 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none transition-all font-black text-gray-800 text-xs md:text-sm">
          HOW TO PLAY?
        </button>
      </div>

      <div className="max-w-md w-full bg-white p-8 rounded-2xl border-4 border-gray-900 shadow-[8px_8px_0px_rgba(0,0,0,1)] z-10 text-center"> 
        <h1 className ="text-5xl font-black mb-2 text-red-600 tracking-tighter drop-shadow-md">POKÉMON</h1>
        <h2 className="text-3xl font-black mb-8 text-gray-800 tracking-tight">LITE</h2>
        <p className="mb-6 font-bold text-gray-600">Enter a Room ID & Name to battle!</p>
        
        <input 
          type="text" 
          placeholder="Room ID (e.g. mnt-moon)" 
          value={roomInput} 
          onChange={(e) => setRoomInput(e.target.value.toLowerCase().replace(/\s+/g, '-'))} 
          className="font-bold p-3 border-4 border-gray-300 rounded-xl w-full mb-4 text-center outline-none focus:border-blue-500 focus:bg-blue-50 transition-colors" 
        />

        <input 
          id="name-input"
          type="text" 
          placeholder="Player Name (e.g. Ash)" 
          value={nameInput} 
          onChange={(e) => setNameInput(e.target.value)} 
          className="font-bold p-3 border-4 border-gray-300 rounded-xl w-full mb-6 text-center outline-none focus:border-red-500 focus:bg-red-50 transition-colors" 
        />

        <button onClick={joinRoom} className="bg-yellow-400 hover:bg-yellow-300 border-4 border-gray-900 text-gray-900 font-black text-xl py-3 px-4 rounded-xl w-full transition-transform active:scale-95 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 mb-6 uppercase">
          JOIN ROOM
        </button>

        {/* Active Waiting Rooms */}
        <div className="bg-gray-100 p-4 border-4 border-gray-300 rounded-xl max-h-48 overflow-y-auto">
           <div className="flex justify-between items-center mb-2 pb-2 border-b-2 border-gray-300">
             <h3 className="font-black text-gray-700 uppercase text-xs">WAITING PLAYERS</h3>
             <button onClick={fetchRooms} className="text-xs bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded font-bold transition-colors uppercase">REFRESH</button>
           </div>
           {waitingRooms.length === 0 ? (
              <p className="text-gray-500 font-bold text-xs py-4 uppercase">No trainers waiting. Create a room!</p>
           ) : (
              <div className="flex flex-col gap-2">
                 {waitingRooms.map((room, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => {
                         setRoomInput(room.room_id)
                         document.getElementById('name-input')?.focus()
                      }}
                      className="bg-white border-2 border-gray-400 hover:border-blue-500 hover:bg-blue-50 p-2 rounded-lg text-left flex justify-between items-center transition-colors group"
                    >
                       <div>
                          <div className="text-[10px] text-gray-500 font-bold uppercase">Room: {room.room_id}</div>
                          <div className="font-black text-gray-800 text-xs uppercase">Host: {room.host}</div>
                       </div>
                       <div className="bg-blue-500 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity uppercase">JOIN</div>
                    </button>
                 ))}
              </div>
           )}
        </div>
      </div>
    </div>
  )
}
