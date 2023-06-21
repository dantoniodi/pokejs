const comment = document.querySelector(".comment")
const buttons = document.querySelectorAll('button.btn')
const condition = document.querySelectorAll(".cond p")
const hp_text = document.querySelectorAll(".hp .text")
const hp_bar = document.querySelectorAll(".hp .bar")

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
  
  let pkm = new Pokemon()
  let pdata = await Pokemon.getData(id)
  await pkm.init(pdata)
  console.log(pkm);
  if (bool) {
    for (i = 0; i < 4; i++) {
      let moveText = '<span class="name">'+pkm.moves[i].name+'</span><br>'
        +'<small>['+pkm.moves[i].type+' | Pwr: '+pkm.moves[i].power+' | Acc: '+pkm.moves[i].accuracy+'%]</small>'
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
  document.querySelector('#pk1 .info').innerHTML = "<span class='name'>"+pk1.name+"</span> Lv."+pk1.level
  hp_text[1].innerHTML = "<p>HP: "+pk1.hp.now+"/"+pk1.hp.max+"</p>"

  const pk2 = await spawn(false) //enemy poke
  s2 = document.createElement("img");
  s2.src = pk2.sprite.versions['generation-v']['black-white'].animated['front_default'];
  document.querySelector("#pk2 .image").appendChild(s2);
  document.querySelector("#pk2 .info").innerHTML = "<span class='name'>"+pk2.name+"</span> Lv."+pk2.level
  hp_text[0].innerHTML = "<p>HP: "+pk2.hp.now+"/"+pk2.hp.max+"</p>"

  let moveTurn = 1
  for (i = 0; i < 4; i++) {
    let btn = document.getElementById("m" + i)
    let move = pk1.moves[i]
    addHandler(btn, move, pk1, pk2);
  }

  function addHandler(btn, move, pk1, pk2) {
    btn.addEventListener("click", function (e) {
      
      checkButtons() //disables buttons after choosing a move
      console.log('Speed-check: '+pk1.stats.speed.current+', '+pk2.stats.speed.current);
      
      let foeMove = pk2.moves[Math.floor(Math.random() * 3)]
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
          if(pk2.hp.now > 0) {
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
          if(pk1.hp.now > 0) {
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
      receiver.hp.now -= dmgDone //inflict damage
      if(move.meta != null && move.meta.drain != 0) { 
        //calc draining effect, positive=drain/negative=recoil
        let drain = Math.floor(dmgDone * move.meta.drain / 100)
        if((attacker.hp.now + drain) > attacker.hp.max) { //prevents overheal
          attacker.hp.now = attacker.hp.max
        } else if((attacker.hp.now + drain) < 0) { //prevents negative HP by recoil
          attacker.hp.now = 0
        } else {
          attacker.hp.now += drain
        }
        console.log('Drain: '+drain)
      }
    }
    if(move.meta != null && move.meta.healing > 0) {
      let heal = Math.floor(attacker.hp.max*move.meta.healing/100)
      if(attacker.hp.now + heal > attacker.hp.max) { //prevents overheal
        attacker.hp.now = attacker.hp.max
      } else {
        attacker.hp.now += heal
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

createPokes()