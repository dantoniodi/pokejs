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
    //let moveInfo = await getMove('https://pokeapi.co/api/v2/move/38/')
    movePool.fill({
        'pp': moveInfo.pp,
        'name': moveInfo.name,
        'type': moveInfo.type.name,
        'class': moveInfo.damage_class.name,
        'power': moveInfo.power != null ? moveInfo.power : 0,
        'accuracy': moveInfo.accuracy != null ? moveInfo.accuracy : 100,
        'priority': moveInfo.priority,
        'changes': moveInfo.stat_changes,
        'meta': moveInfo.meta
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

function changeBar(ata,rec,div) { //refatorar essa merda depois
  let hp_bar = [];
  let hp_text = [];
  let hp_value = [];
  let hp_percent = [];
  
  if(div == 'hp1'){
    hp_bar[0] = document.querySelector('#hp1 .bar-fill')
    hp_bar[1] = document.querySelector('#hp2 .bar-fill')
    hp_text[0] = document.querySelector('#hp1 .text')
    hp_text[1] = document.querySelector('#hp2 .text')
  } else {
    hp_bar[0] = document.querySelector('#hp2 .bar-fill')
    hp_bar[1] = document.querySelector('#hp1 .bar-fill')
    hp_text[0] = document.querySelector('#hp2 .text')
    hp_text[1] = document.querySelector('#hp1 .text')
  }
  hp_value[0] = ata
  hp_value[1] = rec
  hp_percent[0] = Math.floor(ata.hp*100/ata.fullhp)
  hp_percent[1] = Math.floor(rec.hp*100/rec.fullhp)
  
  
  for(let i=0; i<hp_bar.length; i++) {
    if(hp_percent[i] === 100) {
      hp_bar[i].style.backgroundColor = 'springgreen';
    } else if(hp_percent[i] > 50) {
      hp_bar[i].style.backgroundColor = 'chartreuse';
    } else if (hp_percent[i] > 20) {
      hp_bar[i].style.backgroundColor = 'gold';
    } else if (hp_percent[i] > 0){
      hp_bar[i].style.backgroundColor = 'red';
    } else {
      hp_percent[i] = 0
    }
    hp_bar[i].style.width = hp_percent[i]+'%'
    hp_text[i].innerHTML = "<p>HP: " + hp_value[i].hp + "/" + hp_value[i].fullhp + "</p>";
  }
}

function checkCrit(ata,mov,gen = 2) { //check critical hit chance
  let crit = 1
  let critBase;
  switch(gen) {
    //gen 1 formula is based on pkm speed
    case 1: 
      critBase = Math.floor(ata.speed.base/2);
      if(mov.meta.crit_rate == 1) {
        critBase = critBase * 8
      }
      break;
    //gen 2 onwards all pkm has same crit chance
    case 2: 
      critBase = 16;
      if(mov.meta.crit_rate == 1) {
        critBase = critBase * 4
      }
      break;
  }
  let critChance = Math.floor(Math.random() * 256)
  if(critBase > critChance) {
    crit = 2;
    setTimeout(function () {
      comment.innerHTML += "<p>A critical hit!</p>";
    }, 1000);
  }
  console.log('Crit chance: '+critBase/256*100+'%')
  return crit
}

//Check type effectiveness (attack type x enemy type)
function checkTE(moveType,enemyType) { 
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
  //console.log(pkm);
  if (bool) {
    for (i = 0; i < 4; i++) {
      let moveText = '<span class="move-name">'+pkm.moveset[i].name+'</span> ('+pkm.moveset[i].type+')<br>'
        +'<small>[Pwr: '+pkm.moveset[i].power+' | Acc: '+pkm.moveset[i].accuracy+']</small>'
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
  document.querySelector('#hp1 .text').innerHTML = "<p>HP: " + pk1.hp + "/" + pk1.fullhp + "</p>"

  let pk2 = await spawn(false);
  s2 = document.createElement("img");
  s2.src = pk2.sprite.versions['generation-v']['black-white'].animated['front_default'];
  document.getElementById("pk2").appendChild(s2);
  document.getElementById("if2").innerHTML = "<span>" + pk2.name + "</span> Lv." + pk2.lv
  document.querySelector('#hp2 .text').innerHTML = "<p>HP: " + pk2.hp + "/" + pk2.fullhp + "</p>"

  let moveTurn = 1;
  for (i = 0; i < 4; i++) {
    let btn = document.getElementById("m" + i);
    let move = pk1.moveset[i];
    let foeMove = pk2.moveset[Math.floor(Math.random() * 3)]
  
    function addHandler(btn, move, pk1, pk2) {
      btn.addEventListener("click", function (e) {
        document.querySelectorAll('button.btn').forEach(elem => {
          elem.disabled = true;
        });
        let moveOrder = 0; //set move order (1=foe,0=you)
        console.log('Speed(Pk1:'+pk1.stats.speed.actual+'|Pk2:'+pk2.stats.speed.actual+')');
        if(foeMove.priority > move.priority) { //check move prority
          moveOrder = 1
        } else if(foeMove.priority < move.priority) {
          moveOrder = 0
        } else {
          if(pk2.stats.speed.actual > pk1.stats.speed.actual) { //check pkm speed
            moveOrder = 1
          }
        }
        comment.innerHTML += "<p><b>--- Turn "+moveTurn+" ---</b></p>";
        console.log('Order: '+moveOrder);
        if(moveOrder == 0) {
          if(attack(move,pk1,pk2,"hp1","") > Math.floor(Math.random() * 100)) { //fling chance
            setTimeout(function () {
              comment.innerHTML += "<p><span class='pname'>"+pk2.name+"</span> flinched and couldn't move!</p>";
            }, 1000);
          } else {
            if(pk2.hp > 0) {
              setTimeout(attack,2500,foeMove,pk2,pk1,"hp2","Foe ")
            }
          }
        } else {
          if(attack(foeMove,pk2,pk1,"hp2","Foe ") > Math.floor(Math.random() * 100)) { //fling chance
            setTimeout(function () {
              comment.innerHTML += "<p><span class='pname'>"+pk1.name+"</span> flinched and couldn't move!</p>";
            }, 1000);
          } else {
            if(pk1.hp > 0) {
              setTimeout(attack,2500,move,pk1,pk2,"hp1","")
            }
          }
        }
        moveTurn++
      });
    }
    addHandler(btn, move, pk1, pk2);
  }
}

function attack(move, attacker, receiver, hp, owner) {
  let flinch = 0;
  comment.innerHTML += "<p><span class='pname'>" + owner + attacker.name + "</span> used <span class='mname'>" + move.name + "</span>!</p>";
  if(Math.random() <= (move.accuracy/100)) { //check accuracy
    if(move.class !== 'status') {
      let dmgDone = calcDmg( //inflict damage
        move,
        attacker,
        receiver,
        checkCrit(attacker.stats, move),
        checkTE(move.type,receiver.type)
      )
      if(receiver.hp > dmgDone) { //prevents HP to be negative
        receiver.hp -= dmgDone
      } else {
        receiver.hp = 0;
      }
      if(move.meta.drain !== 0) { //calc draining effect
        let drain;
        if(move.meta.drain > 0) { //positive = drain
          drain = Math.floor(dmgDone*move.meta.drain/100)
          if((attacker.hp + drain) > attacker.fullhp) { //prevents overheal
            attacker.hp = attacker.fullhp
          } else {
            attacker.hp += drain
          }
          console.log('Drain: '+drain);
        } else { //negative = recoil
          drain = Math.floor(attacker.fullhp*move.meta.drain/100)
          if(attacker.hp > drain) {
            attacker.hp += drain
          } else {
            attacker.hp = 0 //prevent negative HP by recoil
          }
          console.log('Recoil: '+drain);
        }
      }
    }
    if(move.meta.healing !== 0){
      heal = Math.floor(attacker.fullhp*move.meta.healing/100)
      if(attacker.hp + heal > attacker.fullhp) { //prevents overheal
        attacker.hp = attacker.fullhp
      } else {
        attacker.hp += heal
      }
      if(attacker.hp < 0) attacker.hp = 0 //prevent negative HP by recoil
    }
    flinch = move.meta.flinch_chance
    changeBar(attacker,receiver,hp)
  } else {
    setTimeout(function () {
      comment.innerHTML += "<p>Attack missed!</p>";
    }, 1000);
  }
  checkWinner(attacker,receiver)
  return flinch
}

function checkWinner(pk1,pk2) {
  let f = false
  if(pk2.hp <= 0){
    setTimeout(function () {
      comment.innerHTML += "<p><span class='pname'>"+pk2.name+"</span> has fainted!</p>";
    }, 2000);
    f = true
  }
  if(pk1.hp <= 0){
    setTimeout(function () {
      comment.innerHTML += "<p><span class='pname'>"+pk1.name+"</span> has fainted!</p>";
    }, 2000);
    f = true
  }
  if(f) {
    setTimeout(function () {
      comment.innerHTML += "<p><b>--- Game Over ---</b></p>";
      //location.reload();
    }, 4000)
  }
  comment.scrollTop = comment.scrollHeight;
  setTimeout(function () {
    document.querySelectorAll('button.btn').forEach(elem => {
      elem.disabled = false;
    });
  }, 3000)
}

createPokes()