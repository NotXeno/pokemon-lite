import {useState, useEffect, useRef} from 'react'

function App() {
  const [pokemonList, setPokemonList] = useState([])
  const [waitingRooms, setWaitingRooms] = useState([])
  const [roomInput, setRoomInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [gameState, setGameState] = useState(null)
  const [showHowToPlay, setShowHowToPlay] = useState(true)
  const audioRef = useRef(null)

  const ws = useRef(null)
  const logEndRef = useRef(null)
  
  // Fetch Pokemon List & Rooms from API on component mount
  const fetchPokemon = () => {
    fetch('http://127.0.0.1:8000/api/pokemon')
      .then(res => res.json())
      .then(data => setPokemonList(data.data))
      .catch(err => console.error("Could not fetch pokemon", err))
  }

  const fetchRooms = () => {
    fetch('http://127.0.0.1:8000/api/rooms')
      .then(res => res.json())
      .then(data => setWaitingRooms(data.data))
      .catch(err => console.error("Could not fetch waiting rooms", err))
  }

  useEffect(() => {
    fetchPokemon()
    fetchRooms()
    const interval = setInterval(fetchRooms, 3000) // Poll rooms every 3 seconds
    return () => clearInterval(interval)
  }, [])

  // Automatically scroll to the bottom of the battle log when it updates
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [gameState?.battle_log])

  useEffect(() => {
    // Only play audio if we are in the battle arena
    // Meaning two players are fully ready
    if (audioRef.current) {
        if (gameState && gameState.status === 'battle') {
            audioRef.current.play().catch(e => console.log("Audio autoplay prevented"));
        } else {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }
  }, [gameState?.status])

  // Join the Room function
  const joinRoom = () => {
    if (!roomInput || !nameInput) {
      alert("Please fill in the Room ID and the name first!")
      return;
    }

    ws.current = new WebSocket(`ws://127.0.0.1:8000/ws/battle/${roomInput}/${nameInput}`)

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'update') {
        setGameState(data.state)
      } else if (data.type === 'error') {
        alert(data.message)
      }
    }
  }

  // Helper to map backend names to standard image names and extensions
  const getPokeImg = (name, state) => {
    const map = {
      'pikacu': { active: 'Pikachu-active.png', fainted: 'Pikachu-fainted.webp' },
      'bulba': { active: 'Bulbasaur-active.png', fainted: 'Bulbasaur-fainted.jpg' },
      'charma': { active: 'Charmander-active.png', fainted: 'Charmander-fainted.jpg' },
      'skurtle': { active: 'Squirtle-active.png', fainted: 'Squirtle-fainted.jpg' },
      'digtil': { active: 'Diglett-active.png', fainted: 'Diglett-fainted.webp' }
    }
    const lower = name.toLowerCase()
    if (!map[lower]) {
      return `${lower}-${state}.png`
    }
    return map[lower][state]
  }

  // Send Pokemon Choice Function
  const selectPokemon = (pokeId) => {
    if (ws.current) {
      ws.current.send(JSON.stringify({action: 'select_pokemon', pokemon_id: pokeId}))
    }
  }

  // Remove Pokemon Function
  const removePokemon = (index) => {
    if (ws.current) {
      ws.current.send(JSON.stringify({action: 'remove_pokemon', index: index}))
    }
  }

  // Ready Button Function
  const setReady = () => {
    if (ws.current) {
      ws.current.send(JSON.stringify({action: 'ready'}))
    }
  }

  // Attack Function
  const sendMove = (moveName) => {
    if (ws.current) {
      ws.current.send(JSON.stringify({action: 'move', move_name: moveName}))
    }
  }

  // Switch Function
  const switchPokemon = (index) => {
    if (ws.current) {
      ws.current.send(JSON.stringify({action: 'switch', target_index: index}))
    }
  }

  // Exit Room function
  const leaveRoom = () => {
    if (ws.current) {
      ws.current.close() 
    }
    setGameState(null) // Reset screen to login lobby
  }

  // Rematch function
  const requestRematch = () => {
    if (ws.current) {
      ws.current.send(JSON.stringify({action: 'rematch'}))
    }
  }

  // --- SCREEN 1: LOGIN LOBBY ---
  if (!gameState) {
    return (
      <div className="min-h-screen bg-red-600 font-mono flex items-center justify-center p-4 relative overflow-hidden"> 
        {/* Pokeball line styling in bg */}
        <div className="absolute top-1/2 w-full h-8 bg-gray-900 -translate-y-1/2 z-0"></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-gray-900 rounded-full -translate-x-1/2 -translate-y-1/2 z-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-white rounded-full border-8 border-gray-900"></div>
        </div>

        {/* How to Play Manual Button */}
        <button onClick={() => setShowHowToPlay(true)} className="absolute top-4 right-4 z-20 bg-white hover:bg-gray-100 p-2 px-4 rounded-xl border-4 border-gray-900 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none transition-all font-black text-gray-800">
          HOW TO PLAY?
        </button>

        {/* How to Play Modal */}
        {showHowToPlay && (
          <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white border-8 border-gray-900 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl animate-[bounce_0.5s_ease-out] relative">
              <h2 className="text-3xl font-black mb-4 text-gray-800 text-center">HOW TO PLAY</h2>
              <div className="text-gray-700 font-bold flex flex-col gap-3 mb-6 text-sm md:text-base text-left">
                <p>1. Enter a <span className="text-blue-600 border px-1 rounded border-blue-600 bg-blue-50">ROOM ID</span> and your <span className="text-red-500 border px-1 rounded border-red-500 bg-red-50">NAME</span> and click Join.</p>
                <p>2. Select exactly <strong>3 POKÉMON</strong> to form your squad.</p>
                <p>3. Wait for the opponent to be ready.</p>
                <p>4. Take turns battling! <span className="text-red-600 bg-red-100 border border-red-300 px-1 rounded text-xs align-middle">RULE:</span> You only pick 1 move per turn, and <strong>you cannot use the exact same move twice in a row!</strong></p>
                <p>5. Use logic and elements to your advantage:</p>
                <div className="bg-gray-100 p-3 rounded-xl border-2 border-gray-300 flex flex-col gap-1 text-center text-xs md:text-sm shadow-inner">
                  <p><span className="text-blue-500">WATER</span> beats <span className="text-red-500">FIRE</span></p>
                  <p><span className="text-red-500">FIRE</span> beats <span className="text-green-500">GRASS</span></p>
                  <p><span className="text-green-500">GRASS</span> beats <span className="text-blue-500">WATER</span></p>
                  <p><span className="text-yellow-600">GROUND</span> beats <span className="text-yellow-500">ELECTRIC</span></p>
                  <p><span className="text-yellow-500">ELECTRIC</span> beats <span className="text-blue-500">WATER</span></p>
                </div>
              </div>
              <button onClick={() => setShowHowToPlay(false)} className="w-full bg-green-500 hover:bg-green-400 border-4 border-gray-900 text-white font-black text-xl py-3 px-4 rounded-xl transition-transform active:scale-95 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1">
                GOT IT!
              </button>
            </div>
          </div>
        )}

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

          <button onClick={joinRoom} className="bg-yellow-400 hover:bg-yellow-300 border-4 border-gray-900 text-gray-900 font-black text-xl py-3 px-4 rounded-xl w-full transition-transform active:scale-95 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 mb-6">
            JOIN ROOM
          </button>

          {/* Active Waiting Rooms */}
          <div className="bg-gray-100 p-4 border-4 border-gray-300 rounded-xl max-h-48 overflow-y-auto">
             <div className="flex justify-between items-center mb-2 pb-2 border-b-2 border-gray-300">
               <h3 className="font-black text-gray-700">WAITING PLAYERS</h3>
               <button onClick={fetchRooms} className="text-xs bg-gray-300 hover:bg-gray-400 px-2 py-1 rounded font-bold transition-colors">REFRESH</button>
             </div>
             {waitingRooms.length === 0 ? (
                <p className="text-gray-500 font-bold text-sm py-4">No trainers waiting. Create a room!</p>
             ) : (
                <div className="flex flex-col gap-2">
                   {waitingRooms.map((room, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => {
                           setRoomInput(room.room_id)
                           // Focus the name input automatically
                           document.getElementById('name-input')?.focus()
                        }}
                        className="bg-white border-2 border-gray-400 hover:border-blue-500 hover:bg-blue-50 p-2 rounded-lg text-left flex justify-between items-center transition-colors group"
                      >
                         <div>
                            <div className="text-xs text-gray-500 font-bold">Room: {room.room_id}</div>
                            <div className="font-black text-gray-800">Host: {room.host}</div>
                         </div>
                         <div className="bg-blue-500 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">JOIN</div>
                      </button>
                   ))}
                </div>
             )}
          </div>
        </div>
      </div>
    )
  }

  // Search my data and enemy from Object Dictionary Players 
  const isSpectator = !gameState.players.hasOwnProperty(nameInput)
  
  const myState = isSpectator ? null : gameState.players[nameInput]
  let enemyName = null
  let enemyState = null
  let player1Name = null
  let player2Name = null

  const playerNames = Object.keys(gameState.players)
  if (isSpectator) {
     if (playerNames.length > 0) player1Name = playerNames[0]
     if (playerNames.length > 1) player2Name = playerNames[1]
  } else {
     enemyName = playerNames.find(name => name !== nameInput)
     enemyState = enemyName ? gameState.players[enemyName] : null
  }

  // --- SCREEN 2: WAITING / SELECTING POKEMON ---
  if (gameState.status === 'waiting' || gameState.status === 'selecting') {
    return (
      <div className="min-h-screen bg-blue-100 font-mono text-gray-900 p-4 md:p-8">
        {/* Header PC Box Style */}
        <div className="max-w-5xl mx-auto bg-red-600 border-4 border-gray-900 rounded-t-2xl p-4 flex justify-between items-center text-white shadow-lg">
          <div className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full bg-blue-400 border-2 border-white animate-pulse"></div>
              <h1 className="text-xl md:text-2xl font-bold tracking-widest">ROOM: {gameState.game_id.toUpperCase()}</h1>
          </div>
          <button onClick={leaveRoom} className="bg-white text-red-600 hover:bg-gray-200 border-2 border-gray-900 font-bold py-1 px-4 rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all">
            EXIT
          </button>
        </div>

        <div className="max-w-5xl mx-auto bg-white border-4 border-t-0 border-gray-900 rounded-b-2xl p-4 md:p-6 shadow-xl">
          
          {/* Status Bar */}
          <div className="bg-gray-100 p-4 rounded-xl border-4 border-gray-300 mb-8 text-center text-lg font-bold">
            {gameState.status === 'waiting' ? (
              <p className="text-blue-600 animate-pulse">Waiting for challenger to appear...</p>
            ) : (
              <p className="text-green-600">{isSpectator ? "Players are choosing Pokémon!" : "Choose 3 Pokémon for your team!"}</p>
            )}
            <p className="text-gray-500 mt-2 text-sm drop-shadow-sm">Player 1: <span className="text-gray-800">{isSpectator ? (player1Name || '???') : nameInput}</span> VS Player 2: <span className="text-gray-800">{isSpectator ? (player2Name || '???') : (enemyName || '???')}</span></p>
          </div>

          {/* Choosing Pokemon */}
          {gameState.status === 'selecting' && (
            <div className={`flex flex-col ${isSpectator ? 'items-center' : 'lg:flex-row'} gap-8 mb-8`}>
              
              {/* Slot Tim Kita */}
              <div className={`${isSpectator ? 'w-full max-w-sm' : 'lg:w-1/3'} bg-blue-50 p-6 rounded-xl border-4 border-blue-200 text-center`}>
                <h2 className="text-xl font-black mb-4 text-blue-800">{isSpectator ? "SPECTATING..." : `${nameInput.toUpperCase()}'S TEAM (${myState.team.length}/3)`}</h2>
                {!isSpectator && (
                <div className="flex flex-col gap-4 mb-6">
                  {myState.team.map((p, idx) => (
                    <div key={idx} className="relative bg-white p-2 rounded-xl font-bold border-4 border-gray-900 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] flex items-center gap-4">
                      {!myState.is_ready && (
                        <button 
                          onClick={() => removePokemon(idx)}
                          className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-400 text-white rounded-full w-8 h-8 flex items-center justify-center font-black border-2 border-gray-900 shadow-md transition-transform hover:scale-110 z-10"
                        >✕</button>
                      )}
                      <div className="bg-gray-100 rounded-lg p-1 border-2 border-gray-300">
                        <img 
                          src={`/pokemon-images/${getPokeImg(p.name, 'active')}`} 
                          alt={p.name} 
                          className="h-10 w-10 md:h-12 md:w-12 object-contain drop-shadow-md"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                      <span className="text-lg">{p.name}</span>
                    </div>
                  ))}
                  
                  {/* Empty Slots Filler */}
                  {[...Array(3 - myState.team.length)].map((_, i) => (
                     <div key={`empty-${i}`} className="bg-blue-100/50 p-4 rounded-xl border-4 border-dashed border-blue-300 h-20 flex items-center justify-center text-blue-300 font-bold">EMPTY SLOT</div>
                  ))}
                </div>
                )}
                
                {!isSpectator && myState.team.length === 3 ? (
                  !myState.is_ready ? (
                    <button onClick={setReady} className="w-full bg-green-500 hover:bg-green-400 border-4 border-gray-900 text-white font-black py-4 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:-translate-x-1 hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none transition-all">READY TO BATTLE!</button>
                  ) : (
                    <div className="bg-yellow-100 border-4 border-yellow-400 text-yellow-700 font-bold py-3 px-2 rounded-xl animate-pulse">Waiting for {enemyName}...</div>
                  )
                ) : null}
              </div>

              {/* Pokemon Selection List */}
              {!isSpectator && (
                <div className="lg:w-2/3">
                  {!myState.is_ready && myState.team.length < 3 && (
                    pokemonList.length === 0 ? (
                  <div className="bg-red-50 p-8 text-center border-4 border-red-400 rounded-xl">
                    <p className="text-red-600 font-bold mb-4">Could not load Pokemon data! (Server may have restarted)</p>
                    <button onClick={fetchPokemon} className="bg-white text-red-600 font-bold py-2 px-6 rounded-xl border-4 border-red-500 shadow-[4px_4px_0px_rgba(239,68,68,0.5)] active:translate-y-1 active:shadow-none transition-all">TRY AGAIN</button>
                  </div>
                ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {pokemonList.map((p) => (
                    <button key={p.id} onClick={() => selectPokemon(p.id)} className="bg-white hover:bg-gray-50 p-4 rounded-xl border-4 border-gray-900 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] text-center transition-all flex flex-col items-center group relative overflow-hidden">
                      {/* Element Type background hint */}
                      <div className={`absolute top-0 right-0 w-16 h-16 opacity-20 rounded-bl-full ${p.element_type === 'Fire' ? 'bg-red-500' : p.element_type === 'Water' ? 'bg-blue-500' : p.element_type === 'Grass' ? 'bg-green-500' : p.element_type === 'Electric' ? 'bg-yellow-500' : 'bg-yellow-700'}`}></div>
                      
                      <div className="h-16 w-16 md:h-20 md:w-20 mb-2 flex items-center justify-center z-10">
                        <img 
                          src={`/pokemon-images/${getPokeImg(p.name, 'active')}`} 
                          alt={p.name} 
                          className="max-h-full max-w-full drop-shadow-md group-hover:scale-110 transition-transform"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                      <h3 className="text-lg md:text-xl font-black text-gray-800 z-10">{p.name}</h3>
                      <div className={`inline-block rounded px-2 mt-1 border text-[10px] md:text-xs font-bold text-gray-800 border-gray-900 shadow-[1px_1px_0px_rgba(0,0,0,1)] ${p.element_type === 'Fire' ? 'bg-red-400' : p.element_type === 'Water' ? 'bg-blue-400' : p.element_type === 'Grass' ? 'bg-green-400' : p.element_type === 'Electric' ? 'bg-yellow-400' : 'bg-yellow-600'}`}>{p.element_type.toUpperCase()}</div>
                      <div className="mt-2 text-xs font-bold text-gray-500 flex gap-2">
                        <span className="text-green-600">HP {p.hp}</span>
                        <span className="text-blue-500">SPD {p.speed}</span>
                      </div>
                    </button>
                  ))}
                </div>
                )
              )}
              </div>
              )}
            </div>
          )}

          {/* Global Chat / Battle Log Preview */}
          <div className="bg-gray-900 p-4 rounded-xl border-4 border-gray-400 h-40 overflow-y-auto font-mono text-white">
            <h3 className="font-bold mb-2 text-gray-400 border-b-2 border-gray-700 pb-1">ROOM LOG</h3>
            {gameState.battle_log.map((log, i) => (
              <p key={i} className="text-xs md:text-sm mb-1 text-gray-300">&gt; {log.replace('> ', '').replace('>', '')}</p>
            ))}
            <div ref={logEndRef}/> 
          </div>
        </div>
      </div>
    )
  }

  // --- SCREEN 3: BATTLE ARENA ---
  const isMyTurn = !isSpectator && gameState.current_turn === nameInput
  
  // If spectator, treat player 1 as "leftActivePoke" visually and player 2 as "rightActivePoke" visually
  const leftPlayer = isSpectator ? gameState.players[player1Name] : myState
  const rightPlayer = isSpectator ? gameState.players[player2Name] : enemyState
  const leftName = isSpectator ? player1Name : nameInput
  const rightName = isSpectator ? player2Name : enemyName

  const leftActivePoke = leftPlayer?.team[leftPlayer.active_pokemon_index]
  const rightActivePoke = rightPlayer?.team[rightPlayer.active_pokemon_index]

  // HP Color Helper
  const getHpColor = (hp, maxHp) => {
    const p = hp / maxHp;
    if (p > 0.5) return 'bg-green-500';
    if (p > 0.2) return 'bg-yellow-400';
    return 'bg-red-500';
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-300 to-green-400 font-mono p-4 md:p-8 flex flex-col justify-between overflow-hidden">
      {/* Header and status overlay */}
      {gameState.winner ? (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white border-8 border-gray-900 rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl animate-[bounce_0.5s_ease-out]">
            <h2 className="text-4xl font-black mb-4 text-gray-800">BATTLE FINISHED!</h2>
            <p className="text-2xl font-bold text-green-600 mb-8 font-mono">{gameState.winner.toUpperCase()} WINS!</p>
            {isSpectator ? (
                <div className="flex gap-4 justify-center">
                    <button onClick={leaveRoom} className="flex-1 bg-red-500 hover:bg-red-400 font-black border-4 border-gray-900 py-3 px-2 rounded-xl text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-1 active:shadow-none transition-all">LEAVE</button>
                </div>
            ) : myState.wants_rematch ? (
                <div className="bg-yellow-100 border-4 border-yellow-400 text-yellow-700 font-bold py-3 px-6 rounded-xl animate-pulse">Waiting for {enemyName}...</div>
            ) : (
                <div className="flex gap-4 justify-center">
                    <button onClick={requestRematch} className="flex-1 bg-blue-500 hover:bg-blue-400 font-black border-4 border-gray-900 py-3 px-2 rounded-xl text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-1 active:shadow-none transition-all">REMATCH</button>
                    <button onClick={leaveRoom} className="flex-1 bg-red-500 hover:bg-red-400 font-black border-4 border-gray-900 py-3 px-2 rounded-xl text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-1 active:shadow-none transition-all">LEAVE</button>
                </div>
            )}
            </div>
        </div>
      ) : null}

      {/* Action / Leave header */}
      <div className="flex flex-wrap md:flex-nowrap justify-between items-center w-full max-w-4xl mx-auto mb-4 bg-white/50 p-2 md:p-3 rounded-xl border-4 border-gray-900 backdrop-blur-sm shadow-md z-40 relative gap-2">
         <span className="font-black text-gray-800 tracking-wider text-sm md:text-base">ROOM: {gameState.game_id.toUpperCase()}</span>
         
         {/* Type Chart Hint Default */}
         <div className="hidden lg:flex gap-1 text-[10px] xl:text-xs items-center bg-white px-2 py-1 border-2 border-gray-900 rounded font-bold">
            <span className="text-gray-500 mr-1">TIPS:</span>
            <span className="text-blue-600">WATER&gt;FIRE</span>
            <span>|</span>
            <span className="text-red-500">FIRE&gt;GRASS</span>
            <span>|</span>
            <span className="text-green-600">GRASS&gt;WATER</span>
            <span>|</span>
            <span className="text-yellow-600">GROUND&gt;ELEC</span>
            <span>|</span>
            <span className="text-yellow-500">ELEC&gt;WATER</span>
         </div>
         
         {/* Type Chart Hint Mobile */}
         <div className="lg:hidden flex order-last w-full justify-center gap-2 text-[9px] sm:text-[10px] items-center bg-white px-1 py-1 border-2 border-gray-900 rounded font-bold">
            <span className="text-blue-600">WTR&gt;FIR</span>
            <span className="text-red-500">FIR&gt;GRA</span>
            <span className="text-green-600">GRA&gt;WTR</span>
            <span className="text-yellow-600">GND&gt;ELE</span>
            <span className="text-yellow-500">ELE&gt;WTR</span>
         </div>
         
         <button onClick={leaveRoom} className="bg-white text-red-600 text-xs md:text-base font-bold py-1 px-3 md:px-4 rounded-lg border-2 border-gray-900 hover:bg-gray-100 shadow-[2px_2px_0px_rgba(0,0,0,1)] whitespace-nowrap">RUN AWAY</button>
      </div>

      {/* Top Section Layout Wrapper */}
      <div className="flex-1 w-full max-w-4xl mx-auto relative flex flex-col md:flex-row py-4 lg:py-8 overflow-hidden md:overflow-visible gap-8">
          {/* Battle Scene */}
          <div className="flex-1 w-full relative flex flex-col justify-center">
            
            {/* Enemy Status & Image (Top) */}
        <div className="flex justify-between items-start w-full relative mb-4 md:mb-12">
            
            {/* Enemy HP Box */}
            <div className="bg-white border-4 border-gray-900 p-2 md:p-3 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,0.5)] w-48 md:w-64 lg:w-72 relative z-20 self-start">
                <div className="flex justify-between items-baseline mb-1">
                    <h2 className="text-sm md:text-xl font-black text-gray-800 uppercase">{rightActivePoke.name}</h2>
                    <span className="text-[10px] md:text-sm font-bold text-gray-600">Lv50</span>
                </div>
                {/* HP Bar Container */}
                <div className="bg-gray-800 p-1 rounded-full border-2 border-gray-700 w-full flex items-center pr-1 md:pr-2">
                    <span className="text-yellow-400 font-black text-[8px] md:text-xs mr-1 md:mr-2 ml-1">HP</span>
                    <div className="w-full bg-gray-600 rounded-full h-2 md:h-3">
                        <div className={`${getHpColor(rightActivePoke.hp, rightActivePoke.max_hp)} h-2 md:h-3 rounded-full transition-all duration-500`} style={{ width: `${Math.max(0, (rightActivePoke.hp / rightActivePoke.max_hp) * 100)}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Enemy Image */}
            <div className="relative w-32 h-32 md:w-48 lg:w-56 md:h-48 lg:h-56 z-10 -mb-4 md:-mb-12 mr-2 md:mr-8 flex-shrink-0">
                <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 w-20 md:w-28 lg:w-32 h-6 md:h-8 lg:h-10 bg-black/20 rounded-[100%]"></div>
                <img src={`/pokemon-images/${getPokeImg(rightActivePoke.name, rightActivePoke.hp > 0 ? 'active' : 'fainted')}`} alt={rightActivePoke.name} className={`absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 min-w-[120%] drop-shadow-xl z-20 object-contain ${rightActivePoke.hp > 0 ? 'animate-[bounce_2s_infinite] scale-x-[-1]' : 'scale-x-[-1] translate-y-8 brightness-50 sepia-[.5]'}`} onError={(e) => { e.target.style.display = 'none'; }} />
            </div>

        </div>

        {/* Player Status & Image (Bottom) */}
        <div className="flex justify-between items-end w-full relative pb-4 md:pb-8 mt-4 md:mt-24">
            
            {/* Player Image */}
            <div className="relative w-32 h-32 md:w-48 lg:w-56 md:h-48 lg:h-56 z-10 self-end -mb-4 md:mb-8 ml-4 md:ml-8 flex-shrink-0">
                <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 w-24 md:w-36 lg:w-40 h-6 md:h-8 lg:h-10 bg-black/20 rounded-[100%]"></div>
                <img src={`/pokemon-images/${getPokeImg(leftActivePoke.name, leftActivePoke.hp > 0 ? 'active' : 'fainted')}`} alt={leftActivePoke.name} className={`absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 min-w-[120%] drop-shadow-2xl z-20 object-contain ${leftActivePoke.hp > 0 ? '' : 'translate-y-8 brightness-50 sepia-[.5]'}`} onError={(e) => { e.target.style.display = 'none'; }} />
            </div>

            {/* Player HP Box */}
            <div className="bg-white border-4 border-gray-900 p-2 md:p-3 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,0.5)] w-48 md:w-64 lg:w-72 relative z-30 self-end">
                <div className="flex justify-between items-baseline mb-1">
                    <h2 className="text-sm md:text-xl font-black text-gray-800 uppercase">{leftActivePoke.name}</h2>
                    <span className="text-[10px] md:text-sm font-bold text-gray-600">Lv50</span>
                </div>
                {/* HP Bar Container */}
                <div className="bg-gray-800 p-1 rounded-full border-2 border-gray-700 w-full flex items-center pr-1 md:pr-2 mb-1">
                    <span className="text-yellow-400 font-black text-[8px] md:text-xs mr-1 md:mr-2 ml-1">HP</span>
                    <div className="w-full bg-gray-600 rounded-full h-2 md:h-3">
                        <div className={`${getHpColor(leftActivePoke.hp, leftActivePoke.max_hp)} h-2 md:h-3 rounded-full transition-all duration-500`} style={{ width: `${Math.max(0, (leftActivePoke.hp / leftActivePoke.max_hp) * 100)}%` }}></div>
                    </div>
                </div>
                <div className="text-right font-black text-gray-700 text-[10px] md:text-sm">{leftActivePoke.hp} / {leftActivePoke.max_hp}</div>
            </div>

        </div>
        </div>

      </div>

      {/* Dialog Box / Controls (Bottom) */}
      <div className="w-full max-w-6xl mx-auto border-8 border-gray-900 rounded-2xl bg-white flex flex-col md:flex-row overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.3)] z-40 relative">
        
        {/* Game Log Dialog Area */}
        <div className="p-4 md:p-6 flex-1 bg-gray-100 border-b-4 md:border-b-0 md:border-r-8 border-gray-900 min-h-[120px] flex flex-col justify-end">
           {gameState.battle_log.slice(-3).map((log, i) => (
             <p key={i} className="text-lg md:text-xl font-bold text-gray-800 leading-snug mb-1">
               {log.replace('> ', '').replace('>', '')}
             </p>
           ))}

           {/* Turn Status Overlay indicator */}
           {!gameState.winner && (
             <div className="mt-4 inline-block font-black text-sm p-1 px-3 border-2 border-gray-900 rounded bg-white shadow-sm self-start">
               {isSpectator ? (
                 <span className="text-blue-500 animate-pulse">SPECTATING {gameState.current_turn.toUpperCase()}'S TURN...</span>
               ) : (
                 isMyTurn ? (myState.must_switch ? <span className="text-red-500 animate-pulse">MUST SWITCH POKEMON!</span> : <span className="text-green-600">WHAT WILL {leftActivePoke.name.toUpperCase()} DO?</span>) : <span className="text-gray-500">WAITING FOR {enemyName.toUpperCase()}...</span>
               )}
             </div>
           )}
        </div>

        {/* Action Controls */}
        <div className="bg-gray-200 w-full md:w-2/5 xl:w-[400px]">
           {isSpectator ? (
             <div className="p-4 flex flex-col items-center justify-center h-full bg-gray-300 text-gray-500 font-black border-l-4 border-gray-400">
               <div>SPECTATOR MODE</div>
               <div className="text-xs mt-1">Actions Disabled</div>
             </div>
           ) : myState.must_switch ? (
             <div className="p-4 grid grid-cols-1 gap-2 h-full bg-red-100">
               <h3 className="font-bold text-red-600 text-center mb-2">CHOOSE REPLACEMENT</h3>
               <div className="flex gap-2 justify-center">
                 {myState.team.map((poke, idx)=> (
                    <button
                      key={idx}
                      onClick={() => switchPokemon(idx)}
                      disabled={!isMyTurn || gameState.winner || idx === myState.active_pokemon_index || poke.hp <= 0}
                      className={`flex-1 p-2 border-4 rounded-xl font-bold transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none 
                         ${idx === myState.active_pokemon_index ? 'bg-green-500 border-green-700 text-white opacity-50' : 
                         poke.hp <= 0 ? 'bg-gray-400 border-gray-500 text-gray-600 opacity-50' : 
                         'bg-white border-gray-900 text-gray-800 hover:bg-gray-50'}`}
                    >
                      <img src={`/pokemon-images/${getPokeImg(poke.name, 'active')}`} alt="poke" className="w-8 h-8 mx-auto mb-1" onError={(e)=>{e.target.style.display='none'}}/>
                      <div className="text-xs">{poke.name}</div>
                    </button>
                 ))}
               </div>
             </div>
           ) : (
            <div className="p-2 grid grid-cols-2 gap-2 h-full content-center bg-white md:bg-gray-200">
              {leftActivePoke.moves.map((move, idx) => {
                 let typeColor = 'bg-gray-100';
                 if(move.element_type==='Fire') typeColor='bg-red-400 text-white';
                 if(move.element_type==='Water') typeColor='bg-blue-400 text-white';
                 if(move.element_type==='Grass') typeColor='bg-green-400 text-white';
                 if(move.element_type==='Electric') typeColor='bg-yellow-400 text-gray-900';
                 if(move.element_type==='Ground') typeColor='bg-yellow-700 text-white';

                 return (
                  <button 
                    key={idx} 
                    onClick={() => sendMove(move.name)}
                    disabled={!isMyTurn || gameState.winner || move.name === myState.last_used_move}
                    className={`relative p-2 flex flex-col items-center justify-center border-4 border-gray-900 rounded-xl transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[0px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed ${typeColor}`}
                  >
                    <span className="font-black text-xs sm:text-sm lg:text-base leading-tight">{move.name.toUpperCase()}</span>
                    {move.is_heal ? (
                        <span className="text-[9px] sm:text-[10px] font-black mt-1 bg-green-500 text-white px-2 py-0.5 rounded-full border border-gray-900 shadow-[1px_1px_0px_rgba(0,0,0,1)] leading-none">HEAL +{move.power}</span>
                    ) : (
                        <span className="text-[9px] sm:text-[10px] font-black mt-1 opacity-70 leading-none">PWR {move.power}</span>
                    )}
                  </button>
                 )
              })}
              {/* Manual Switch Button */}
              <div className="col-span-2 pt-2 border-t-2 border-gray-300 mt-1 flex gap-1 justify-center items-center">
                 <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Switch:</span>
                 {myState.team.map((poke, idx)=> (
                    <button
                      key={idx}
                      onClick={() => switchPokemon(idx)}
                      disabled={!isMyTurn || gameState.winner || idx === myState.active_pokemon_index || poke.hp <= 0}
                      className={`px-2 py-1 border-2 rounded text-[10px] md:text-xs font-bold leading-none ${idx === myState.active_pokemon_index ? 'bg-green-500 text-white border-green-700 opacity-50' : poke.hp <= 0 ? 'bg-red-200 border-red-300 text-red-500 opacity-50 cursor-not-allowed' : 'bg-white border-gray-900 hover:bg-gray-100 shadow-[1px_1px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-px'}`}
                    >
                      {poke.name.substring(0,3).toUpperCase()}
                    </button>
                 ))}
              </div>
            </div>
           )}
        </div>
      </div>
      
      {/* Background Music Audio Element */}
      <audio ref={audioRef} loop src="/audio/battle.mp3" />
    </div>
  )
}

export default App