const getPokeImg = (name, state, side = 'front') => {
    const lower = (name || '').toLowerCase();

    if (state === 'active') {
        return `Sprites/${lower}-${side}.gif`;
    }

    const fileMap = {
        'pikacu': { fainted: 'Pikachu-fainted.webp' },
        'bulba': { fainted: 'Bulbasaur-fainted.jpg' },
        'charma': { fainted: 'Charmander-fainted.jpg' },
        'skurtle': { fainted: 'Squirtle-fainted.jpg' },
        'digtil': { fainted: 'Diglett-fainted.webp' }
    };
    
    return fileMap[lower] ? fileMap[lower].fainted : `${lower}-fainted.png`;
};

export default function SelectionScreen({ 
    gameState, nameInput, 
    pokemonList, 
    leaveRoom, selectPokemon, removePokemon, setReady,
    logEndRef, fetchPokemon
}) {
    const isSpectator = !gameState.players || !gameState.players[nameInput];
    const myState = isSpectator ? null : gameState.players[nameInput];
    const playerNames = Object.keys(gameState.players || {});
    let enemyName = playerNames.find(name => name !== nameInput) || "Opponent";

    return (
        <div className="min-h-screen bg-blue-100 font-mono text-gray-900 p-4 md:p-8">
            <div className="max-w-5xl mx-auto bg-red-600 border-4 border-gray-900 rounded-t-2xl p-4 flex justify-between items-center text-white shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-blue-400 border-2 border-white animate-pulse"></div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-widest uppercase">ROOM: {gameState.game_id.toUpperCase()}</h1>
                </div>
                <button onClick={leaveRoom} className="bg-white text-red-600 hover:bg-gray-200 border-2 border-gray-900 font-bold py-1 px-4 rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all uppercase">
                    EXIT
                </button>
            </div>

            <div className="max-w-5xl mx-auto bg-white border-4 border-t-0 border-gray-900 rounded-b-2xl p-4 md:p-6 shadow-xl">
                <div className="bg-gray-100 p-4 rounded-xl border-4 border-gray-300 mb-8 text-center text-lg font-bold uppercase">
                    {gameState.status === 'waiting' ? (
                        <p className="text-blue-600 animate-pulse">Waiting for challenger...</p>
                    ) : (
                        <p className="text-green-600">{isSpectator ? "Players are choosing Pokémon!" : "Choose 3 Pokémon for your team!"}</p>
                    )}
                    <p className="text-gray-500 mt-2 text-xs drop-shadow-sm uppercase">P1: <span className="text-gray-800">{playerNames[0] || '???'}</span> VS P2: <span className="text-gray-800">{playerNames[1] || '???'}</span></p>
                </div>

                {gameState.status === 'selecting' && (
                    <div className={`flex flex-col ${isSpectator ? 'items-center' : 'lg:flex-row'} gap-8 mb-8`}>
                        <div className={`${isSpectator ? 'w-full max-w-sm' : 'lg:w-1/3'} bg-blue-50 p-6 rounded-xl border-4 border-blue-200 text-center`}>
                            <h2 className="text-sm font-black mb-4 text-blue-800 uppercase">{isSpectator ? "SPECTATING..." : `${(nameInput || '').toUpperCase()}'S TEAM (${myState?.team?.length || 0}/3)`}</h2>
                            {!isSpectator && (
                                <div className="flex flex-col gap-4 mb-6">
                                    {(myState?.team || []).map((p, idx) => (
                                        <div key={idx} className="relative bg-white p-2 rounded-xl font-bold border-4 border-gray-900 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] flex items-center gap-4">
                                            {!myState?.is_ready && (
                                                <button onClick={() => removePokemon(idx)} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-black border-2 border-gray-900 shadow-md">✕</button>
                                            )}
                                            <div className="bg-gray-100 rounded-lg p-1 border-2 border-gray-300"><img src={`/pokemon-images/${getPokeImg(p?.name || '', 'active')}`} className="h-10 w-10 md:h-12 md:w-12 object-contain" /></div>
                                            <span className="text-sm uppercase font-black">{p?.name || ''}</span>
                                        </div>
                                    ))}
                                    {[...Array(3 - (myState?.team?.length || 0))].map((_, i) => (
                                        <div key={`empty-${i}`} className="bg-blue-100/50 p-4 rounded-xl border-4 border-dashed border-blue-300 h-16 flex items-center justify-center text-blue-300 font-bold text-xs uppercase">EMPTY SLOT</div>
                                    ))}
                                </div>
                            )}
                            {!isSpectator && (myState?.team?.length || 0) === 3 && (
                                !myState?.is_ready ? (
                                    <button onClick={setReady} className="w-full bg-green-500 hover:bg-green-400 border-4 border-gray-900 text-white font-black py-4 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:-translate-x-1 uppercase">READY TO BATTLE!</button>
                                ) : (
                                    <div className="bg-yellow-100 border-4 border-yellow-400 text-yellow-700 font-bold py-3 px-2 rounded-xl animate-pulse uppercase text-xs">Waiting for {enemyName}...</div>
                                )
                            )}
                        </div>

                        {!isSpectator && !myState?.is_ready && (myState?.team?.length || 0) < 3 && (
                            <div className="lg:w-2/3">
                                {pokemonList.length === 0 ? (
                                    <div className="bg-red-50 p-8 text-center border-4 border-red-400 rounded-xl">
                                        <p className="text-red-600 font-bold mb-4 uppercase">Loading Pokémon data...</p>
                                        <button onClick={fetchPokemon} className="bg-white text-red-600 font-bold py-2 px-6 rounded-xl border-4 border-red-500 uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-px active:shadow-none">REFRESH</button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {pokemonList.map((p) => (
                                            <button key={p.id} onClick={() => selectPokemon(p.id)} className="bg-white hover:bg-gray-50 p-4 rounded-xl border-4 border-gray-900 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 transition-all flex flex-col items-center group relative overflow-hidden">
                                                <div className={`absolute top-0 right-0 w-16 h-16 opacity-20 rounded-bl-full ${p.element_type === 'Fire' ? 'bg-red-500' : p.element_type === 'Water' ? 'bg-blue-500' : p.element_type === 'Grass' ? 'bg-green-500' : p.element_type === 'Electric' ? 'bg-yellow-500' : 'bg-yellow-700'}`}></div>
                                                <div className="h-16 w-16 md:h-20 md:w-20 mb-2 flex items-center justify-center z-10"><img src={`/pokemon-images/${getPokeImg(p.name, 'active')}`} className="max-h-full max-w-full drop-shadow-md group-hover:scale-110 transition-transform" /></div>
                                                <h3 className="text-sm md:text-base font-black text-gray-800 z-10 uppercase">{p.name}</h3>
                                                <div className={`inline-block rounded px-2 mt-1 border text-[8px] font-bold text-gray-800 border-gray-900 shadow-[1px_1px_0px_rgba(0,0,0,1)] uppercase ${p.element_type === 'Fire' ? 'bg-red-400' : p.element_type === 'Water' ? 'bg-blue-400' : p.element_type === 'Grass' ? 'bg-green-400' : p.element_type === 'Electric' ? 'bg-yellow-400' : 'bg-yellow-600'}`}>{p.element_type}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                <div className="bg-gray-900 p-4 rounded-xl border-4 border-gray-400 h-32 overflow-y-auto font-mono text-white text-left shadow-inner">
                    <h3 className="font-bold mb-2 text-gray-400 border-b-2 border-gray-700 pb-1 uppercase text-xs tracking-widest">ROOM LOG</h3>
                    {(gameState.battle_log || []).map((log, i) => (
                        <p key={i} className="text-[10px] mb-1 text-gray-300">&gt; {typeof log === 'string' ? log.replace('> ', '').replace('>', '') : log}</p>
                    ))}
                    <div ref={logEndRef}/> 
                </div>
            </div>
        </div>
    )
}
