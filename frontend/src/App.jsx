import {useState, useEffect, useRef} from 'react'

function App() {
  const [pokemonList, setPokemonList] = useState([])
  const [roomInput, setRoomInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [gameState, setGameState] = useState(null)

  const ws = useRef(null)
  const logEndRef = useRef(null)
  
  // Fetch Pokemon List from API on component mount
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/pokemon')
      .then(res => res.json())
      .then(data => setPokemonList(data.data))
  }, [])

  // Automatically scroll to the bottom of the battle log when it updates
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [gameState?.battle_log])

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
            type="text" 
            placeholder="Player Name (e.g. Ash)" 
            value={nameInput} 
            onChange={(e) => setNameInput(e.target.value)} 
            className="font-bold p-3 border-4 border-gray-300 rounded-xl w-full mb-6 text-center outline-none focus:border-red-500 focus:bg-red-50 transition-colors" 
          />

          <button onClick={joinRoom} className="bg-yellow-400 hover:bg-yellow-300 border-4 border-gray-900 text-gray-900 font-black text-xl py-3 px-4 rounded-xl w-full transition-transform active:scale-95 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1">
            JOIN ROOM
          </button>
        </div>
      </div>
    )
  }

  // Search my data and enemy from Object Dictionary Players 
  const myState = gameState.players[nameInput]
  const enemyName = Object.keys(gameState.players).find(name => name !== nameInput)
  const enemyState = enemyName ? gameState.players[enemyName] : null

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
              <p className="text-green-600">Choose 3 Pokémon for your team!</p>
            )}
            <p className="text-gray-500 mt-2 text-sm drop-shadow-sm">Player 1: <span className="text-gray-800">{nameInput}</span> VS Player 2: <span className="text-gray-800">{enemyName || '???'}</span></p>
          </div>

          {/* Choosing Pokemon */}
          {gameState.status === 'selecting' && (
            <div className="flex flex-col lg:flex-row gap-8 mb-8">
              
              {/* Slot Tim Kita */}
              <div className="lg:w-1/3 bg-blue-50 p-6 rounded-xl border-4 border-blue-200 text-center">
                <h2 className="text-xl font-black mb-4 text-blue-800">MY TEAM ({myState.team.length}/3)</h2>
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
                
                {myState.team.length === 3 ? (
                  !myState.is_ready ? (
                    <button onClick={setReady} className="w-full bg-green-500 hover:bg-green-400 border-4 border-gray-900 text-white font-black py-4 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:-translate-x-1 hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:shadow-none transition-all">READY TO BATTLE!</button>
                  ) : (
                    <div className="bg-yellow-100 border-4 border-yellow-400 text-yellow-700 font-bold py-3 px-2 rounded-xl animate-pulse">Waiting for {enemyName}...</div>
                  )
                ) : null}
              </div>

              {/* Pokemon Selection List */}
              <div className="lg:w-2/3">
              {!myState.is_ready && myState.team.length < 3 && (
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
              )}
              </div>
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
  const isMyTurn = gameState.current_turn === nameInput
  const myActivePoke = myState.team[myState.active_pokemon_index]
  const enemyActivePoke = enemyState.team[enemyState.active_pokemon_index]

  // HP Color Helper
  const getHpColor = (hp, maxHp) => {
    const p = hp / maxHp;
    if (p > 0.5) return 'bg-green-500';
    if (p > 0.2) return 'bg-yellow-400';
    return 'bg-red-500';
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-300 to-green-400 font-mono p-4 md:p-8 flex flex-col justify-between">
      {/* Header and status overlay */}
      {gameState.winner ? (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white border-8 border-gray-900 rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl animate-[bounce_0.5s_ease-out]">
            <h2 className="text-4xl font-black mb-4 text-gray-800">BATTLE FINISHED!</h2>
            <p className="text-2xl font-bold text-green-600 mb-8 font-mono">{gameState.winner.toUpperCase()} WINS!</p>
            {myState.wants_rematch ? (
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
      <div className="flex justify-between items-center w-full max-w-4xl mx-auto mb-4 bg-white/50 p-2 rounded-xl border-4 border-gray-900 backdrop-blur-sm shadow-md z-40 relative">
         <span className="font-black text-gray-800 tracking-wider">ROOM: {gameState.game_id.toUpperCase()}</span>
         
         {/* Type Chart Hint */}
         <div className="hidden md:flex gap-1 text-[10px] items-center bg-white px-2 py-1 border-2 border-gray-900 rounded font-bold">
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
         
         <button onClick={leaveRoom} className="bg-white text-red-600 font-bold py-1 px-4 rounded-lg border-2 border-gray-900 hover:bg-gray-100 shadow-[2px_2px_0px_rgba(0,0,0,1)]">RUN AWAY</button>
      </div>

      {/* Battle Scene */}
      <div className="flex-1 w-full max-w-4xl mx-auto relative flex flex-col justify-center py-4 lg:py-8">
        
        {/* Enemy Status & Image (Top / Right) */}
        <div className="flex flex-col md:flex-row justify-end items-end md:items-start w-full relative mb-12 pl-4 gap-4">
            
            {/* Enemy HP Box */}
            <div className="bg-white border-4 border-gray-900 p-3 lg:p-4 rounded-xl shadow-[6px_6px_0px_rgba(0,0,0,0.5)] w-64 md:w-80 relative z-10 md:mt-12 order-2 md:order-1 self-end md:self-start">
                <div className="flex justify-between items-baseline mb-1">
                    <h2 className="text-xl font-black text-gray-800 uppercase">{enemyActivePoke.name}</h2>
                    <span className="text-sm font-bold text-gray-600">Lv50</span>
                </div>
                {/* HP Bar Container */}
                <div className="bg-gray-800 p-1 rounded-full border-2 border-gray-700 w-full flex items-center pr-2">
                    <span className="text-yellow-400 font-black text-xs mr-2 ml-1">HP</span>
                    <div className="w-full bg-gray-600 rounded-full h-3">
                        <div className={`${getHpColor(enemyActivePoke.hp, enemyActivePoke.max_hp)} h-3 rounded-full transition-all duration-500`} style={{ width: `${Math.max(0, (enemyActivePoke.hp / enemyActivePoke.max_hp) * 100)}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Enemy Image */}
            <div className="relative w-48 h-48 md:w-56 md:h-56 z-0 order-1 md:order-2 self-end">
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-10 bg-black/20 rounded-[100%]"></div>
                <img src={`/pokemon-images/${getPokeImg(enemyActivePoke.name, enemyActivePoke.hp > 0 ? 'active' : 'fainted')}`} alt={enemyActivePoke.name} className={`absolute bottom-8 left-1/2 -translate-x-1/2 max-h-full max-w-full drop-shadow-xl z-10 ${enemyActivePoke.hp > 0 ? 'animate-[bounce_2s_infinite] scale-x-[-1]' : 'scale-x-[-1] translate-y-8 brightness-50 sepia-[.5]'}`} onError={(e) => { e.target.style.display = 'none'; }} />
            </div>

        </div>

        {/* Player Status & Image (Bottom / Left) */}
        <div className="flex flex-col md:flex-row justify-start items-end w-full relative pr-4 gap-4 pb-8">
            
            {/* Player Image */}
            <div className="relative w-48 h-48 md:w-56 md:h-56 z-10 self-start md:self-end">
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-40 h-10 bg-black/20 rounded-[100%]"></div>
                <img src={`/pokemon-images/${getPokeImg(myActivePoke.name, myActivePoke.hp > 0 ? 'active' : 'fainted')}`} alt={myActivePoke.name} className={`absolute bottom-8 left-1/2 -translate-x-1/2 max-h-full max-w-full drop-shadow-2xl z-20 ${myActivePoke.hp > 0 ? '' : 'translate-y-8 brightness-50 sepia-[.5]'}`} onError={(e) => { e.target.style.display = 'none'; }} />
            </div>

            {/* Player HP Box */}
            <div className="bg-white border-4 border-gray-900 p-3 lg:p-4 rounded-xl shadow-[6px_6px_0px_rgba(0,0,0,0.5)] w-64 md:w-80 relative z-30 md:-mt-12 self-end">
                <div className="flex justify-between items-baseline mb-1">
                    <h2 className="text-xl font-black text-gray-800 uppercase">{myActivePoke.name}</h2>
                    <span className="text-sm font-bold text-gray-600">Lv50</span>
                </div>
                {/* HP Bar Container */}
                <div className="bg-gray-800 p-1 rounded-full border-2 border-gray-700 w-full flex items-center pr-2 mb-1">
                    <span className="text-yellow-400 font-black text-xs mr-2 ml-1">HP</span>
                    <div className="w-full bg-gray-600 rounded-full h-3">
                        <div className={`${getHpColor(myActivePoke.hp, myActivePoke.max_hp)} h-3 rounded-full transition-all duration-500`} style={{ width: `${Math.max(0, (myActivePoke.hp / myActivePoke.max_hp) * 100)}%` }}></div>
                    </div>
                </div>
                <div className="text-right font-black text-gray-700">{myActivePoke.hp} / {myActivePoke.max_hp}</div>
            </div>
            
        </div>
      </div>

      {/* Dialog Box / Controls (Bottom) */}
      <div className="w-full max-w-4xl mx-auto border-8 border-gray-900 rounded-2xl bg-white flex flex-col md:flex-row overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.3)] z-40 relative">
        
        {/* Game Log Dialog Area */}
        <div className="p-4 md:p-6 flex-1 bg-gray-100 border-b-4 md:border-b-0 md:border-r-8 border-gray-900 min-h-[120px] flex flex-col justify-end">
           {gameState.battle_log.slice(-2).map((log, i) => (
             <p key={i} className="text-lg md:text-xl font-bold text-gray-800 leading-snug">
               {log.replace('> ', '').replace('>', '')}
             </p>
           ))}
           {/* Turn Status Overlay indicator */}
           {!gameState.winner && (
             <div className="mt-4 inline-block font-black text-sm p-1 px-3 border-2 border-gray-900 rounded bg-white shadow-sm self-start">
               {isMyTurn ? (myState.must_switch ? <span className="text-red-500 animate-pulse">MUST SWITCH POKEMON!</span> : <span className="text-green-600">WHAT WILL {myActivePoke.name.toUpperCase()} DO?</span>) : <span className="text-gray-500">WAITING FOR {enemyName.toUpperCase()}...</span>}
             </div>
           )}
        </div>

        {/* Action Controls */}
        <div className="bg-gray-200 w-full md:w-2/5 xl:w-[400px]">
           {myState.must_switch ? (
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
              {myActivePoke.moves.map((move, idx) => {
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
                    className={`relative p-3 border-4 border-gray-900 rounded-xl font-black text-sm md:text-sm lg:text-base transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-[0px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed ${typeColor}`}
                  >
                    {move.name.toUpperCase()}
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
    </div>
  )
}

export default App