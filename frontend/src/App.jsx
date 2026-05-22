import {useState, useEffect, useRef} from 'react'

function App() {
  const [pokemonList, setPokemonList] = useState([])
  const [roomInput, setRoomInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [gameState, setGameState] = useState(null)

  const ws = useRef(null)

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/pokemon')
      .then(res => res.json())
      .then(data => setPokemonList(data.data))
  }, [])

  // Fungsi Masuk Room Custom
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

  // Send Pokemon Choice Function
  const selectPokemon = (pokeId) => {
    if (ws.current) {
      ws.current.send(JSON.stringify({action: 'select_pokemon', pokemon_id: pokeId}))
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

  // --- SCREEN 1: LOGIN LOBBY ---
  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center"> 
        <div className="max-w-md w-full bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-lg text-center"> 
          <h1 className ="text-4xl font-bold mb-8 text-yellow-400">Pokemon-Lite</h1>
          <p className="mb-6 text-gray-300">Make or enter custom room to battle!</p>
          
          <input 
            type="text" 
            placeholder="Room ID (Example : myroom123)" 
            value={roomInput} 
            onChange={(e) => setRoomInput(e.target.value.toLowerCase().replace(/\s+/g, '-'))} 
            className="text-black font-semibold p-3 rounded w-full mb-4 text-center outline-none focus:ring-2 focus:ring-blue-500" 
          />

          <input 
            type="text" 
            placeholder="Player Name (Example: Alvino)" 
            value={nameInput} 
            onChange={(e) => setNameInput(e.target.value)} 
            className="text-black font-semibold p-3 rounded w-full mb-6 text-center outline-none focus:ring-2 focus:ring-blue-500" 
          />

          <button onClick={joinRoom} className="bg-blue-600 hover:bg-blue-500 font-bold py-3 px-4 rounded w-full transition-colors">
            Join / Create Room
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
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-yellow-400">Room: {gameState.game_id}</h1>
        
        <div className="flex justify-center mb-8">
          <button onClick={leaveRoom} className="bg-red-600 hover:bg-red-500 font-bold py-2 px-6 rounded-lg text-sm shadow-lg transition-colors">
            &larr; Exit Room
          </button>
        </div>

        {/* Status Bar */}
        <div className="max-w-3xl mx-auto bg-gray-800 p-4 rounded-lg mb-8 text-center border border-gray-700">
          {gameState.status === 'waiting' ? (
            <p className="text-xl text-yellow-300 animate-pulse">Waiting for the second player to join...</p>
          ) : (
            <p className="text-xl text-green-400">Choose 3 Pokemon for your team! </p>
          )}
          <p className="text-gray-400 mt-2">Players in the room: <span className="font-bold text-white">{nameInput}</span> vs <span className="font-bold text-white">{enemyName || '???'}</span></p>
        </div>

        {/* Choosing Pokemon */}
        {gameState.status === 'selecting' && (
          <div className="max-w-4xl mx-auto">
            {/* Slot Tim Kita */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-600 mb-8 text-center">
              <h2 className="text-xl mb-4">My Team ({myState.team.length}/3)</h2>
              <div className="flex justify-center gap-4 mb-6">
                {myState.team.map((p, idx) => (
                  <div key={idx} className="bg-gray-700 p-3 rounded text-green-400 font-bold border border-green-500">{p.name}</div>
                ))}
              </div>
              
              {myState.team.length === 3 ? (
                !myState.is_ready ? (
                  <button onClick={setReady} className="bg-green-600 hover:bg-green-500 font-bold py-3 px-8 rounded-lg text-lg animate-bounce">Click if Ready to Battle!</button>
                ) : (
                  <p className="text-yellow-400 font-bold animate-pulse">Waiting {enemyName} to choose...</p>
                )
              ) : null}
            </div>

            {/* Pokemon Selection List */}
            {!myState.is_ready && myState.team.length < 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {pokemonList.map((p) => (
                  <button key={p.id} onClick={() => selectPokemon(p.id)} className="bg-gray-800 hover:bg-gray-700 p-4 rounded-xl border border-gray-600 text-center transition-all hover:scale-105">
                    <h3 className="text-xl font-bold text-yellow-300">{p.name}</h3>
                    <p className="text-sm text-gray-400">Type: {p.element_type}</p>
                    <p className="text-sm text-gray-400 mb-2">HP: {p.hp} | Spd: {p.speed}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Global Chat / Battle Log Preview */}
        <div className="max-w-3xl mx-auto bg-black p-4 rounded border border-gray-700 h-48 overflow-y-auto">
          <h3 className="font-bold mb-4 text-gray-400 sticky top-0 bg-black pb-2 border-b border-gray-800">Room Log:</h3>
          {gameState.battle_log.map((log, i) => (
            <p key={i} className="text-sm mb-1 text-gray-300">{log}</p>
          ))}
        </div>
      </div>
    )
  }

  // --- SCREEN 3: BATTLE ARENA ---
  const isMyTurn = gameState.current_turn === nameInput
  const myActivePoke = myState.team[myState.active_pokemon_index]
  const enemyActivePoke = enemyState.team[enemyState.active_pokemon_index]

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold text-center mb-2 text-yellow-400">BATTLE ARENA</h1>
      <p className="text-center text-gray-400 mb-8 text-sm">Room: {gameState.game_id}</p>
      <div className="flex justify-center mb-8">
          <button onClick={leaveRoom} className="bg-red-600 hover:bg-red-500 font-bold py-2 px-6 rounded-lg text-sm shadow-lg transition-colors">
            &larr; Exit Room
          </button>
      </div>

      {gameState.winner ? (
        <div className="text-center text-3xl font-bold text-green-400 mb-8 bg-gray-800 p-4 rounded">
          Battle Done! {gameState.winner} WINS!
        </div>
      ) : (
        <div className="text-center text-xl mb-8">
          Status: {isMyTurn ? (
            myState.must_switch ? (
              <span className="font-bold text-orange-400 animate-pulse">Your Pokemon fainted! Choose a replacement!</span>
            ) : (
              <span className="font-bold text-green-400 animate-pulse">YOUR TURN! Choose an attack!</span>
            )
          ) : (
            <span className="font-bold text-red-400">Waiting for {enemyName} to move...</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className={`bg-gray-800 p-6 rounded-xl border-2 ${isMyTurn ? (myState.must_switch ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]') : 'border-gray-600'} transition-all flex flex-col`}>
          <h2 className="text-2xl font-bold mb-2">[{nameInput}] {myActivePoke.name}</h2>
          <p className="text-sm text-gray-400 mb-4">HP: {myActivePoke.hp} / {myActivePoke.max_hp}</p>
          <div className="w-full bg-gray-700 rounded-full h-4 mb-6">
            <div className="bg-green-500 h-4 rounded-full transition-all duration-500" style={{ width: `${(myActivePoke.hp / myActivePoke.max_hp) * 100}%` }}></div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {myActivePoke.moves.map((move, idx) => (
              <button 
                key={idx} 
                onClick={() => sendMove(move.name)}
                disabled={!isMyTurn || gameState.winner || myState.must_switch || move.name === myState.last_used_move}
                className={`text-sm font-semibold py-3 px-2 rounded transition-colors ${move.name === myState.last_used_move ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500'}`}
              >
                {move.name} ({move.power}) {move.name === myState.last_used_move && '⏳'}
              </button>
            ))}
          </div>

          <div className={`mt-auto border-t border-gray-600 pt-4 ${myState.must_switch ? 'animate-pulse bg-red-900/30 p-2 rounded mt-4' : ''}`}>
            <h3 className={`text-sm mb-2 ${myState.must_switch ? 'text-orange-300 font-bold' : 'text-gray-400'}`}>
              My Team (Click to Change - Takes Turn) : 
            </h3>
            <div className="flex gap-2">
              {myState.team.map((poke, idx)=> (
                <button
                  key={idx}
                  onClick={() => switchPokemon(idx)}
                  disabled={!isMyTurn || gameState.winner || idx === myState.active_pokemon_index || poke.hp <= 0}
                  className={`flex-1 text-xs p-2 rounded border ${idx === myState.active_pokemon_index ? 'bg-green-800 border-green-500 text-white' : poke.hp <= 0 ? 'bg-red-900 border-red-700 text-gray-400' : 'bg-gray-700 border-gray-500 hover:bg-gray-600 text-gray-200'}`}
                >
                  {poke.name} <br/> ({poke.hp} HP)
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border-2 border-red-900 opacity-90">
          <h2 className="text-2xl font-bold mb-2 text-red-300">[{enemyName}]: {enemyActivePoke.name}</h2>
          <p className="text-sm text-gray-400 mb-4">HP: {enemyActivePoke.hp} / {enemyActivePoke.max_hp}</p>
          <div className="w-full bg-gray-700 rounded-full h-4 mb-6">
            <div className="bg-red-500 h-4 rounded-full transition-all duration-500" style={{ width: `${(enemyActivePoke.hp / enemyActivePoke.max_hp) * 100}%` }}></div>
          </div>

          <div className="mt-auto border-t border-gray-600 pt-4">
            <h3 className="text-sm text-gray-400 mb-2">Enemy Status Team:</h3>
            <div className="flex gap-2">
              {enemyState.team.map((poke, idx) => (
                <div key={idx} className={`flex-1 text-xs p-2 rounded text-center border ${idx === enemyState.active_pokemon_index ? 'bg-red-900 border-red-500 text-white' : poke.hp <= 0 ? 'bg-gray-900 border-gray-800 text-gray-600' : 'bg-gray-700 border-gray-600 text-gray-300'}`}>
                  {poke.hp <= 0 ? 'Mati' : 'Hidup'}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 max-w-4xl mx-auto bg-black p-4 rounded border border-gray-700 h-48 overflow-y-auto">
        <h3 className="font-bold mb-4 text-gray-400 sticky top-0 bg-black pb-2 border-b border-gray-800">Battle Log:</h3>
        {gameState.battle_log.map((log, i) => (
          <p key={i} className={`text-sm mb-1 
            ${log.includes('fainted') || log.includes('WINS') ? 'text-yellow-400 font-bold' : ''} 
            ${log.includes('super effective') ? 'text-green-400 font-bold' : ''}
            ${log.includes('not very effective') ? 'text-gray-500' : ''}
            ${log.includes('switched to') ? 'text-blue-300 italic' : ''}
            ${!log.includes('fainted') && !log.includes('WINS') && !log.includes('effective') && !log.includes('switched') ? 'text-gray-300' : ''}
          `}>
            {log}
          </p>
        ))}
      </div>
    </div>
  )
}

export default App