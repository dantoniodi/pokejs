const level = Math.floor(Math.random() * (99 - 15)) + 15 //both level (15-99)
const ev = 0 //effort values, since both are wild pokemon their ev is zero
const buttons = document.querySelectorAll('button.btn')
const comment = document.querySelector(".comment")
const hp_bar = [document.querySelector("#pk1 .bar"),document.querySelector("#pk2 .bar")]
const hp_text = [document.querySelector("#pk1 .text"),document.querySelector("#pk2 .text")]

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
    this.stats.evasion = {current:100,initial:100,stage:0}
    this.stats.accuracy = {current:100,initial:100,stage:0}
  }
  changeStats(i) {
    let statMult;
    let stageMsg;
    let nextStage = i.change + this.stats[i.stat.name].stage
    if(this.stats[i.stat.name].stage == 6) {
      stageMsg = i.stat.name+" won't go higher!";
    } else if(this.stats[i.stat.name].stage == -6) {
      stageMsg = i.stat.name+" won't go lower!";
    } else {
      if(nextStage > 6) { //prevents stage goes past limit
        this.stats[i.stat.name].stage = 6
        i.change = this.stats[i.stat.name].stage - 6
      } else if(nextStage < -6) {
        this.stats[i.stat.name].stage = -6
        i.change = -6 - this.stats[i.stat.name].stage
      } else {
        this.stats[i.stat.name].stage = nextStage
      }
      switch(i.change) {
        case -3: stageMsg = i.stat.name+" severely fell!"; break
        case -2: stageMsg = i.stat.name+" harshly fell!"; break
        case -1: stageMsg = i.stat.name+" fell!"; break
        case 1: stageMsg = i.stat.name+" rose!"; break
        case 2: stageMsg = i.stat.name+" sharply rose!"; break
        case 3: stageMsg = i.stat.name+" rose drastically!"; break
      }
    }
    if(i.stat.name == 'accuracy') {
      statMult = nextStage >= 0 ? (3+nextStage)/3 : 3/(3-(nextStage))
    } else if(i.stat.name == 'evasion') {
      statMult = nextStage >= 0 ? 3/(3+nextStage) : (3-(nextStage))/3
    } else { //stats changes uses 2/2 basis (acc and evasion uses 3/3)
      statMult = nextStage >= 0 ? (2+nextStage)/2 : 2/(2-(nextStage))
    }
    this.stats[i.stat.name].current = Math.floor(statMult * this.stats[i.stat.name].initial)
    return stageMsg
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
  //let moveNum = new Set(['slash','sand-attack','fury-cutter','minimize'])
  while(moveNum.size < 4) { //add random numbers to an unique collection(set)
    moveNum.add(Math.floor(Math.random() * pool.length))
  }
  for(let i=0; i<4; i++) {
    let moveInfo = await getMove(pool[Array.from(moveNum)[i]].move.url)
    // let moveInfo = await getMove('https://pokeapi.co/api/v2/move/'+Array.from(moveNum)[i])
    movePool.fill({
        'pp': moveInfo.pp,
        'name': moveInfo.name,
        'type': moveInfo.type.name,
        'class': moveInfo.damage_class.name,
        'power': moveInfo.power != null ? moveInfo.power : 0,
        'accuracy': moveInfo.accuracy != null ? moveInfo.accuracy : 200,
        'priority': moveInfo.priority != null ? moveInfo.priority : 0,
        'changes': moveInfo.stat_changes.length === 0 ? null: moveInfo.stat_changes,
        'target': moveInfo.target.name,
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
      'initial': Math.floor(((0.01 * (2 * stats[i].base_stat + iv + Math.floor(0.25 * ev)) * level) + 5) * N),
      'current': Math.floor(((0.01 * (2 * stats[i].base_stat + iv + Math.floor(0.25 * ev)) * level) + 5) * N),
      'stage': 0
    }
  }
  return pokeStats
}

function changeBar(pk1,pk2,ord) {
  
  let hp = (ord == 0) ? [pk1.hp,pk2.hp] : [pk2.hp,pk1.hp]
  let maxhp = (ord == 0) ? [pk1.fullhp,pk2.fullhp] : [pk2.fullhp,pk1.fullhp]
  
  for(let i=0; i < hp_bar.length; i++) {
    let hp_percent = Math.floor(hp[i]*100/maxhp[i])
    if(hp_percent === 100) {
      hp_bar[i].style.backgroundColor = 'springgreen'
    } else if(hp_percent > 50) {
      hp_bar[i].style.backgroundColor = 'chartreuse'
    } else if (hp_percent > 20) {
      hp_bar[i].style.backgroundColor = 'gold'
    } else {
      hp_bar[i].style.backgroundColor = 'red'
    }
    hp_bar[i].style.width = hp_percent+'%'
    hp_text[i].innerHTML = "<p>HP: "+hp[i]+"/"+maxhp[i]+"</p>";
  }
}

function checkCrit(ata,mov,gen = 2) { //check critical hit chance
  
  let critMult = 2
  let critRate = mov.meta === null ? 0 : mov.meta.crit_rate
  let pkmSpeed = Math.floor(ata.speed.base/2)
  let critChance;

  switch(gen) {
    //gen 1 formula is based on pkm speed
    case 1:
      critChance = critRate > 0 ? pkmSpeed*8 : pkmSpeed
      break;
    //gen 2 onwards all pkm has same crit chance
    case 2: 
      critChance = critRate > 0 ? 16*4 : 16
      break;
    //gen 6 onwards crit chance and damage got nerfs
    case 6:
      critChance = critRate > 0 ? 16*2 : 16
      critMult = 1.5
      break;
  }
  if(critChance > Math.floor(Math.random() * 256)) {
    setTimeout(function () {
      comment.innerHTML += "<p>A critical hit!</p>";
    }, 1000);
  } else {
    critMult = 1
  }
  console.log('Crit chance: '+critChance/256*100+'%, Mult: '+critMult)
  return critMult
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
              p.species.name,
              p.sprites,
              calcHP(p.stats[0]),
              await calcStat(p.stats),
              await getType(p.types),
              await setMovePool(p.moves),
            )
  console.log(pkm);
  if (bool) {
    for (i = 0; i < 4; i++) {
      let moveText = '<span class="mname">'+pkm.moveset[i].name+'</span> ('+pkm.moveset[i].type+')<br>'
        +'<small>[Pwr: '+pkm.moveset[i].power+' | Acc: '+pkm.moveset[i].accuracy+']</small>'
      document.getElementById("m" + i).innerHTML = moveText;
    }
  }
  return pkm;
}

async function createPokes() {
  
  const pk1 = await spawn(true)
  let img1 = pk1.sprite;
  document.querySelector("#pk1 img").src = img1.versions['generation-v']['black-white'].animated['back_default'];
  document.querySelector('#pk1 .info').innerHTML = "<span class='pname'>"+pk1.name+"</span> Lv."+pk1.lv
  document.querySelector('#pk1 .hp .text').innerHTML = "<p>HP: "+pk1.hp+"/"+pk1.fullhp+"</p>"

  const pk2 = await spawn(false);
  let img2 = pk2.sprite;
  document.querySelector("#pk2 img").src = img2.versions['generation-v']['black-white'].animated['front_default'];
  document.querySelector("#pk2 .info").innerHTML = "<span class='pname'>"+pk2.name+"</span> Lv."+pk2.lv
  document.querySelector('#pk2 .hp .text').innerHTML = "<p>HP: "+pk2.hp+"/"+pk2.fullhp+"</p>"

  let moveTurn = 1
  for (i = 0; i < 4; i++) {
    let btn = document.getElementById("m" + i)
    let move = pk1.moveset[i]
    addHandler(btn, move, pk1, pk2);
  }

  function addHandler(btn, move, pk1, pk2) {
    btn.addEventListener("click", function (e) {
      
      buttons.forEach(elem => { elem.disabled = true }) //disable buttons after a click
      console.log('Speed-check: '+pk1.stats.speed.current+', '+pk2.stats.speed.current);
      
      let foeMove = pk2.moveset[Math.floor(Math.random() * 3)]
      let moveOrder = ( //set move order (1=foe,0=you)
        foeMove.priority > move.priority ? 1 : //check foe move prority
        foeMove.priority < move.priority ? 0 : //check your move prority
        pk2.stats.speed.current > pk1.stats.speed.current ? 1 : 0 //check pkm speed
      );
      
      comment.innerHTML += "<p><b>--- Turn "+moveTurn+" ---</b></p>";
      //console.log('Order: '+moveOrder);
      
      if(moveOrder == 0) {
        if(attack(move,pk1,pk2,0) > Math.floor(Math.random() * 100)) { //fling chance
          setTimeout(function () {
            comment.innerHTML += "<p><span class='pname'>"+pk2.name+"</span> flinched and couldn't move!</p>";
          }, 1000);
        } else {
          if(pk2.hp > 0) {
            setTimeout(attack,2500,foeMove,pk2,pk1,1)
          }
        }
      } else {
        if(attack(foeMove,pk2,pk1,1) > Math.floor(Math.random() * 100)) { //fling chance
          setTimeout(function () {
            comment.innerHTML += "<p><span class='pname'>"+pk1.name+"</span> flinched and couldn't move!</p>";
          }, 1000);
        } else {
          if(pk1.hp > 0) {
            setTimeout(attack,2500,move,pk1,pk2,0)
          }
        }
      }
      checkWinner(pk1,pk2)
      comment.scrollTop = comment.scrollHeight;
      moveTurn++
    });
  }
}

function attack(move, attacker, receiver, order) {
  let flinch = 0;
  let accValue = move.accuracy/100 
    * attacker.stats['accuracy'].current/100 
    * receiver.stats['evasion'].current/100
  comment.innerHTML += "<p><span class='pname'>"+attacker.name
    +"</span> used <span class='mname'>"+move.name+"</span>!</p>";
  console.log('Hit chance: '+accValue*100+'%');
  if(move.accuracy > 100 || Math.random() < accValue) { //accuracy check
    if(move.class !== 'status') {
      let dmgDone = calcDmg( //inflict damage
        move,
        attacker,
        receiver,
        checkCrit(attacker.stats, move),
        checkTE(move.type,receiver.type)
      )
      //prevents HP to be negative
      receiver.hp = receiver.hp > dmgDone ? receiver.hp - dmgDone : 0
      if(move.meta != null && move.meta.drain != 0) { //calc draining effect
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
    if(move.meta != null && move.meta.healing > 0) {
      let heal = Math.floor(attacker.fullhp*move.meta.healing/100)
      if(attacker.hp + heal > attacker.fullhp) { //prevents overheal
        attacker.hp = attacker.fullhp
      } else {
        attacker.hp += heal
      }
      console.log('Heal: '+heal);
    }
    if(move.changes != null) {
      console.log('Changes: '+move.changes.length);
      let self = ['user','user-or-ally','users-field','user-and-allies']
      let target = self.includes(move.target) ? attacker : receiver
      let msg = target.changeStats(move.changes[0])
      setTimeout(function () {
        comment.innerHTML += "<p><span>"+target.name+"'s</span> "+msg+"</p>";
      }, 1000);
      console.log(target)
    }
    if(move.meta !== null) flinch = move.meta.flinch_chance
    changeBar(attacker,receiver,order)
  } else {
    setTimeout(function () {
      comment.innerHTML += "<p>Attack missed!</p>";
    }, 1000);
  }
  //checkWinner(attacker,receiver)
  return flinch //return fling chance from move, default = 0
}

function checkWinner(pk1,pk2) {
  let ko = false
  let f = new Array(pk1,pk2)
  for(let i=0; i<f.length; i++) {
    if(f[i].hp <= 0) {
      setTimeout(function () {
        comment.innerHTML += "<p><span class='pname'>"+f[i].name+"</span> has fainted!</p>";
      }, 2000);
      ko = true
    }
  }
  if(ko) {
    buttons.forEach(elem => { elem.disabled = true })
    setTimeout(function () {
      comment.innerHTML += "<p><b>--- Game Over ---</b></p>";
    }, 3000)
    /*setTimeout(function () {
      location.reload();
    }, 5000)*/
  } else {
    setTimeout(function () {
      buttons.forEach(elem => { elem.disabled = false })
    }, 3000)
  }
  comment.scrollTop = comment.scrollHeight;
}

createPokes()