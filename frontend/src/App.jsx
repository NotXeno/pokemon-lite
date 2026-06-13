import { useState, useEffect, useRef, useCallback } from 'react';
import { initAudio, playMenuClick, playMenuCancel, playStartGame, playDamage, playSuperEffective, playFaint, playAttackSound, setSfxVolume } from './audioUtils.js';
import Lobby from './components/Lobby.jsx';
import SelectionScreen from './components/Selection.jsx';
import Battle from './components/Battle.jsx';
import Settings from './components/Settings.jsx';
import HowToPlay from './components/HowToPlay.jsx';

function App() {
  const [pokemonList, setPokemonList] = useState([]);
  const [waitingRooms, setWaitingRooms] = useState([]);
  const [roomInput, setRoomInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [gameState, setGameState] = useState(null);
  const [showHowToPlay, setShowHowToPlay] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [bgmVolume, setBgmVolume] = useState(0.2);
  const [sfxVolumeState, setSfxVolumeState] = useState(1.0);
  const [battleSubMenu, setBattleSubMenu] = useState('main');

  const [renderedStatus, setRenderedStatus] = useState(null);
  const [showTransition, setShowTransition] = useState(false);

  const ws = useRef(null);
  const audioRef = useRef(null);
  const logEndRef = useRef(null);
  const prevLogLenRef = useRef(0);

  // --- ACTIONS ---
  const joinRoom = useCallback(() => {
    playStartGame();
    if (!roomInput || !nameInput) return alert("Fill Room & Name!");
    ws.current = new WebSocket(`ws://127.0.0.1:8000/ws/battle/${roomInput}/${nameInput.trim()}`);
    ws.current.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d.type === 'update') setGameState(d.state);
      else if (d.type === 'error') alert(d.message);
    };
  }, [roomInput, nameInput]);

  const selectPokemon = (id) => { playMenuClick(); ws.current?.send(JSON.stringify({ action: 'select_pokemon', pokemon_id: id })); };
  const removePokemon = (idx) => { playMenuCancel(); ws.current?.send(JSON.stringify({ action: 'remove_pokemon', index: idx })); };
  const setReady = () => { playStartGame(); ws.current?.send(JSON.stringify({ action: 'ready' })); };
  const sendMove = (name) => { playMenuClick(); ws.current?.send(JSON.stringify({ action: 'move', move_name: name })); };
  const switchPokemon = (idx) => { playMenuClick(); ws.current?.send(JSON.stringify({ action: 'switch', target_index: idx })); };
  const leaveRoom = () => { playMenuCancel(); ws.current?.close(); setGameState(null); prevLogLenRef.current = 0; setRenderedStatus(null); };
  const requestRematch = () => { playStartGame(); ws.current?.send(JSON.stringify({ action: 'rematch' })); };
  
  // --- EFFECTS ---
  useEffect(() => { setSfxVolume(sfxVolumeState); }, [sfxVolumeState]);

  useEffect(() => {
    if (!gameState) {
      setRenderedStatus(null);
      return;
    }

    if (gameState.status === 'battling' && renderedStatus !== 'battling') {
      setShowTransition(true);
      
      setTimeout(() => {
        setRenderedStatus('battling');
      }, 600);

      setTimeout(() => {
        setShowTransition(false);
      }, 1500);
    } else if (gameState.status !== 'battling' && !showTransition) {
      setRenderedStatus(gameState.status);
    }
  }, [gameState?.status, renderedStatus, showTransition]);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = bgmVolume;
        // Start BGM immediately when state becomes battling (same time transition starts)
        if (gameState && gameState.status === 'battling') {
            audioRef.current.play().catch(() => {});
        } else {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }
  }, [gameState?.status, bgmVolume]);

  useEffect(() => {
    const fetchRooms = () => {
      fetch('http://127.0.0.1:8000/api/rooms').then(r => r.json()).then(d => setWaitingRooms(d.data)).catch(() => {});
    };
    fetch('http://127.0.0.1:8000/api/pokemon').then(r => r.json()).then(d => setPokemonList(d.data)).catch(() => {});
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (gameState?.battle_log) {
      const currentLen = gameState.battle_log.length;
      
      // Initialize ref on first state update so we don't play old logs
      if (prevLogLenRef.current === 0 && currentLen > 0) {
        prevLogLenRef.current = currentLen;
        return;
      }

      const prevLen = prevLogLenRef.current;
      if (currentLen > prevLen) {
        const newLogs = gameState.battle_log.slice(prevLen);
        
        // Use a more stable lookup for moves
        const allMoves = Object.values(gameState.players || {})
            .flatMap(p => p?.team || [])
            .flatMap(p => p?.moves || []);

        newLogs.forEach((log, idx) => {
          if (typeof log !== 'string') return;
          
          // Delay each log's sounds slightly based on its position in the new batch
          const baseDelay = idx * 800;
          
          if (log.includes("used")) {
            const match = log.match(/used (.*?)(!| and)/);
            if (match) {
              const moveName = match[1];
              const moveObj = allMoves.find(m => m.name === moveName);
              setTimeout(() => playAttackSound(moveObj?.element_type || 'Normal', moveObj?.is_heal), baseDelay);
            }
          }
          
          if (log.includes("dealt") || log.includes("effective")) {
            setTimeout(() => playDamage(), baseDelay + 400);
          }
          
          if (log.includes("fainted")) {
            setTimeout(() => playFaint(), baseDelay + 800);
          }
        });
      }
      prevLogLenRef.current = currentLen;
    }
    
    if (logEndRef.current) {
        logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameState?.battle_log]);

  // --- RENDER LOGIC ---
  const renderScreen = () => {
    if (!gameState || !renderedStatus) {
      return <Lobby 
        roomInput={roomInput} setRoomInput={setRoomInput}
        nameInput={nameInput} setNameInput={setNameInput}
        joinRoom={joinRoom}
        waitingRooms={waitingRooms} fetchRooms={() => fetch('http://127.0.0.1:8000/api/rooms').then(r=>r.json()).then(d=>setWaitingRooms(d.data)).catch(()=>{})}
        setShowSettings={setShowSettings} setShowHowToPlay={setShowHowToPlay}
      />;
    }

    if (renderedStatus === 'waiting' || renderedStatus === 'selecting') {
      return <SelectionScreen 
        gameState={gameState} nameInput={nameInput}
        pokemonList={pokemonList}
        leaveRoom={leaveRoom} selectPokemon={selectPokemon} removePokemon={removePokemon} setReady={setReady}
        logEndRef={logEndRef} fetchPokemon={() => fetch('http://127.0.0.1:8000/api/pokemon').then(r => r.json()).then(d => setPokemonList(d.data)).catch(() => {})}
      />;
    }
    
    if (renderedStatus === 'battling') {
      return <Battle 
        gameState={gameState} nameInput={nameInput}
        battleSubMenu={battleSubMenu} setBattleSubMenu={setBattleSubMenu}
        leaveRoom={leaveRoom} requestRematch={requestRematch} sendMove={sendMove} switchPokemon={switchPokemon}
        setShowSettings={setShowSettings}
      />;
    }

    return <div>Error: Unknown game state...</div>
  };

  return (
    <>
      {renderScreen()}
      {showTransition && (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex flex-col overflow-hidden">
          <div className="h-1/2 w-full bg-black animate-swipe-top border-b-[8px] border-white flex items-end justify-center pb-8">
            <span className="text-white font-pokemon text-4xl md:text-6xl uppercase italic translate-y-1/2">V</span>
          </div>
          <div className="h-1/2 w-full bg-red-600 animate-swipe-bottom border-t-[8px] border-white flex items-start justify-center pt-8">
            <span className="text-white font-pokemon text-4xl md:text-6xl uppercase italic -translate-y-1/2">S</span>
          </div>
        </div>
      )}
      {showSettings && <Settings bgmVolume={bgmVolume} setBgmVolume={setBgmVolume} sfxVolume={sfxVolumeState} setSfxVolume={setSfxVolumeState} onClose={() => setShowSettings(false)} />}
      {showHowToPlay && <HowToPlay onClose={() => setShowHowToPlay(false)} />}
      <audio ref={audioRef} loop src="/audio/battle.mp3" />
    </>
  );
}

export default App;
