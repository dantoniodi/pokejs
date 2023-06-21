const level = Math.floor(Math.random() * (99 - 15)) + 15 //both level (15-99)
const ev = 0 //effort values, since both are wild pokemon their ev is zero
const comment = document.querySelector(".comment")
const buttons = document.querySelectorAll('button.btn')
const condition = document.querySelectorAll(".cond p")
const hp_text = document.querySelectorAll(".hp .text")
const hp_bar = document.querySelectorAll(".hp .bar")

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
  setNature(value) {
    this.nature = value;
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
    } //stats changes uses 2/2 basis (acc and evasion uses 3/3)
    if(i.stat.name == 'accuracy') {
      statMult = nextStage >= 0 ? (3+nextStage)/3 : 3/(3-(nextStage))
    } else if(i.stat.name == 'evasion') {
      statMult = nextStage >= 0 ? 3/(3+nextStage) : (3-(nextStage))/3
    } else { 
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

const getNature = async(id) => {
    let data = await fetch(`https://pokeapi.co/api/v2/nature/${id}`).then(resp => resp.json())
    let nature = {
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
  //let moveNum = new Set(['thunder-wave','toxic','will-o-wisp','sleep-powder'])
  while(moveNum.size < 4) { //add random numbers to an unique collection(set)
    moveNum.add(Math.floor(Math.random() * pool.length))
  }
  for(let i=0; i<4; i++) {
    let moveInfo = await getMove(pool[Array.from(moveNum)[i]].move.url)
    //let moveInfo = await getMove('https://pokeapi.co/api/v2/move/'+Array.from(moveNum)[i])
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

function addComment(phrase,delay=1000) {
  if(phrase != null && phrase != '') {
    setTimeout(function () {
      comment.innerHTML += "<p>"+phrase+"</p>";
      comment.scrollTop = comment.scrollHeight;
    }, delay);
  }
}

function checkButtons() {
    buttons.forEach(elem => { 
      elem.disabled = elem.disabled == true ? false : true
    })
}

//Formula found on https://pokemon.fandom.com/wiki/Statistics
function calcHP(stat) {
  let iv = Math.floor(Math.random() * 31)
  return Math.floor(0.01 * (2 * stat.base_stat + iv + Math.floor(0.25 * ev)) * level) + level + 10
}

async function calcStat(stats) {
  let nat = await getNature(Math.floor(Math.random() * 25 + 1)) //random nature
  let iv = Math.floor(Math.random() * 31) //random IVs (0-31)
  let pokeStats = new Array()
  for(let i=1; i<stats.length; i++) { //starting on 1 skips hp
    let N = stats[i].stat.name === nat.increased ? 1.1 : stats[i].stat.name === nat.decreased ? 0.9 : 1
    pokeStats[stats[i].stat.name] = {
      'base': stats[i].base_stat,
      'initial': Math.floor(((0.01 * (2 * stats[i].base_stat + iv + Math.floor(0.25 * ev)) * level) + 5) * N),
      'current': Math.floor(((0.01 * (2 * stats[i].base_stat + iv + Math.floor(0.25 * ev)) * level) + 5) * N),
      'stage': 0
    } //current its a initial copy because it can change multiple times during battle
  }
  return pokeStats
}

function changeBar(pk1,pk2,ord) {
  
  let hp = (ord == 1) ? [pk1.hp,pk2.hp] : [pk2.hp,pk1.hp]
  let maxhp = (ord == 1) ? [pk1.fullhp,pk2.fullhp] : [pk2.fullhp,pk1.fullhp]
  
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
    case 1: //gen 1 formula is based on pkm speed
      critChance = critRate > 0 ? pkmSpeed*8 : pkmSpeed
      break;
    case 2: //gen 2 onwards all pkm has same crit chance
      critChance = critRate > 0 ? 16*4 : 16
      break;
    case 6: //gen 6 onwards crit chance and damage got nerfs
      critChance = critRate > 0 ? 16*2 : 16
      critMult = 1.5
      break;
  }
  if(critChance > Math.floor(Math.random() * 256)) {
    addComment('A critical hit!')
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
          case 0: scale = scale * 0; break; //immune
          case 1: scale = scale / 2; break; //resistant 
          case 2: scale = scale * 2; break; //weak
        }
      }
    }
  }
  let msg = (
    scale === 0 ? "It had no effect!" :
    scale < 1 ? "It was not very effective!" :
    scale > 1 ? "It was super effective!" : null
  );
  addComment(msg)
  return scale
}

async function spawn(bool, id = Math.floor(Math.random() * 640) + 1) {
  let p = await getPokemon(id)
  //console.log(p);
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
      let moveText = '<span class="name">'+pkm.moveset[i].name+'</span><br>'
        +'<small>['+pkm.moveset[i].type+' | Pwr: '+pkm.moveset[i].power+' | Acc: '+pkm.moveset[i].accuracy+'%]</small>'
      document.getElementById("m" + i).innerHTML = moveText;
    }
  }
  return pkm;
}

async function createPokes() {
  
  const pk1 = await spawn(true) //your poke
  s1 = document.createElement("img");
  s1.src = pk1.sprite.versions['generation-v']['black-white'].animated['back_default'];
  document.querySelector("#pk1 .image").appendChild(s1);
  document.querySelector('#pk1 .info').innerHTML = "<span class='name'>"+pk1.name+"</span> Lv."+pk1.lv
  hp_text[1].innerHTML = "<p>HP: "+pk1.hp+"/"+pk1.fullhp+"</p>"

  const pk2 = await spawn(false) //enemy poke
  s2 = document.createElement("img");
  s2.src = pk2.sprite.versions['generation-v']['black-white'].animated['front_default'];
  document.querySelector("#pk2 .image").appendChild(s2);
  document.querySelector("#pk2 .info").innerHTML = "<span class='name'>"+pk2.name+"</span> Lv."+pk2.lv
  hp_text[0].innerHTML = "<p>HP: "+pk2.hp+"/"+pk2.fullhp+"</p>"

  let moveTurn = 1
  for (i = 0; i < 4; i++) {
    let btn = document.getElementById("m" + i)
    let move = pk1.moveset[i]
    addHandler(btn, move, pk1, pk2);
  }

  function addHandler(btn, move, pk1, pk2) {
    btn.addEventListener("click", function (e) {
      
      checkButtons() //disables buttons after choosing a move
      console.log('Speed-check: '+pk1.stats.speed.current+', '+pk2.stats.speed.current);
      
      let foeMove = pk2.moveset[Math.floor(Math.random() * 3)]
      let moveOrder = ( //set move order (1=foe,0=you)
        foeMove.priority > move.priority ? 1 : //check foe move prority
        foeMove.priority < move.priority ? 0 : //check your move prority
        pk2.stats.speed.current > pk1.stats.speed.current ? 1 : 0 //check pkm speed
      );
      addComment('--- Turn '+moveTurn+' ---')
      //console.log('Order: '+moveOrder);
      
      if(moveOrder == 0) {
        if(attack(move,pk1,pk2,0) > Math.floor(Math.random() * 100)) { //fling chance
          addComment("<span class='name'>"+pk2.name+"</span> flinched and couldn't move!")
        } else {
          if(pk2.hp > 0) {
            setTimeout(function () {
              attack(foeMove,pk2,pk1,1)
              checkButtons() //reenables buttons
            }, 3000)
          }
        }
      } else {
        if(attack(foeMove,pk2,pk1,1) > Math.floor(Math.random() * 100)) { //fling chance
          addComment("<span class='name'>"+pk1.name+"</span> flinched and couldn't move!")
        } else {
          if(pk1.hp > 0) {
            setTimeout(function () {
              attack(move,pk1,pk2,0)
              checkButtons() //reenables buttons
            }, 3000)
          }
        }
      }
      moveTurn++
    });
  }
}

function attack(move, attacker, receiver, order) {
  let flinch = 0;
  let accValue = move.accuracy/100 
    * attacker.stats['accuracy'].current/100 
    * receiver.stats['evasion'].current/100
  addComment("<span class='name'>"+attacker.name+"</span> used <span class='name'>"+move.name+"</span>!")
  console.log('Hit chance: '+accValue*100+'%');
  if(move.accuracy > 100 || Math.random() < accValue) { //accuracy check
    if(move.class !== 'status') {
      let dmgDone = calcDmg(
        move,
        attacker,
        receiver,
        checkCrit(attacker.stats, move),
        checkTE(move.type,receiver.type)
      )
      receiver.hp -= dmgDone //inflict damage
      if(move.meta != null && move.meta.drain != 0) { 
        //calc draining effect, positive=drain/negative=recoil
        let drain = Math.floor(dmgDone * move.meta.drain / 100)
        if((attacker.hp + drain) > attacker.fullhp) { //prevents overheal
          attacker.hp = attacker.fullhp
        } else if((attacker.hp + drain) < 0) { //prevents negative HP by recoil
          attacker.hp = 0
        } else {
          attacker.hp += drain
        }
        console.log('Drain: '+drain)
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
    if(move.meta != null && move.meta.category.name == 'ailment') {
      let ailment = move.meta.ailment.name
      switch(ailment) {
        case 'paralysis':
          condition[order].innerHTML = 'Paralyzed';
          condition[order].style.backgroundColor = "darkgoldenrod";
          break;
        case 'sleep':
          condition[order].innerHTML = 'Asleep';
          condition[order].style.backgroundColor = "rosybrown";
          break;
        case 'freeze':
          condition[order].innerHTML = 'Frozen';
          condition[order].style.backgroundColor = "cadetblue";
          break;
        case 'burn':
          condition[order].innerHTML = 'Burned';
          condition[order].style.backgroundColor = "orangered";
          break;
        case 'poison':
          condition[order].innerHTML = 'Poisoned';
          condition[order].style.backgroundColor = "rebeccapurple";
          break;
      }
    }
    if(move.changes != null) { //reduce or raise stats check
      console.log('Changes: '+move.changes.length);
      let self = ['user','user-or-ally','users-field','user-and-allies']
      let target = self.includes(move.target) ? attacker : receiver
      let msg = target.changeStats(move.changes[0])
      addComment("<span>"+target.name+"'s</span> "+msg)
      console.log(target)
    }
    if(move.meta !== null) flinch = move.meta.flinch_chance
    changeBar(attacker,receiver,order)
  } else {
    addComment("Attack missed!")
  }
  checkWinner([receiver,attacker])
  return flinch //return fling chance from move, default = 0
}

function checkWinner(pokes) {
  let ko = false
  for(let i=0; i < pokes.length; i++) {
    if(pokes[i].hp <= 0) {
      addComment("<span class='name'>"+pokes[i].name+"</span> has fainted!",2000)
      condition[i].innerHTML = 'Fainted'
      condition[i].style.backgroundColor = "firebrick";
      ko = true
    }
  }
  if(ko) {
    addComment("--- Game Over ---",3000)
    //setTimeout(function() { location.reload() }, 5000)
  }
}

createPokes()