const level = Math.floor(Math.random() * (99 - 15)) + 15 //both level (15-99)
const ev = 0 //effort values, since both are wild pokemon their ev is zero
const comment = document.getElementById("comment")

class Pokemon {
  constructor(name, sprite, hp, stats, type, moves) {
    this.name = name;
    this.sprite = sprite;
    this.lv = level;
    this.hp = hp;
    this.fullhp = hp;
    this.stats = stats;
    this.type = type;
    this.moveset = moves;
  }
}

const getPokemon = id =>
  fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then((resp) => resp.json())

const getType = async(types) => {
  let typeMatch = new Array()
  for(let i=0; i<types.length; i++) {
    let data = await fetch(types[i].type.url).then(resp => resp.json())
    typeMatch.push([
      data.name,[
        data.damage_relations.no_damage_from.map(names => names.name),
        data.damage_relations.half_damage_from.map(names => names.name),
        data.damage_relations.double_damage_from.map(names => names.name)
      ]
    ])
  }
  return typeMatch
}

const getNature = async(id = Math.floor(Math.random() * 25 + 1)) => {
    let nature = []
    let data = await fetch(`https://pokeapi.co/api/v2/nature/${id}`).then(resp => resp.json())
    //console.log(data)
    nature = {
      'name': data.name,
      'increased': data.increased_stat != null ? data.increased_stat.name : '',
      'decreased': data.decreased_stat != null ? data.decreased_stat.name : ''
    }
    return nature
}

const getMove = url => fetch(url).then((resp) => resp.json())

const setMovePool = async(pool) => {
  let movePool = new Array(4)
  let moveNum = new Set()
  while(moveNum.size < 4) { //add random numbers to an unique collection(set)
    moveNum.add(Math.floor(Math.random() * pool.length))
  }
  for(let i=0; i<4; i++) {
    let moveInfo = await getMove(pool[Array.from(moveNum)[i]].move.url)
    movePool.fill({
        'name': moveInfo.name,
        'type': moveInfo.type.name,
        'class': moveInfo.damage_class.name,
        'power': moveInfo.power != null ? moveInfo.power : 0,
        'accuracy': moveInfo.accuracy != null ? moveInfo.accuracy : 100,
    }, i)
  }
  return movePool
}

//Formula found on https://pokemon.fandom.com/wiki/Statistics
function calcHP(stat) {
  let iv = Math.floor(Math.random() * 31)
  return Math.floor(0.01 * (2 * stat.base_stat + iv + Math.floor(0.25 * ev)) * level) + level + 10
}

async function calcStat(stats) {
  let nature = await getNature()
  let iv = Math.floor(Math.random() * 31)
  let pokeStats = [];
  for(let i=1; i<stats.length; i++) {
    let N = stats[i].stat.name === nature.increased ? 1.1 : stats[i].stat.name === nature.decreased ? 0.9 : 1
    pokeStats[stats[i].stat.name] = {
      'base': stats[i].base_stat,
      'actual': Math.floor(((0.01 * (2 * stats[i].base_stat + iv + Math.floor(0.25 * ev)) * level) + 5) * N),
      'old': Math.floor(0.01 * (2 * stats[i].base_stat + iv + Math.floor(0.25 * ev)) * level) + 5
    }
  }
  return pokeStats
}

function calcDmg(move,ata,rec,bon,crit) {
  let A = 0 //attacker stat (att or spa)
  let B = move.power //move power
  let C = crit //normal or critical hit (1 or 2)
  let D = 0 //defender stat (def or spd)
  let L = ata.lv //attacker level
  let X = 1 //same-type attack bonus (1 or 1.5)
  let Y = bon //type modifiers (4, 2, 1, 0.5, 0.25 or 0)
  let Z = Math.floor(Math.random() * (255 - 217)) + 217 //random factor
  switch(move.class) {
    case 'physical': A = ata.stats['attack'].actual; D = rec.stats['defense'].actual; break
    case 'special': A = ata.stats['special-attack'].actual; D = rec.stats['special-defense'].actual; break
  }
  let stab = ata.type.map(typeInfo => typeInfo[0])
  if (stab.includes(move.type)) {
    X = 1.5;
  }
  let DMG = 0;
  if(move.class !== 'status') {
    baseDmg = ((2*L*C/5+2)*B*A/D)/50 //never changes
    DMG = Math.floor(((baseDmg+2)*X*Y)*Z/255) //gen 1 formula
  }
  console.log('Dmg: '+DMG)
  return DMG
}

function checkCrit(ata,crit = 1) { //check critical hit chance
  let critBase = Math.floor(ata['speed'].base/2)
  let critChance = Math.floor(Math.random() * 255)
  if(critBase > critChance){
    crit = 2;
    setTimeout(function () {
      comment.innerHTML += "<p>A critical hit!</p>";
    }, 1000);
  }
  console.log(critBase+','+critChance)
  return crit
}

function checkTE(moveType,enemyType) { //check type effectiveness (attack type x enemy type)
  let scale = 1;
  for (i = 0; i < enemyType.length; i++) {
    for (x = 0; x < enemyType[i][1].length; x++) {
      if (enemyType[i][1][x].includes(moveType)) {
        switch (x) {
          case 0: scale = scale * 0; break;
          case 1: scale = scale * 0.5; break;
          case 2: scale = scale * 2; break;
        }
      }
    }
  }
  if (scale === 0){
    setTimeout(function () {
      comment.innerHTML += "<p>It had no effect!</p>";
    }, 1000);
  } else if(scale < 1) {
    setTimeout(function () {
      comment.innerHTML += "<p>It was not very effective!</p>";
    }, 1000);
  } else if(scale > 1){
    setTimeout(function () {
      comment.innerHTML += "<p>It was super effective!</p>";
    }, 1000);
  }
  return scale
}

async function spawn(bool, id = Math.floor(Math.random() * 640) + 1) {
  let p = await getPokemon(id)
  let pkm = new Pokemon(
              p.name,
              p.sprites,
              calcHP(p.stats[0]),
              await calcStat(p.stats),
              await getType(p.types),
              await setMovePool(p.moves),
            )
  console.log(pkm);
  if (bool) {
    for (i = 0; i < 4; i++) {
      let moveText = pkm.moveset[i].name+' ('+pkm.moveset[i].type+')<br>'
        +'[Pwr:'+pkm.moveset[i].power+' | Acc: '+pkm.moveset[i].accuracy+']'
      document.getElementById("m" + i).innerHTML = moveText;
    }
  }
  return pkm;
}

async function createPokes() {
  let pk1 = await spawn(true);
  s1 = document.createElement("img");
  s1.src = pk1.sprite.versions['generation-v']['black-white'].animated['back_default'];
  document.getElementById("pk1").appendChild(s1);
  document.getElementById("if1").innerHTML = "<span>" + pk1.name + "</span> Lv." + pk1.lv
  // document.getElementById("hp1").innerHTML = "<p>HP: " + pk1.hp + "/" + pk1.fullhp + "</p>"

  let pk2 = await spawn(false);
  s2 = document.createElement("img");
  s2.src = pk2.sprite.versions['generation-v']['black-white'].animated['front_default'];
  document.getElementById("pk2").appendChild(s2);
  document.getElementById("if2").innerHTML = "<span>" + pk2.name + "</span> Lv." + pk2.lv
  // document.getElementById("hp2").innerHTML = "<p>HP: " + pk2.hp + "/" + pk2.fullhp + "</p>"

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
  comment.innerHTML = "<p>" + owner + attacker.name + " used " + move.name + "!</p>";
  if (Math.random() <= (move.accuracy/100)) { //check accuracy
    receiver.hp -= calcDmg(
                    move,
                    attacker,
                    receiver,
                    checkCrit(attacker.stats),
                    checkTE(move.type,receiver.type)
                  )
    /*document.getElementById(hp).innerHTML =
      "<p>HP: " + receiver.hp + "/" + receiver.fullhp + "</p>";*/
    let hp_percent = Math.floor(receiver.hp*100/receiver.fullhp)
    let hp_bar = document.querySelector('#'+hp+' .bar-fill')
    hp_bar.style.width = hp_percent+'%'
    if(hp_percent > 50) {
      hp_bar.style.backgroundColor = 'springgreen';
    } else if (hp_percent > 20) {
      hp_bar.style.backgroundColor = 'gold';
    } else {
      hp_bar.style.backgroundColor = 'red';
    }
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
    comment.innerHTML = "<p>GAME OVER: " + f.name + " fainted!</p>";
    //document.getElementById(hp).innerHTML = "<p>HP: 0/" + f.fullhp + "</p>";
    setTimeout(function () {
      location.reload();
    }, 5000);
  }
}

createPokes()