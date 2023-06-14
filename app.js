const level = Math.floor(Math.random() * (99 - 5)) + 5 //both level (5-99)
const ev = 0 //effort values, since both are wild pokemon their ev will be zero
const comment = document.getElementById("comment")

class Pokemon {
  constructor(name, sprite, hp, stats, type, moves, height, weight) {
    this.name = name;
    this.sprite = sprite;
    this.lv = level;
    this.hp = hp;
    this.fullhp = hp;
    this.stats = stats;
    this.type = type;
    this.moveset = moves;
    this.height = height;
    this.weight = weight;
  }
}

const getPokemon = id =>
  fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then((resp) => resp.json())

const getMove = url => fetch(url).then((resp) => resp.json())

const setMovePool = async(pool) => {
  let movePool = new Array(4)
  let moveNum = new Set()
  while(moveNum.size < 4) {
    //add random numbers to an unique collection(set)
    moveNum.add(Math.floor(Math.random() * pool.length) + 1)
  }
  for(let i=0; i<4; i++) {
    let moveInfo = await getMove(pool[Array.from(moveNum)[i]].move.url)
    movePool.fill([
        moveInfo.name,
        moveInfo.type.name,
        moveInfo.damage_class.name,
        moveInfo.power != null ? moveInfo.power : 0,
        moveInfo.accuracy != null ? moveInfo.accuracy : 100,
      ], i)
  }
  //console.log(movePool);
  return movePool
}

const getType = async(types) => {
  let test = new Array(1,1)
  let typeMatch = new Array()
  for(let i=0; i<types.length; i++) {
    let data = await fetch(types[i].type.url).then(resp => resp.json())
    typeMatch.push([data.name,[
        data.damage_relations.no_damage_from.map(names => names.name),
        data.damage_relations.half_damage_from.map(names => names.name),
        data.damage_relations.double_damage_from.map(names => names.name)
      ]
    ])
  }
  //console.log(typeMatch);
  return typeMatch
}

function calcHP(stat) {
  let iv = Math.floor(Math.random() * 31)
  //Formula found on https://pokemon.fandom.com/wiki/Statistics
  return Math.floor(0.01 * (2 * stat.base_stat + iv + Math.floor(0.25 * ev)) * level) + level + 10
}

function calcStat(stats) {
  let iv = Math.floor(Math.random() * 31)
  let pokeStats = new Array()
  for(let i=1; i<stats.length; i++){
    //Formula found on https://pokemon.fandom.com/wiki/Statistics
    pokeStats[stats[i].stat.name] = ((Math.floor(0.01 * (2 * stats[i].base_stat + iv + Math.floor(0.25 * ev)) * level) + 5)) //* Nature
  }
  return pokeStats
}

function calcDmg(mov,ata,rec,bon) {
  let A = level //attacker's Level
  let B = 0 //attacker's Attack or Special
  let C = mov[3] //attack Power
  let D = 0 //defender's Defense or Special
  let X = 1 //same-type attack bonus (1 or 1.5)
  let Y = bon //type modifiers (40, 20, 10, 5, 2.5, or 0)
  let Z = Math.floor(Math.random() * (255 - 217)) + 217 //a random number between 217 and 255
  switch(mov[2]) {
    case 'physical': B = ata.stats['attack']; D = rec.stats['defense']; break
    case 'special': B = ata.stats['special-attack']; D = rec.stats['special-defense']; break
  }
  let stab = ata.type.map(typeInfo => typeInfo[0])
  if (stab.includes(mov[1])) {
    X = 1.5
  }
  let dmg = 0;
  if(mov[2] !== 'status') {
    //Formula found on https://www.math.miami.edu/~jam/azure/compendium/battdam.htm
    dmg = Math.floor(((((((((2*A/5+2)*B*C)/D)/50)+2)*X)*Y/10)*Z)/255)
  }
  console.log(dmg);
  return dmg
}

async function spawn(bool, id = Math.floor(Math.random() * 640) + 1) {
  let p = await getPokemon(id)
  let pkm = new Pokemon(
                  p.name,
                  p.sprites,
                  calcHP(p.stats[0]),
                  calcStat(p.stats),
                  await getType(p.types),
                  await setMovePool(p.moves),
                  p.height,
                  p.weight
                )
  //console.log(pkm);
  if (bool) {
    for (i = 0; i < 4; i++) {
      let moveText = pkm.moveset[i][0]+' ('+pkm.moveset[i][1]+')'
        +' [Pwr:'+pkm.moveset[i][3]+' | Acc: '+pkm.moveset[i][4]+']'
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
  document.getElementById("if1").innerHTML = "<p>" + pk1.name + " LV:" + pk1.lv + "</p>"
  document.getElementById("hp1").innerHTML = "<p>HP: " + pk1.hp + "/" + pk1.fullhp + "</p>"

  let pk2 = await spawn(false);
  s2 = document.createElement("img");
  s2.src = pk2.sprite.versions['generation-v']['black-white'].animated['front_default'];
  document.getElementById("pk2").appendChild(s2);
  document.getElementById("if2").innerHTML = "<p>" + pk2.name + " LV:" + pk2.lv + "</p>"
  document.getElementById("hp2").innerHTML = "<p>HP: " + pk2.hp + "/" + pk2.fullhp + "</p>"

  for (i = 0; i < 4; i++) {
    let btn = document.getElementById("m" + i);
    let move = pk1.moveset[i];
  
    function addHandler(btn, move, pk1, pk2) {
      btn.addEventListener("click", function (e) {
        attack(move, pk1, pk2, "hp2", "");
        setTimeout(
          attack,
          2000,
          pk2.moveset[Math.floor(Math.random() * 3)],
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
  comment.innerHTML += "<p>" + owner + attacker.name + " used " + move[0] + "!</p>";
  if (Math.random() <= (move[4]/100)) { //check accuracy
    let rtype = receiver.type;
    let mtype = move[1];
    let scale = 1;
    
    //check type effectiveness (attack type x enemy type)
    for (i = 0; i < rtype.length; i++) {
      for (x = 0; x < rtype[i][1].length; x++) {
        if (rtype[i][1][x].includes(mtype)) {
          switch (x) {
            case 0: scale = scale * 0; break;
            case 1: scale = scale * 0.5; break;
            case 2: scale = scale * 2; break;
          }
        }
      }
    }
    scale = scale * 10;
    if (scale === 0){
      setTimeout(function () {
        comment.innerHTML += "<p>It had no effect!</p>";
      }, 1000);
    } else if(scale < 10) {
      setTimeout(function () {
        comment.innerHTML += "<p>It was not very effective!</p>";
      }, 1000);
    } else if(scale > 10){
      setTimeout(function () {
        comment.innerHTML += "<p>It was super effective!</p>";
      }, 1000);
    }
    receiver.hp -= calcDmg(move,attacker,receiver,scale)
    document.getElementById(hp).innerHTML =
      "<p>HP: " + receiver.hp + "/" + receiver.fullhp + "</p>";
  } else {
    setTimeout(function () {
      comment.innerHTML += "<p>Attack missed!</p>";
    });
  }
  checkWinner(attacker,receiver,hp);
}

function checkWinner(pk1,pk2,hp) {
  let f = pk1.hp <= 0 ? pk1 : pk2.hp <= 0 ? pk2 : false;
  if (f != false) {
    //alert("GAME OVER: " + f.name + " fainted!");
    comment.innerHTML += "<p>GAME OVER: " + f.name + " fainted!</p>";
    document.getElementById(hp).innerHTML = "<p>HP: 0/" + f.fullhp + "</p>";
    setTimeout(function () {
      location.reload();
    }, 1500);
  }
}

createPokes()