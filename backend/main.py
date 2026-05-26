from flask import Flask, jsonify
from flask_cors import CORS
from flask_sock import Sock
from pydantic import BaseModel
from typing import Dict, List
import json
import copy
import redis
import pika
import threading

app = Flask (__name__)
CORS(app)
sock = Sock(app)

# Redis Setup (for storing game states and pub/sub)
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

def get_game_state(game_id: str):
    data = redis_client.get(f"room:{game_id}")
    if data: return GameState.model_validate_json(data)
    return None

def save_game_state(game):
    redis_client.set(f"room:{game.game_id}", game.model_dump_json())

def delete_game_state(game_id: str):
    redis_client.delete(f"room:{game_id}")

# RabbitMQ Setup (for handling game actions)
def publish_update(game_id: str, message: dict):
    """Function to send messages to RabbitMQ when there's data exchange"""
    try: 
        connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
        channel = connection.channel()
        channel.exchange_declare(exchange = 'battle_updates', exchange_type='fanout')
        payLoad = {"game_id": game_id, "message": message}
        channel.basic_publish(exchange='battle_updates', routing_key='', body=json.dumps(payLoad))
        connection.close()
    except Exception as e:
        print(f"RabbitMQ publish error: {e}")

def consume_rabbitmq():
    """Runs on the background thread to receive message from RabbitMQ and broadcast to players"""
    try:
        connection= pika.BlockingConnection(pika.ConnectionParameters('localhost'))
        channel = connection.channel()
        channel.exchange_declare(exchange='battle_updates', exchange_type='fanout')
        result = channel.queue_declare(queue='', exclusive=True)
        queue_name = result.method.queue
        channel.queue_bind(exchange='battle_updates', queue=queue_name)

        def callback(ch, method, properties, body):
            data = json.loads(body)
            game_id = data.get("game_id")
            message = data.get("message")
            manager.broadcast(game_id, message)

        channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
        channel.start_consuming()
    
    except Exception as e:
        print(f"RabbitMQ consumer error: {e}")

# Start RabbitMQ consumer in a separate thread
threading.Thread(target=consume_rabbitmq, daemon=True).start()



# --- Models ---
class Move(BaseModel): 
    name : str
    power : int
    element_type : str
    is_heal : bool = False

class Pokemon(BaseModel): 
    id : int
    name : str
    hp : int
    max_hp : int
    attack : int
    speed : int
    element_type : str
    moves : List[Move]

class PlayerState(BaseModel): 
    player_name : str
    team : List[Pokemon] = []
    active_pokemon_index : int = 0
    is_ready : bool = False
    must_switch : bool = False
    last_used_move : str = ""

class GameState(BaseModel): 
    game_id : str
    players : Dict[str, PlayerState] = {}
    current_turn : str = ""
    winner : str | None = None
    status : str = "waiting" # waiting, in_progress, finished
    battle_log : List[str] = []

# -- Game Data (Static) --
POKEMON_DB : Dict[int, Pokemon] = {
    1: Pokemon(
        id=1, 
        name="Pikacu", 
        hp=250, 
        max_hp=250, 
        attack=25, 
        speed=80, 
        element_type="Electric", 
        moves=[
            Move(name="Thunder Shock", power=40, element_type="Electric"), 
            Move(name="Quick Attack", power=30, element_type="Normal"), 
            Move(name="Electro Ball", power=50, element_type="Electric"), 
            Move(name="Rest", power=60, element_type="Normal", is_heal=True)]),

    2: Pokemon(
        id=2, 
        name="Bulba", 
        hp=300, 
        max_hp=300, 
        attack=20, 
        speed=40, 
        element_type="Grass", 
        moves=[
            Move(name="Vine Whip", power=40, element_type="Grass"), 
            Move(name="Tackle", power=20, element_type="Normal"), 
            Move(name="Take Down", power=35, element_type="Normal"), 
            Move(name="Synthesis", power=60, element_type="Grass", is_heal=True)]
    ),

    3: Pokemon(
        id=3, 
        name="Charma", 
        hp=280, 
        max_hp=280, 
        attack=22, 
        speed=60, 
        element_type="Fire", 
        moves=[
            Move(name="Ember", power=40, element_type="Fire"), 
            Move(name="Scratch", power=25, element_type="Normal"), 
            Move(name="Flamethrower", power=50, element_type="Fire"), 
            Move(name="Morning Sun", power=60, element_type="Normal", is_heal=True)]
    ),

    4: Pokemon(
        id=4, 
        name="Skurtle", 
        hp=320, 
        max_hp=320, 
        attack=18, 
        speed=50, 
        element_type="Water", 
        moves=[
            Move(name="Water Gun", power=40, element_type="Water"), 
            Move(name="Tackle", power=20, element_type="Normal"), 
            Move(name="Bite", power=30, element_type="Water"), 
            Move(name="Aqua Ring", power=60, element_type="Normal", is_heal=True)]
    ),

    5: Pokemon(
        id=5, 
        name="Digtil", 
        hp=240, 
        max_hp=240, 
        attack=30, 
        speed=70, 
        element_type="Ground", 
        moves=[
            Move(name="Mud Slap", power=40, element_type="Ground"), 
            Move(name="Slash", power=30, element_type="Normal"), 
            Move(name="Rock Smash", power=35, element_type="Ground"), 
            Move(name="Rest", power=60, element_type="Normal", is_heal=True)]
    )
}

TYPE_CHART = {
    "Water" : {"Fire" : 2.0, "Electric" : 0.5},
    "Fire" : {"Grass" : 2.0, "Water" : 0.5},
    "Grass" : {"Water" : 2.0, "Fire" : 0.5},
    "Ground" : {"Electric" : 2.0, "Grass" : 0.5},
    "Electric" : {"Water" : 2.0, "Ground" : 0.5},
    "Normal" : {} # No advantages or disadvantages
}

# Calculating damage
def calculate_damage(attacker: Pokemon, defender: Pokemon, move: Move):
    if move.is_heal: return 0, 1.0
    base_damage = attacker.attack + move.power
    multiplier = 1.0
    if move.element_type in TYPE_CHART and defender.element_type in TYPE_CHART[move.element_type]: 
        multiplier = TYPE_CHART[move.element_type][defender.element_type]
    return int(base_damage * multiplier), multiplier

@app.route("/api/pokemon")
def get_all_pokemon() : 
    return jsonify({"data" : [p.model_dump() for p in POKEMON_DB.values()]})

# --- Websocket Connection Manager & Game Logic ---
class ConnectionManager: 
    def __init__(self):
        self.active_games = {}

    def connect (self, ws, game_id: str):
        if game_id not in self.active_games: 
            self.active_games[game_id] = []
        self.active_games[game_id].append(ws)

    def disconnect(self, ws, game_id: str):
        if game_id in self.active_games and ws in self.active_games[game_id]:
            self.active_games[game_id].remove(ws)
            if len(self.active_games[game_id]) == 0:
                del self.active_games[game_id]
        

    def broadcast(self, game_id: str, message: dict):
        if game_id in self.active_games: 
            for connection in self.active_games[game_id]: 
                try : 
                    connection.send(json.dumps(message))
                except : 
                    pass

manager = ConnectionManager()

# Websocket Endpoint
@sock.route("/ws/battle/<game_id>/<player_name>")

def battle_websocket(ws, game_id, player_name):
    manager.connect(ws, game_id)

    game = get_game_state(game_id)
    if not game:
        game = GameState(game_id=game_id)
        save_game_state(game)

    if player_name not in game.players:
        if len(game.players) >= 2:
            ws.send(json.dumps({"type" : "error", "message" : "Room is full"}))
            manager.disconnect(ws, game_id)
            return

        game.players[player_name] = PlayerState(player_name=player_name)
        game.battle_log.append(f"{player_name} has joined the room!")

        save_game_state(game)

    if len(game.players) == 2 and game.status == "waiting":
        game.status = "selecting"
        game.battle_log.append(f"> Both players have joined! Please select your Pokemon.")

        save_game_state(game)

    publish_update(game_id, {"type" : "update", "state" : game.model_dump()})
    
    try : 
        while True : 
            raw_data = ws.receive()
            if raw_data is None: 
                break

            data = json.loads(raw_data)
            action = data.get("action")
            game = get_game_state(game_id)

            if not game : continue

            if action == "select_pokemon" and game.status == "selecting": 
                poke_id = data.get("pokemon_id")
                player = game.players[player_name]

                if poke_id in POKEMON_DB and len(player.team) < 3 :
                    new_poke = copy.deepcopy(POKEMON_DB[poke_id])
                    player.team.append(new_poke)
                    game.battle_log.append(f"> [{player_name}] added ??? Pokemon to the team!")
                    manager.broadcast(game_id, {"type": "update", "state": game.model_dump()})
            
            elif action == "remove_pokemon" and game.status == "selecting":
                index_to_remove = data.get("index")
                player = game.players[player_name]

                if 0 <= index_to_remove < len(player.team) and not player.is_ready:
                    removed_poke = player.team.pop(index_to_remove)
                    game.battle_log.append(f"> [{player_name}] removed ??? Pokemon from the team!")

                    save_game_state(game)
                    publish_update(game_id, {"type": "update", "state": game.model_dump()})

            # Ready action
            elif action == "ready" and game.status == "selecting":
                player = game.players[player_name]

                if len(player.team) == 3:
                    player.is_ready = True 
                    game.battle_log.append(f"> [{player_name}] is ready to battle!")

                    all_ready = all (p.is_ready for p in game.players.values())
                    if len (game.players) == 2 and all_ready: 
                        game.status = "battling"
                        p_names = list(game.players.keys())
                        p1 = game.players[p_names[0]]
                        p2 = game.players[p_names[1]]

                        if p1.team[0].speed >= p2.team[0].speed: 
                            game.current_turn = p1.player_name
                        else: 
                            game.current_turn = p2.player_name

                        game.battle_log.append(f"> BATTLE STARTED! [{game.current_turn}] has higher speed and goes first.")

                    manager.broadcast(game_id, {"type": "update", "state" : game.model_dump()})

            # Switch action
            elif action == "switch" and game.status == "battling":
                target_idx  = data.get("target_index")

                if game.winner : continue
                if game.current_turn != player_name : 
                    ws.send(json.dumps({"type" : "error", "message" : "It's not your turn yet!"}))
                    continue

                # Make sure index valid, pokemon alive, and not switching to same pokemon
                player = game.players [player_name]
                if 0 <= target_idx < len(player.team) and target_idx != player.active_pokemon_index : 
                    target_poke = player.team[target_idx]
                    
                    if target_poke.hp > 0:
                        player.active_pokemon_index = target_idx
                        game.battle_log.append(f">[{player_name}] switched to {target_poke.name}!")

                        # Resetting move cooldown everytime changing pokemon
                        player.last_used_move = ""

                        # If player switched because their pokemon fainted, they can attack immediately without waiting for next turn
                        if player.must_switch:
                            player.must_switch = False
                        
                        else: 
                            # Changing turn
                            defender_name = next(name for name in game.players.keys() if name != player_name)
                            game.current_turn = defender_name
                        
                        manager.broadcast(game_id, {"type": "update", "state": game.model_dump()})

             # Attack action
            elif action == "move" and game.status == "battling":
                move_name = data.get("move_name")

                if game.winner: continue
                if game.current_turn != player_name: 
                    ws.send(json.dumps({"type" : "error", "message" : "It's not your turn yet!"}))
                    continue

                attacker = game.players[player_name]

                if attacker.must_switch:
                    ws.send(json.dumps({"type" : "error", "message" : "You must switch your fainted Pokemon first!"}))
                    continue

                if move_name == attacker.last_used_move:
                    ws.send(json.dumps({"type" : "error", "message" : f"You cannot use {move_name} twice in a row!"}))
                    continue

                defender_name = next(name for name in game.players.keys() if name != player_name)
                defender = game.players[defender_name]

                # Taking pokemon that's currently active in arena
                att_poke = attacker.team[attacker.active_pokemon_index]
                def_poke = defender.team[defender.active_pokemon_index]

                selected_move = next ((m for m in att_poke.moves if m.name == move_name), None)
                if not selected_move: continue

                # Saving move to memory so it can't be chosen the next turn
                attacker.last_used_move = selected_move.name

                if selected_move.is_heal:
                    att_poke.hp = min(att_poke.max_hp, att_poke.hp + selected_move.power)
                    game.battle_log.append(f"> [{attacker.player_name}] used {selected_move.name} and healed for {selected_move.power} HP!")
                else :
                    damage, multiplier = calculate_damage(att_poke, def_poke, selected_move)
                    def_poke.hp = max(0, def_poke.hp - damage)
                    game.battle_log.append(f"> [{attacker.player_name}] used {selected_move.name}! It dealt {damage} damage!")

                    if multiplier > 1.0 : 
                        game.battle_log.append(f"> It's super effective!")
                    elif multiplier < 1.0 :
                        game.battle_log.append(f"> It's not very effective...")

                # Check if defender fainted
                if def_poke.hp <= 0:
                    game.battle_log.append(f"> [{defender.player_name}]'s {def_poke.name} fainted!")

                    # Check if defender has any remaining pokemon
                    next_alive_idx = next((i for i, p in enumerate(defender.team) if p.hp > 0), None)

                    if next_alive_idx is None:
                        # All fainted
                        game.winner = attacker.player_name
                        game.battle_log.append(f">All of [{defender.player_name}]'s Pokemon fainted! [{attacker.player_name}] WINS!")
                        game.current_turn = ""

                    else: 
                        # If there's another pokemon that alive, they can switch it
                        defender.must_switch = True
                        game.current_turn = defender.player_name
                        game.battle_log.append(f"> [{defender.player_name}] must choose a replacement Pokemon!")
                else : 
                    game.current_turn = defender.player_name
            
            save_game_state(game)
            publish_update(game_id, {"type": "update", "state": game.model_dump()})

    except Exception as e: 
        print(f"Websocket Error: {e}")
        pass

    finally: 
        manager.disconnect(ws, game_id)

        # Gain newest data from Redis to processed when there's output
        game = get_game_state(game_id)
        if game:
            if player_name in game.players:
                del game.players[player_name]
                game.battle_log.append(f">[{player_name}] left the room.")

                if len(game.players) == 0:
                    delete_game_state(game_id)
                else:
                    game.status = "waiting"
                    game.winner = None
                    game.current_turn = ""
                    for p in game.players.values():
                        p.is_ready = False
                        p.team = []
                        p.active_pokemon_index = 0
                        p.must_switch = False
                        p.last_used_move = ""

                    save_game_state(game)
                    publish_update(game_id, {"type": "update", "state": game.model_dump()})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)