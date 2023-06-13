const level = Math.floor(Math.random() * (100 - 5)) + 5 //random num 5-100

class Pokemon {
  constructor(name, sprite, hp, type, moves) {
    this.name = name;
    this.sprite = sprite;
    this.lv = level;
    this.hp = hp;
    this.fullhp = hp;
    this.type = type;
    this.moves = moves;
  }
}

let pkmList = [
  [
    "Charizard",
    "https://img.pokemondb.net/sprites/black-white/normal/charizard.png",
    360,
    [
      ["Flamethrower", "fire", 95, 0.95],
      ["Dragon Claw", "dragon", 100, 0.95],
      ["Air slash", "fly", 75, 0.85],
      ["Slash", "normal", 70],
    ],
  ],
  [
    "Blastoise",
    "https://img.pokemondb.net/sprites/black-white/normal/blastoise.png",
    362,
    [
      ["Surf", "water", 90, 0.95],
      ["Crunch", "normal", 80, 0.95],
      ["Ice punch", "ice", 75, 0.95],
      ["Flash cannon", "steel", 80, 0.95],
    ],
  ],
  [
    "Venusaur",
    "https://img.pokemondb.net/sprites/black-white/normal/venusaur-f.png",
    364,
    [
      ["Petal Blizzard", "grass", 90, 0.95],
      ["Sludge bomb", "poison", 90, 0.95],
      ["Earthquake", "ground", 100, 0.95],
      ["Body Slam", "normal", 85, 0.95],
    ],
  ],
];

let typeMatch = {
  Charizard: [["ground"], ["water", "rock"], ["fire", "grass", "steel"]],
  Blastoise: [[""], ["grass"], ["fire", "water"]],
  Venusaur: [["poison"], ["fire", "fly", "ice", "steel"], ["grass", "water"]],
};

const getPokemon = id =>
  fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then((resp) => resp.json())

const getType = id => 
  fetch(`https://pokeapi.co/api/v2/type/${id}`).then((resp) => resp.json())

const getMove = url => fetch(url).then((resp) => resp.json())

const setMovePool = async(pool) => {
  let movePool = new Array(4)
  for(let i=0; i<4; i++) {
    let moveNum = Math.floor(Math.random() * pool.length)
    let moveInfo = await getMove(pool[moveNum].move.url)
    movePool.fill([
        moveInfo.name,
        moveInfo.type.name,
        moveInfo.power != null ? moveInfo.power : 0,
        moveInfo.accuracy != null ? moveInfo.accuracy : 100,
      ], i)
  }
  //console.log(movePool);
  return movePool
}

function calcHP(stats) {
  let iv = 31
  let ev = 0
  //Formula found on https://pokemon.fandom.com/wiki/Statistics
  return Math.floor(0.01 * (2 * stats.base_stat + iv + Math.floor(0.25 * ev)) * level) + level + 10
}

async function spawn(bool) {
  let p = await getPokemon(Math.floor(Math.random() * 150) + 1);
  let pkm = new Pokemon(
                  p.name,
                  p.sprites,
                  calcHP(p.stats[0]),
                  p.types.map(typeInfo => typeInfo.type.name),
                  await setMovePool(p.moves)
                )
  console.log(pkm);
  if (bool) {
    for (i = 0; i < 4; i++) {
      let moveText = pkm.moves[i][0]+' ('+pkm.moves[i][1]+')'+' [Pwr:'+pkm.moves[i][2]+' | Acc: '+pkm.moves[i][3]+']'
      document.getElementById("m" + i).value = moveText;
    }
  }
  return pkm;
}

async function createPokes() {
  let pk1 = await spawn(true);
  s1 = document.createElement("img");
  s1.src = pk1.sprite.versions['generation-v']['black-white'].animated['back_default'];
  document.getElementById("pk1").appendChild(s1);
  document.getElementById("hp1").innerHTML =
    "<p>HP: " + pk1.hp + "/" + pk1.fullhp + "<br>LV: " + pk1.lv + "</p>";

  let pk2 = await spawn(false);
  s2 = document.createElement("img");
  s2.src = pk2.sprite.versions['generation-v']['black-white'].animated['front_default'];
  document.getElementById("pk2").appendChild(s2);
  document.getElementById("hp2").innerHTML =
    "<p>HP: " + pk2.hp + "/" + pk2.fullhp + "<br>LV: " + pk2.lv + "</p>";

  for (i = 0; i < 4; i++) {
    let btn = document.getElementById("m" + i);
    let move = pk1.moves[i];
  
    function addHandler(btn, move, pk1, pk2) {
      btn.addEventListener("click", function (e) {
        attack(move, pk1, pk2, "hp2", "");
        setTimeout(
          attack,
          2000,
          pk2.moves[Math.floor(Math.random() * 3)],
          pk2,
          pk1,
          "hp1",
          "Foe "
        );
      });
    }
    addHandler(btn, move, pk1, pk2);
  }
}

function attack(move, attacker, receiver, hp, owner) {
  document.getElementById("comment").innerHTML =
    "<p>" + owner + attacker.name + " used " + move[0] + "!</p>";
  if (Math.random() < move[3]) { //check accuracy
    let power = (move[2] += Math.floor(Math.random() * 10));
    let rtype = typeMatch[receiver.name];
    let mtype = move[1];
    let scale = 1;

    for (i = 0; i < rtype.length; i++) {
      if (rtype[i].includes(mtype)) {
        switch (i) {
          case 0:
            scale = 0;
            setTimeout(function () {
              document.getElementById("comment").innerHTML =
                "<p>It had no effect!</p>";
            }, 1000);
            break;
          case 1:
            scale = 2;
            setTimeout(function () {
              document.getElementById("comment").innerHTML =
                "<p>It was super effective!</p>";
            }, 1000);
            break;
          case 2:
            scale = 0.5;
            setTimeout(function () {
              document.getElementById("comment").innerHTML =
                "<p>It was not very effective!</p>";
            }, 1000);
            break;
        }
        break;
      }
    }
    power *= scale;
    receiver.hp -= Math.floor(power);
    document.getElementById(hp).innerHTML =
      "<p>HP: " + receiver.hp + "/" + receiver.fullhp + "</p>";
  } else {
    setTimeout(function () {
      document.getElementById("comment").innerHTML = "<p>Attack missed!</p>";
    });
  }
  checkWinner(hp);
}

function checkWinner(hp) {
  let f = pk1.hp <= 0 ? pk1 : pk2.hp <= 0 ? pk2 : false;
  if (f != false) {
    alert("GAME OVER: " + f.name + " fainted!");
    document.getElementById(hp).innerHTML = "<p>HP: 0/" + f.fullhp + "</p>";
    setTimeout(function () {
      location.reload();
    }, 1500);
  }
}

createPokes()