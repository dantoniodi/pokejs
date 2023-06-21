//Damage calculation formula
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
    case 'physical': 
      A = ata.stats['attack'].current;
      D = rec.stats['defense'].current;
      break;
    case 'special': 
      A = ata.stats['special-attack'].current;
      D = rec.stats['special-defense'].current;
      break;
  }
  let stab = ata.type.map(typeInfo => typeInfo[0])
  if (stab.includes(move.type)) {
    X = 1.5;
  }
  let baseDmg = ((2*L*C/5+2)*B*A/D)/50 //never changes
  let totalDmg = Math.floor(((baseDmg+2)*X*Y)*Z/255) //gen 1 formula
  let finalDmg = totalDmg > rec.hp ? rec.hp : totalDmg //prevents overkill
  console.log('Damage(base|total|final): '+Math.floor(baseDmg)+', '+totalDmg+', '+finalDmg)
  return finalDmg
}