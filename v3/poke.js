const lv = Math.floor(Math.random() * (99 - 15)) + 15 //both level (15-99)
const ev = 0 //effort values, since both are wild pokemon their ev is zero

class Pokemon {
  constructor() {
    this.lv = lv;
  }
  async create(info) {
    this.id = info.id
    this.hp = this.calcHP(info.stats)
    this.name = info.species.name;
    this.sprite = info.sprites;
    this.nature = await this.getNature()
    this.type = await this.getType(info.types);
    this.moveset = await this.setMovePool(info.moves);
    this.stats = await this.calcStat(info.stats);
    this.stats.evasion = {current:100,initial:100,stage:0}
    this.stats.accuracy = {current:100,initial:100,stage:0}

  }
  static async getData(id) {
    let url = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
    let data = await url.json()
    return data
  }
  async getType(types) {
    let typeRels = new Array()
    let typeName = new Array()
    for(let i=0; i<types.length; i++) {
      let data = await fetch(types[i].type.url).then(resp => resp.json())
      typeName.push(data.name)
      typeRels.push([
        data.damage_relations.no_damage_from.map(names => names.name),
        data.damage_relations.half_damage_from.map(names => names.name),
        data.damage_relations.double_damage_from.map(names => names.name)
      ])
    }
    return {name:typeName, rels:typeRels}
  }
  async getNature(id = Math.floor(Math.random() * 25 + 1)) {
    let data = await fetch(`https://pokeapi.co/api/v2/nature/${id}`).then(resp => resp.json())
    return {
      'name': data.name,
      'increased': data.increased_stat != null ? data.increased_stat.name : '',
      'decreased': data.decreased_stat != null ? data.decreased_stat.name : ''
    }
  }
  async setMovePool(pool) {
    let movePool = new Array(4)
    //let moveNum = new Set()
    let moveNum = new Set(['thunder-wave','toxic','will-o-wisp','sleep-powder'])
    /*while(moveNum.size < 4) { //add random numbers to an unique collection(set)
      moveNum.add(Math.floor(Math.random() * pool.length))
    }*/
    for(let i=0; i<4; i++) {
      //let moveInfo = await fetch(pool[Array.from(moveNum)[i]].move.url).then((resp) => resp.json())
      let moveInfo = await fetch('https://pokeapi.co/api/v2/move/'+Array.from(moveNum)[i]).then((resp) => resp.json())
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
  async calcStat(stats) {
    let iv = Math.floor(Math.random() * 31) //random IVs (0-31)
    let nat = this.nature
    let pokeStats = new Array()
    for(let i=1; i<stats.length; i++) { //starting on 1 skips hp
      let N = stats[i].stat.name === nat.increased ? 1.1 : stats[i].stat.name === nat.decreased ? 0.9 : 1
      pokeStats[stats[i].stat.name] = {
        'base': stats[i].base_stat,
        'initial': Math.floor(((0.01 * (2 * stats[i].base_stat + iv + Math.floor(0.25 * ev)) * lv) + 5) * N),
        'current': Math.floor(((0.01 * (2 * stats[i].base_stat + iv + Math.floor(0.25 * ev)) * lv) + 5) * N),
        'stage': 0
      } //current its a initial copy because it can change multiple times during battle
    }
    return pokeStats
  }
  calcHP(stat) { //Formula found on https://pokemon.fandom.com/wiki/Statistics
    let iv = Math.floor(Math.random() * 31)
    let hp = Math.floor(0.01 * (2 * stat[0].base_stat + iv + Math.floor(0.25 * ev)) * lv) + lv + 10
    return {now:hp,max:hp}
  }
  setStatus(value) { //updates condition
    console.log(this.type.name.includes('electric'));
    switch(value) {
      case 'paralysis':
        if(!(this.type.name.includes('electric'))) {
          this.status = value
          this.stats.speed.current = Math.floor(this.stats.speed.current/2);
        }
        break;
      case 'burn':
        if(!(this.type.name.includes('fire'))) {
          this.status = value
          this.stats.attack.current = Math.floor(this.stats.attack.current/2);
        }
        break;
      case 'poison':
        if(!(this.type.name.includes('steel'))) {
          this.status = value
        }
        break;
      case 'freeze':
        if(!(this.type.name.includes('ice'))) {
          this.status = value
        }
        break;
    }
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