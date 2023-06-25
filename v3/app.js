const comments = document.querySelector(".comment")
const buttons = document.querySelectorAll('button.btn')
const hp_now = document.querySelectorAll(".hp .now")
const hp_max = document.querySelectorAll(".hp .max")
const hp_bar = document.querySelectorAll(".hp .bar")
const p_cond = document.querySelectorAll(".cond p")
const p_name = document.querySelectorAll(".info .name")
const p_level = document.querySelectorAll(".info .level")
const p_image = document.querySelectorAll(".poke .image")

function addComment(phrase,delay=0) {
  if(phrase != null && phrase != '') {
    setTimeout(function () {
      comments.innerHTML += "<p>"+phrase+"</p>";
      comments.scrollTop = comments.scrollHeight;
    }, delay);
  }
}

function changeBtn() {
  buttons.forEach(elem => { 
    elem.disabled = elem.disabled == true ? false : true
  })
}

function changeBar(pokes) {

  for(let i=0; i < pokes.length; i++) {
    let hp_percent = Math.floor(pokes[i].hp.now*100/pokes[i].hp.max)
    if(hp_percent === 100) {
      pokes[i].div.hp.bar.style.backgroundColor = 'springgreen'
    } else if(hp_percent > 50) {
      pokes[i].div.hp.bar.style.backgroundColor = 'chartreuse'
    } else if (hp_percent > 20) {
      pokes[i].div.hp.bar.style.backgroundColor = 'gold'
    } else {
      pokes[i].div.hp.bar.style.backgroundColor = 'red'
    }
    pokes[i].div.hp.bar.style.width = hp_percent+'%'
    pokes[i].div.hp.now.innerHTML = pokes[i].hp.now
    pokes[i].div.hp.max.innerHTML = pokes[i].hp.max
  }
}

function checkSleep(pkm) {
  
  if(pkm.cond == 'sleep') {
    if(pkm.sleep > 0) {
      pkm.sleep--
    }
    if(pkm.sleep == 0) {
      pkm.setStatus('healthy')
      addComment("<span class='name'>"+pkm.name+"</span> wake up!")
    }
    console.log('Sleep: '+pkm.sleep)
  }
}

function checkStatus(pokes) {

  for(let i=0; i<pokes.length; i++) {
    if(pokes[i].cond == 'poison' || pokes[i].cond == 'burn') {
      let pain = Math.floor(pokes[i].hp.max/8)
      pokes[i].hp.now = pokes[i].hp.now > pain ? pokes[i].hp.now - pain : 0
      addComment("<span class='name'>"+pokes[i].name+"</span> suffers from "+pokes[i].cond+"!")
      console.log('Poison/Burn: '+pain);
    }
  }
  changeBar(pokes)
}

function checkMeta(mov,dmg,pokes) {

  let ata = pokes[0]
  let rec = pokes[1]
  
  if(mov.drain != 0) { //calc draining effect, positive=drain/negative=recoil
    let drain = Math.floor(dmg * mov.drain / 100)
    if((ata.hp.now + drain) > ata.hp.max) { //prevents overheal
      ata.hp.now = ata.hp.max
    } else if((ata.hp.now + drain) < 0) { //prevents negative HP by recoil
      ata.hp.now = 0
    } else {
      ata.hp.now += drain
    }
    console.log('Drain: '+drain)
  }
  if(mov.healing > 0) { //calc healing effect
    let heal = Math.floor(ata.hp.max*mov.healing/100)
    if(ata.hp.now + heal > ata.hp.max) { //prevents overheal
      ata.hp.now = ata.hp.max
    } else {
      ata.hp.now += heal
    }
    console.log('Heal: '+heal);
  }
  if(mov.category.name == 'ailment') {
    let ailment = mov.ailment.name
    rec.setStatus(ailment)
  }
  changeBar(pokes)
  return mov.flinch_chance > 0 ? mov.flinch_chance : 0
}

function checkCrit(ata,mov,gen=2) { //check critical hit chance
  
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

  for(let i=0; i < enemyType.name.length; i++) {
    for (let x=0; x < enemyType.rels[i].length; x++) {
      if (enemyType.rels[i][x].includes(moveType)) {
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
  )

  console.log('Scale: '+scale);
  addComment(msg)
  return scale
}

async function createPoke(bool, id = Math.floor(Math.random() * 640) + 1) {
  
  let index = bool ? 1 : 0
  let sprite = bool ? 'back_default' : 'front_default'
  let div = {hp:{now:hp_now[index],max:hp_max[index],bar:hp_bar[index]},status:p_cond[index]}
  
  let pkm = new Pokemon(div)
  let p = await Pokemon.getData(id)
  await pkm.create(p)
  let img = document.createElement("img")
  img.src = pkm.sprite.versions['generation-v']['black-white'].animated[sprite];
  p_image[index].appendChild(img);
  p_level[index].innerHTML = pkm.lv
  p_name[index].innerHTML = pkm.name
  hp_now[index].innerHTML = pkm.hp.now
  hp_max[index].innerHTML = pkm.hp.max

  if(bool) {
    for (i = 0; i < 4; i++) {
      let moveText = '<span class="name">'+pkm.moveset[i].name+'</span><br>'
        +'<small>['+pkm.moveset[i].type+' | Pwr: '+pkm.moveset[i].power+' | Acc: '+pkm.moveset[i].accuracy+'%]</small>'
      document.getElementById("m"+i).innerHTML = moveText;
    }
  }
  console.log(pkm);
  return pkm;
}

async function startBattle() {

  //second param(optional) = pokemon id
  const pk1 = await createPoke(true)
  const pk2 = await createPoke(false)

  let moveTurn = 1
  let moveOrder;
  let foeMove;
  for (i = 0; i < 4; i++) {
    let btn = document.getElementById("m"+i)
    let move = pk1.moveset[i]
    addHandler(btn,move,pk1,pk2);
  }
  addComment('--- Battle Started ---')

  function addHandler(btn,move,pk1,pk2) {
    btn.addEventListener("click", function(e) {
      
      changeBtn() //disables buttons after choosing a move
      console.log('Speed-check: '+pk1.stats.speed.current+' vs '+pk2.stats.speed.current);
      
      foeMove = pk2.moveset[Math.floor(Math.random() * 3)]
      moveOrder = ( //set move order (1=foe first, 0=you first)
        foeMove.priority > move.priority ? 1 : //check foe move prority
        foeMove.priority < move.priority ? 0 : //check your move prority
        pk2.stats.speed.current > pk1.stats.speed.current ? 1 : 0 //check pkm speed
      )
      if(moveTurn > 1) addComment('--- Turn '+moveTurn+' ---')
      console.log('Order: '+moveOrder);
      
      let chosenMove = [move,foeMove]
      let pokeOrder = [pk1,pk2]
      if(moveOrder == 1) {
        chosenMove = [...chosenMove].reverse()
        pokeOrder = [...pokeOrder].reverse()
      }

      for(let x=0; x<chosenMove.length; x++) { //move counter
        if(pokeOrder[0].cond == "paralysis" && 25 > Math.floor(Math.random() * 100)) {
          addComment("<span class='name'>"+pokeOrder[0].name+"</span> is fully paralyzed!")
          changeBtn() //skip turn and reenables buttons
        } else {
          checkSleep(pokeOrder[0])
          if(pokeOrder[0].cond == "sleep" && pokeOrder[0].sleep > 0) {
            addComment("<span class='name'>"+pokeOrder[0].name+"</span> is sleeping!")
            changeBtn() //skip turn and reenables buttons
          } else {
            if(pokeOrder[0].hp.now > 0) { //check if poke still alive
              if(x > 0) { //second move
                setTimeout(function () {
                  attack(chosenMove[x],pokeOrder)
                  changeBtn() //reenables buttons after second move
                }, 2000)
              } else { //first move
                attack(chosenMove[x],pokeOrder)
                pokeOrder = [...pokeOrder].reverse() //flip order
              }
            }
          }
        }
      }
      setTimeout(checkStatus,2100,pokeOrder)
      moveTurn++
    });
  }
}

function attack(move, pokes) {
  
  let flinch = 0;
  let dmgDone = 0;
  let attacker = pokes[0]
  let receiver = pokes[1]
  let accValue = move.accuracy/100 
    * attacker.stats['accuracy'].current/100 
    * receiver.stats['evasion'].current/100
  
  addComment("<span class='name'>"+attacker.name+"</span> used <span class='name'>"+move.name+"</span>!")
  console.log('Hit chance: '+accValue*100+'%');
  
  if(move.accuracy > 100 || Math.random() < accValue) { //accuracy check
    if(move.class !== 'status') {
      dmgDone = calcDmg(
        move,
        attacker,
        receiver,
        checkCrit(attacker.stats, move),
        checkTE(move.type,receiver.type)
      )
      receiver.hp.now -= dmgDone //inflict damage
    }
    if(move.changes != null) { //reduce or raise stats check
      let self = ['user','user-or-ally','users-field','user-and-allies']
      let target = self.includes(move.target) ? attacker : receiver
      let msg = target.changeStats(move.changes[0])
      addComment("<span>"+target.name+"'s</span> "+msg)
      console.log('Changes: '+move.changes.length);
    }
    if(move.meta != null) {
      flinch = checkMeta(move.meta,dmgDone,pokes)
    }
  } else {
    addComment("Attack missed!")
  }
  checkWinner(pokes)
  return flinch //return fling chance from move, default = 0
}

function checkWinner(pokes) {
  let ko = false
  for(let i=0; i < pokes.length; i++) {
    if(pokes[i].hp.now <= 0) {
      addComment("<span class='name'>"+pokes[i].name+"</span> has fainted!",2000)
      pokes[i].div.status.innerHTML = 'FNT'
      pokes[i].div.status.style.backgroundColor = "firebrick";
      ko = true
    }
  }
  if(ko) {
    addComment("--- Game Over ---",3000)
    setTimeout(function() { location.reload() }, 8000)
  }
}

startBattle()