import { useState, useEffect, useRef } from 'react';

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

const getHpColor = (hp, maxHp) => {
    const p = hp / maxHp;
    if (p > 0.5) return 'bg-green-500';
    if (p > 0.2) return 'bg-yellow-400';
    return 'bg-red-500';
};

export default function Battle({ 
    gameState, nameInput, 
    battleSubMenu, setBattleSubMenu,
    leaveRoom, requestRematch, sendMove, switchPokemon,
    setShowSettings
}) {
    const isSpectator = !gameState.players || !gameState.players[nameInput]
    const myState = isSpectator ? null : gameState.players[nameInput]
    const playerNames = Object.keys(gameState.players || {})
    const enemyName = playerNames.find(name => name !== nameInput) || "Opponent"
    const enemyState = enemyName ? gameState.players[enemyName] : null
    const player1Name = playerNames[0]
    const player2Name = playerNames[1]

    const isMyTurn = !isSpectator && gameState.current_turn === nameInput
    const leftPlayer = isSpectator ? gameState.players[player1Name] : myState
    const rightPlayer = isSpectator ? gameState.players[player2Name] : enemyState
    const leftActivePoke = leftPlayer?.team?.[leftPlayer?.active_pokemon_index || 0]
    const rightActivePoke = rightPlayer?.team?.[rightPlayer?.active_pokemon_index || 0]

    const [leftAnimClass, setLeftAnimClass] = useState('');
    const [rightAnimClass, setRightAnimClass] = useState('');
    const [leftEffect, setLeftEffect] = useState(null);
    const [rightEffect, setRightEffect] = useState(null);
    
    const prevLeftHp = useRef(leftActivePoke?.hp);
    const prevRightHp = useRef(rightActivePoke?.hp);
    const prevLogLength = useRef(gameState.battle_log?.length || 0);

    useEffect(() => {
        if (leftActivePoke?.hp < prevLeftHp.current) {
            setLeftAnimClass('animate-hit');
            setTimeout(() => setLeftAnimClass(''), 400);
        } else if (leftActivePoke?.hp > prevLeftHp.current) {
            setLeftAnimClass('animate-heal');
            setTimeout(() => setLeftAnimClass(''), 800);
        }
        prevLeftHp.current = leftActivePoke?.hp;
    }, [leftActivePoke?.hp]);

    useEffect(() => {
        if (rightActivePoke?.hp < prevRightHp.current) {
            setRightAnimClass('animate-hit');
            setTimeout(() => setRightAnimClass(''), 400);
        } else if (rightActivePoke?.hp > prevRightHp.current) {
            setRightAnimClass('anim-heal');
            setTimeout(() => setRightAnimClass(''), 800);
        }
        prevRightHp.current = rightActivePoke?.hp;
    }, [rightActivePoke?.hp]);

    useEffect(() => {
        const logs = gameState.battle_log || [];
        if (logs.length > prevLogLength.current) {
            const newLogs = logs.slice(prevLogLength.current);
            const actionLog = newLogs.find(log => log.includes('used'));
            
            if (actionLog) {
                const isLeftAttacker = leftPlayer && actionLog.includes(`[${leftPlayer.player_name}]`);
                const isRightAttacker = rightPlayer && actionLog.includes(`[${rightPlayer.player_name}]`);
                
                const lowerLog = actionLog.toLowerCase();
                const isHeal = lowerLog.includes('healed');
                
                let effectImage = 'Normal.png';
                if (isHeal) effectImage = 'Recovery.png';
                else if (lowerLog.includes('ember')) effectImage = 'Ember.png';
                else if (lowerLog.includes('flamethrower')) effectImage = 'Flamethrower.png';
                else if (lowerLog.includes('thunder') || lowerLog.includes('electro') || lowerLog.includes('spark')) effectImage = 'Electric.png';
                else if (lowerLog.includes('vine') || lowerLog.includes('leaf') || lowerLog.includes('grass') || lowerLog.includes('razor')) effectImage = 'Grass.png';
                else if (lowerLog.includes('water') || lowerLog.includes('bubble') || lowerLog.includes('splash') || lowerLog.includes('aqua')) effectImage = 'Water.png';
                else if (lowerLog.includes('mud') || lowerLog.includes('rock') || lowerLog.includes('earth') || lowerLog.includes('ground')) effectImage = 'Ground.png';

                if (isLeftAttacker) {
                    setLeftAnimClass(isHeal ? 'animate-heal' : 'animate-attack-left');
                    setTimeout(() => setLeftAnimClass(''), 300);
                    if (isHeal) {
                        setLeftEffect({ image: effectImage, type: 'heal' });
                        setTimeout(() => setLeftEffect(null), 800);
                    } else {
                        setTimeout(() => {
                            setRightEffect({ image: effectImage, type: 'attack' });
                            setTimeout(() => setRightEffect(null), 800);
                        }, 200);
                    }
                } else if (isRightAttacker) {
                    setRightAnimClass(isHeal ? 'anim-heal' : 'animate-attack-right');
                    setTimeout(() => setRightAnimClass(''), 300);
                    if (isHeal) {
                        setRightEffect({ image: effectImage, type: 'heal' });
                        setTimeout(() => setRightEffect(null), 800);
                    } else {
                        setTimeout(() => {
                            setLeftEffect({ image: effectImage, type: 'attack' });
                            setTimeout(() => setLeftEffect(null), 800);
                        }, 200);
                    }
                }
            }
        }
        prevLogLength.current = logs.length;
    }, [gameState.battle_log, leftPlayer, rightPlayer]);

    return (
        <div className="h-screen bg-gradient-to-b from-blue-300 to-green-400 font-pokemon p-2 flex flex-col justify-between overflow-hidden relative">
            {/* Mid-Battle Settings Button */}
            <button 
                onClick={() => setShowSettings(true)} 
                className="absolute top-2 left-2 md:top-4 md:left-4 z-40 bg-white hover:bg-gray-100 p-2 rounded-full border-4 border-gray-900 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-px hover:translate-x-px active:shadow-none transition-all flex items-center justify-center group"
                title="Settings"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-6 md:w-6 text-gray-800 group-hover:rotate-90 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287-.947c.886.54 2.042.061 2.287-.947 1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
            </button>
            
            {gameState.winner && (
                <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white border-8 border-gray-900 rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl animate-[bounce_0.5s_ease-out]">
                        <h2 className="text-3xl font-black mb-4 text-gray-800 uppercase tracking-tight">BATTLE FINISHED!</h2>
                        <p className="text-xl font-bold text-green-600 mb-8 uppercase tracking-widest">{gameState.winner.toUpperCase()} WINS!</p>
                        <div className="flex gap-4 justify-center">
                            {isSpectator ? (
                                <button onClick={leaveRoom} className="flex-1 bg-red-500 border-4 border-gray-900 py-3 rounded-xl text-white font-black uppercase shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-px active:shadow-none transition-all">LEAVE</button>
                            ) : myState.wants_rematch ? (
                                <div className="bg-yellow-100 border-4 border-yellow-400 text-yellow-700 font-bold py-3 px-6 rounded-xl animate-pulse uppercase text-xs">Waiting for Opponent...</div>
                            ) : (
                                <>
                                    <button onClick={requestRematch} className="flex-1 bg-blue-500 border-4 border-gray-900 py-3 rounded-xl text-white font-black uppercase shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-px active:shadow-none transition-all">REMATCH</button>
                                    <button onClick={leaveRoom} className="flex-1 bg-red-500 border-4 border-gray-900 py-3 rounded-xl text-white font-black uppercase shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-y-px active:shadow-none transition-all">LEAVE</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Room Header */}
            <div className="flex justify-between items-center w-full max-w-4xl mx-auto mb-2 bg-white/50 p-2 rounded-xl border-4 border-gray-900 backdrop-blur-sm relative gap-2 shadow-sm">
                <span className="font-black text-gray-800 text-[10px] uppercase">ROOM: {gameState.game_id.toUpperCase()}</span>
                <div className="hidden lg:flex gap-2 text-[8px] items-center bg-white px-2 py-1 border-2 border-gray-900 rounded font-black uppercase shadow-inner text-gray-500">
                    <span>WTR&gt;FIR</span>|<span>FIR&gt;GRA</span>|<span>GRA&gt;WTR</span>|<span>GND&gt;ELE</span>|<span>ELE&gt;WTR</span>
                </div>
            </div>

            {/* Battle Arena View */}
            <div className="flex-1 w-full max-w-4xl mx-auto relative flex flex-col justify-center py-2 gap-4">
                {/* Enemy Pokémon (Top Right) */}
                <div className="flex justify-between items-start w-full relative mb-2">
                    <div className="bg-white border-4 border-gray-900 p-2 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,0.5)] w-40 md:w-56 lg:w-64 relative z-20 self-start">
                        <div className="flex justify-between items-baseline mb-1">
                            <h2 className="text-[10px] md:text-sm font-black text-gray-800 uppercase truncate">{rightActivePoke?.name || 'UNKNOWN'}</h2>
                            <span className="text-[8px] font-bold text-gray-600 uppercase">Lv50</span>
                        </div>
                        <div className="bg-gray-800 p-1 rounded-full border-2 border-gray-700 w-full flex items-center pr-1">
                            <span className="text-yellow-400 font-black text-[8px] mr-1 ml-1 uppercase">HP</span>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                                <div className={`${getHpColor(rightActivePoke?.hp || 0, rightActivePoke?.max_hp || 1)} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.max(0, ((rightActivePoke?.hp || 0) / (rightActivePoke?.max_hp || 1)) * 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="relative w-28 h-28 md:w-40 lg:w-48 mr-4 flex-shrink-0 mt-4 z-10">
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-black/20 rounded-[100%]"></div>
                        <img src={`/pokemon-images/${getPokeImg(rightActivePoke?.name, (rightActivePoke?.hp || 0) > 0 ? 'active' : 'fainted', 'front')}`} className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-2/3 md:w-3/4 object-contain ${(rightActivePoke?.hp || 0) > 0 ? 'animate-bounce' : 'translate-y-8 grayscale sepia'} ${rightAnimClass}`} />
                        {rightEffect && (
                            <div className={`absolute top-1/2 left-1/2 w-full h-full z-[60] pointer-events-none ${rightEffect.type === 'heal' ? 'effect-heal-anim' : 'effect-fly-from-player'}`}>
                                <img src={`/Effects/${rightEffect.image}`} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250%] h-[250%] max-w-none object-contain" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Player Pokémon (Bottom Left) */}
                <div className="flex justify-between items-end w-full relative pb-2 mt-2">
                    <div className="relative w-32 h-32 md:w-44 lg:w-52 ml-4 flex-shrink-0 -mb-2 z-50 mt-4">
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-black/30 rounded-[100%]"></div>
                        <img src={`/pokemon-images/${getPokeImg(leftActivePoke?.name, (leftActivePoke?.hp || 0) > 0 ? 'active' : 'fainted', 'back')}`} className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 md:w-[90%] object-contain drop-shadow-2xl ${(leftActivePoke?.hp || 0) > 0 ? '' : 'translate-y-8 grayscale sepia'} ${leftAnimClass}`} />
                        {leftEffect && <img src={`/Effects/${leftEffect}`} className="effect-image" />}
                    </div>
                    <div className="bg-white border-4 border-gray-900 p-2 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,0.5)] w-40 md:w-56 lg:w-64 relative z-30 self-end">
                        <div className="flex justify-between items-baseline mb-1">
                            <h2 className="text-[10px] md:text-sm font-black text-gray-800 uppercase truncate">{leftActivePoke?.name || 'UNKNOWN'}</h2>
                            <span className="text-[8px] font-bold text-gray-600 uppercase">Lv50</span>
                        </div>
                        <div className="bg-gray-800 p-1 rounded-full border-2 border-gray-700 w-full flex items-center pr-1 mb-1">
                            <span className="text-yellow-400 font-black text-[8px] mr-1 ml-1 uppercase">HP</span>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                                <div className={`${getHpColor(leftActivePoke?.hp || 0, leftActivePoke?.max_hp || 1)} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.max(0, ((leftActivePoke?.hp || 0) / (leftActivePoke?.max_hp || 1)) * 100)}%` }}></div>
                            </div>
                        </div>
                        <div className="text-right font-black text-gray-700 text-[8px]">{leftActivePoke?.hp || 0} / {leftActivePoke?.max_hp || 1}</div>
                    </div>
                </div>
            </div>

            {/* Bottom Interaction Bar */}
            <div className="w-full max-w-6xl mx-auto border-[6px] border-gray-700 rounded-xl bg-white flex flex-col md:flex-row shadow-[inset_0_0_0_4px_#3b82f6] p-1.5 z-40 relative gap-1 h-auto md:h-[160px] text-left">
                {/* Dialogue Box */}
                <div className="p-4 flex-1 bg-white border-4 border-red-500 rounded-lg shadow-[inset_0_0_0_4px_#fca5a5] flex flex-col justify-center overflow-y-auto">
                   {!gameState.winner && isMyTurn && battleSubMenu === 'main' ? (
                     <p className="text-[10px] md:text-xs text-gray-800 uppercase leading-loose font-black">What will<br/>{leftActivePoke?.name} do?</p>
                   ) : (
                     <div className="flex flex-col gap-2">
                        {gameState.battle_log.slice(-2).map((log, i) => (
                            <p key={i} className="text-[9px] md:text-[10px] text-gray-800 uppercase leading-loose font-black">{log.replace('> ', '').replace('>', '')}</p>
                        ))}
                        {!gameState.winner && !isMyTurn && (
                            <p className="text-[9px] md:text-[10px] text-gray-400 uppercase leading-loose animate-pulse mt-1 font-black">Waiting for {enemyName}...</p>
                        )}
                     </div>
                   )}
                </div>

                {/* Actions Box */}
                <div className="w-full md:w-[45%] xl:w-[500px] border-4 border-blue-500 rounded-lg shadow-[inset_0_0_0_4px_#93c5fd] bg-white overflow-hidden">
                   {isSpectator ? (
                     <div className="p-4 flex items-center justify-center h-full uppercase text-xs font-black text-gray-400">SPECTATING</div>
                   ) : myState.must_switch || battleSubMenu === 'pokemon' ? (
                     <div className="p-2 h-full flex flex-col">
                       <div className="flex justify-between items-center px-2 mb-2">
                          <span className="text-[8px] text-green-600 uppercase font-black tracking-tighter">Switch PKMN</span>
                          {!myState.must_switch && (
                            <button onClick={() => setBattleSubMenu('main')} className="bg-gray-200 text-gray-700 px-3 text-[8px] border-2 border-gray-400 uppercase font-black hover:bg-gray-300 transition-colors">BACK</button>
                          )}
                       </div>
                       <div className="flex gap-2 justify-center h-full items-center pb-2">
                         {myState.team.map((poke, idx)=> (
                            <button 
                                key={idx} 
                                onClick={() => switchPokemon(idx)} 
                                disabled={!isMyTurn || gameState.winner || idx === myState.active_pokemon_index || poke.hp <= 0} 
                                className={`flex-1 p-2 border-[3px] rounded-lg transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.1)] hover:translate-y-px active:shadow-none ${idx === myState.active_pokemon_index ? 'bg-green-100 border-green-500 opacity-50' : poke.hp <= 0 ? 'bg-red-50 border-red-300 opacity-50' : 'bg-gray-50 border-gray-400 hover:border-gray-600'}`}
                            >
                              <img src={`/pokemon-images/${getPokeImg(poke.name, 'active')}`} className="w-8 h-8 mx-auto mb-1" onError={(e) => { e.target.style.display = 'none'; }} />
                              <div className="text-[6px] uppercase font-black truncate">{poke.name}</div>
                            </button>
                         ))}
                       </div>
                     </div>
                   ) : battleSubMenu === 'moves' ? (
                    <div className="p-2 grid grid-cols-2 gap-1 h-full content-center">
                      {(leftActivePoke?.moves || []).map((move, idx) => {
                          const isLastUsed = move.name === myState?.last_used_move;
                          let typeColor = 'bg-gray-50 border-gray-400';
                          if (isLastUsed) {
                              typeColor = 'bg-gray-200 border-gray-400 text-gray-500 grayscale opacity-60';
                          } else {
                              if (move.element_type === 'Fire') typeColor = 'bg-red-50 border-red-500 text-red-700';
                              else if (move.element_type === 'Water') typeColor = 'bg-blue-50 border-blue-500 text-blue-700';
                              else if (move.element_type === 'Grass') typeColor = 'bg-green-50 border-green-500 text-green-700';
                              else if (move.element_type === 'Electric') typeColor = 'bg-yellow-50 border-yellow-500 text-yellow-700';
                              else typeColor = 'bg-orange-50 border-orange-600 text-orange-800';
                          }

                          return (
                            <button 
                                key={idx} 
                                onClick={() => sendMove(move.name)} 
                                disabled={!isMyTurn || gameState.winner || isLastUsed} 
                                className={`relative p-2 flex flex-col items-center justify-center border-[3px] rounded-lg text-[8px] font-black uppercase transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.1)] hover:translate-y-px active:shadow-none ${typeColor}`}
                            >
                                <span className="leading-tight mb-1">{move.name}</span>
                                <span className="opacity-80 text-[6px]">{move.is_heal ? `HEAL ${move.power}` : `PWR ${move.power}`}</span>
                            </button>
                          );
                      })}
                      <button onClick={() => setBattleSubMenu('main')} className="col-span-2 py-1 bg-gray-100 text-gray-600 text-[8px] rounded-lg border-[3px] border-gray-300 uppercase font-black hover:bg-gray-200 transition-colors">CANCEL</button>
                    </div>
                   ) : (
                    <div className="grid grid-cols-2 grid-rows-2 h-full gap-1 p-2">
                      <button onClick={() => setBattleSubMenu('moves')} disabled={!isMyTurn || gameState.winner} className="bg-white text-red-600 text-[10px] border-4 border-red-500 rounded-lg uppercase font-black hover:bg-red-50 transition-all shadow-[2px_2px_0px_rgba(239,68,68,0.3)] hover:translate-y-px active:shadow-none">FIGHT</button>
                      <button disabled className="bg-gray-100 text-gray-400 text-[10px] border-4 border-gray-300 rounded-lg uppercase font-black opacity-50 cursor-not-allowed">BAG</button>
                      <button onClick={() => setBattleSubMenu('pokemon')} disabled={!isMyTurn || gameState.winner} className="bg-white text-green-600 text-[10px] border-4 border-green-500 rounded-lg uppercase font-black hover:bg-green-50 transition-all shadow-[2px_2px_0px_rgba(34,197,94,0.3)] hover:translate-y-px active:shadow-none">POKÉMON</button>
                      <button onClick={leaveRoom} className="bg-white text-blue-600 text-[10px] border-4 border-blue-500 rounded-lg uppercase font-black hover:bg-blue-50 transition-all shadow-[2px_2px_0px_rgba(59,130,246,0.3)] hover:translate-y-px active:shadow-none">RUN</button>
                    </div>
                   )}
                </div>
            </div>
        </div>
    )
}
