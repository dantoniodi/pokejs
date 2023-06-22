const comment = document.querySelector(".comment")
const buttons = document.querySelectorAll('button.btn')
const condition = document.querySelectorAll(".cond p")
const hp_text = document.querySelectorAll(".hp .text")
const hp_bar = document.querySelectorAll(".hp .bar")

function addComment(phrase,delay=0) {
  if(phrase != null && phrase != '') {
    setTimeout(function () {
      comment.innerHTML += "<p>"+phrase+"</p>";
      comment.scrollTop = comment.scrollHeight;
    }, delay);
  }
}

function changeBtn() {
    buttons.forEach(elem => { 
      elem.disabled = elem.disabled == true ? false : true
    })
}

function changeBar(pk1,pk2,ord) {

  let hp = (ord == 1) ? [pk1.hp.now,pk2.hp.now] : [pk2.hp.now,pk1.hp.now]
  let maxhp = (ord == 1) ? [pk1.hp.max,pk2.hp.max] : [pk2.hp.max,pk1.hp.max]
  
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
  console.log(enemyType);
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
  );
  console.log('Scale: '+scale);
  addComment(msg)
  return scale
}

function checkStatus(pokes) {
  //console.log(pokes);
  for(let i=0; i<pokes.length; i++) {
    if(pokes[i].status == 'poison' || pokes[i].status == 'burn') {
      let pain = Math.floor(pokes[i].hp.max/8)
      pokes[i].hp.now = pokes[i].hp.now > pain ? pokes[i].hp.now - pain : 0
      console.log(pain);
    }
  }
}

function checkMeta(meta,dmg,ata,rec,ord) {
  console.log(meta);
  if(meta.drain != 0) { //calc draining effect, positive=drain/negative=recoil
    let drain = Math.floor(dmg * meta.drain / 100)
    if((ata.hp.now + drain) > ata.hp.max) { //prevents overheal
      ata.hp.now = ata.hp.max
    } else if((ata.hp.now + drain) < 0) { //prevents negative HP by recoil
      ata.hp.now = 0
    } else {
      ata.hp.now += drain
    }
    console.log('Drain: '+drain)
  }
  if(meta.healing > 0) { //calc healing effect
    let heal = Math.floor(ata.hp.max*meta.healing/100)
    if(ata.hp.now + heal > ata.hp.max) { //prevents overheal
      ata.hp.now = ata.hp.max
    } else {
      ata.hp.now += heal
    }
    console.log('Heal: '+heal);
  }
  if(meta.category.name == 'ailment') {
    let ailment = meta.ailment.name
    rec.setStatus(ailment)
    switch(rec.status) {
      case 'paralysis':
        condition[ord].innerHTML = 'Paralyzed';
        condition[ord].style.backgroundColor = "darkgoldenrod";
        break;
      case 'sleep':
        condition[ord].innerHTML = 'Asleep';
        condition[ord].style.backgroundColor = "rosybrown";
        break;
      case 'freeze':
        condition[ord].innerHTML = 'Frozen';
        condition[ord].style.backgroundColor = "cadetblue";
        break;
      case 'burn':
        condition[ord].innerHTML = 'Burned';
        condition[ord].style.backgroundColor = "orangered";
        break;
      case 'poison':
        condition[ord].innerHTML = 'Poisoned';
        condition[ord].style.backgroundColor = "rebeccapurple";
        break;
    }
  }
}

async function createPoke(bool, id = Math.floor(Math.random() * 640) + 1) {
  
  let pkm = new Pokemon()
  let p = await Pokemon.getData(id)
  await pkm.create(p)
  
  let index = bool ? 1 : 0
  let sprite = bool ? 'back_default' : 'front_default'
  let img = document.createElement("img")
  img.src = pkm.sprite.versions['generation-v']['black-white'].animated[sprite];
  document.querySelectorAll(".image")[index].appendChild(img);
  document.querySelectorAll(".info")[index].innerHTML = "<span class='name'>"+pkm.name+"</span> Lv."+pkm.lv
  hp_text[index].innerHTML = "<p>HP: "+pkm.hp.now+"/"+pkm.hp.max+"</p>"

  if(bool) {
    for (i = 0; i < 4; i++) {
      let moveText = '<span class="name">'+pkm.moveset[i].name+'</span><br>'
        +'<small>['+pkm.moveset[i].type+' | Pwr: '+pkm.moveset[i].power+' | Acc: '+pkm.moveset[i].accuracy+'%]</small>'
      document.getElementById("m" + i).innerHTML = moveText;
    }
  }
  console.log(pkm);
  return pkm;
}

async function startBattle() {

  const pk1 = await createPoke(true,243)
  const pk2 = await createPoke(false,26)

  let moveTurn = 1
  let moveOrder;
  let foeMove;
  for (i = 0; i < 4; i++) {
    let btn = document.getElementById("m" + i)
    let move = pk1.moveset[i]
    addHandler(btn, move, pk1, pk2);
  }

  function addHandler(btn, move, pk1, pk2) {
    btn.addEventListener("click", function (e) {
      
      changeBtn() //disables buttons after choosing a move
      console.log('Speed-check: '+pk1.stats.speed.current+', '+pk2.stats.speed.current);
      
      foeMove = pk2.moveset[Math.floor(Math.random() * 3)]
      moveOrder = ( //set move order (1=foe,0=you)
        foeMove.priority > move.priority ? 1 : //check foe move prority
        foeMove.priority < move.priority ? 0 : //check your move prority
        pk2.stats.speed.current > pk1.stats.speed.current ? 1 : 0 //check pkm speed
      );
      addComment('--- Turn '+moveTurn+' ---')
      console.log('Order: '+moveOrder);
      
      let par = false
      if(moveOrder == 0) {
        if(attack(move,pk1,pk2,0) > Math.floor(Math.random() * 100)) { //fling chance
          addComment("<span class='name'>"+pk2.name+"</span> flinched and couldn't move!")
        } else {
          if(pk2.status == "paralysis" && 75 > Math.floor(Math.random() * 100)) {
            addComment("<span class='name'>"+pk2.name+"</span> is fully paralyzed!")
          } else {
            if(pk2.hp.now > 0) {
              setTimeout(function () {
                attack(foeMove,pk2,pk1,1)
                //changeBtn() //reenables buttons
              }, 2000)
            } else {
              changeBtn()
            }
          }
        }
      } else {
        if(attack(foeMove,pk2,pk1,1) > Math.floor(Math.random() * 100)) { //fling chance
          addComment("<span class='name'>"+pk1.name+"</span> flinched and couldn't move!")
        } else {
          if(pk1.status == "paralysis" && 75 > Math.floor(Math.random() * 100)) {
            addComment("<span class='name'>"+pk1.name+"</span> is fully paralyzed!")
          } else {
            if(pk1.hp.now > 0) { //check if still alive or paralyzed
              setTimeout(function () {
                attack(move,pk1,pk2,0)
                changeBtn() //reenables buttons
              }, 2000)
            } else {
              changeBtn() //reenables buttons
            }
          }
        }
      }
      setTimeout(checkStatus,2100,[pk1,pk2])
      setTimeout(changeBar,2200,pk1,pk2,0)
      changeBtn()
      //changeBar(pk1,pk2,moveOrder)
      moveTurn++
    });
  }
}

function attack(move, attacker, receiver, order) {
  let flinch = 0;
  let dmgDone = 0;
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
    if(move.meta != null) {
      checkMeta(move.meta,dmgDone,attacker,receiver,order)
    }
    if(move.changes != null) { //reduce or raise stats check
      console.log('Changes: '+move.changes.length);
      let self = ['user','user-or-ally','users-field','user-and-allies']
      let target = self.includes(move.target) ? attacker : receiver
      let msg = target.changeStats(move.changes[0])
      addComment("<span>"+target.name+"'s</span> "+msg)
    }
    if(move.meta != null) flinch = move.meta.flinch_chance
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
    if(pokes[i].hp.now <= 0) {
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

startBattle()