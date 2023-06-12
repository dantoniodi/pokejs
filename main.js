var chosenGen = 1;
var chosenType = 0;
var chosenForm = 'default';
const pokeContainer = document.querySelector('.container');
const optGen = document.querySelector('#optGen');
const optType = document.querySelector('#optType');
const totalPkm = document.querySelector('.total');

optGen.addEventListener('change', (event) => {
    console.log("Last gen: "+chosenGen)
    if(event.target.value != chosenGen) {
        while (pokeContainer.firstChild) pokeContainer.removeChild(pokeContainer.firstChild)
        chosenGen = event.target.value
        optType.selectedIndex = 0
        chosenType = 0
        getByGen(chosenGen)
    }
    console.log("Gen chosen: "+event.target.value)
})

optType.addEventListener('change', (event) => {
    console.log("Last type: "+chosenType)
    if(event.target.value != chosenType) {
        while (pokeContainer.firstChild) pokeContainer.removeChild(pokeContainer.firstChild)
        chosenType = event.target.value
        optGen.selectedIndex = 0
        chosenGen = 0
        getByType(chosenType)
    }
    console.log("Type chosen: "+event.target.value)
})

if(document.querySelector('input[name="form"]')){
    document.querySelectorAll('input[name="form"]').forEach((elem) => {
        elem.addEventListener("click", function(event){
            if(event.target.value != chosenForm) {
                pokeContainer.innerHTML = ''
                chosenForm = event.target.value
                chosenType != 0 ? getByType(chosenType) : getByGen(chosenGen)
            }
        })
    })
}

//unused just for info
const pokeGen = {
    1: [1,151],
    2: [152,251],
    3: [252,386],
    4: [387,493],
    5: [494,649],
    6: [650,721],
    7: [722,809],
    8: [810,905],
    9: [906,1010]
}

const pokeColors = {
    fire: 'firebrick',
    grass: 'springgreen',
    electric: 'gold',
    water: 'royalblue',
    ground: 'sandybrown',
    rock: 'saddlebrown',
    fairy: 'pink',
    ghost: 'slateblue',
    poison: 'purple',
    bug: 'olive',
    dragon: 'teal',
    psychic: 'plum',
    flying: 'skyblue',
    fighting: 'salmon',
    normal: 'wheat',
    ice: 'aqua',
    steel: 'silver',
    dark: 'dimgrey'
}
const mainTypes = Object.keys(pokeColors);

const getByGen = async(id) => {
    let url = 'https://pokeapi.co/api/v2/generation/'+id
    let resp = await fetch(url)
    let data = await resp.json()
    fetchPokemons(data.pokemon_species)
}

const getByType = async(id) => {
    let url = 'https://pokeapi.co/api/v2/type/'+id
    let resp = await fetch(url)
    let data = await resp.json()
    fetchPokemons(data.pokemon)
}

const fetchPokemons = (x) => {
    for (var t = 0; t < x.length; t++) {
        fetch(getUrl(x[t].name || x[t].pokemon.name))
        .then(totalPkm.innerHTML = "Loading...")
        .then(resp => resp.json())
        .then(json => createCard(json))
    }
    totalPkm.innerHTML = "Total: "+t;
}

const getUrl = id => `https://pokeapi.co/api/v2/pokemon/${id}`

const createCard = (poke) => {
    const card = document.createElement('div')
    card.classList.add('flip-card')
    card.style.order = poke.id

    let img = poke.sprites.versions['generation-v']['black-white'].animated['front_'+chosenForm] || poke.sprites['front_'+chosenForm]
    let name = poke.species['name']
    let number = poke.id.toString().padStart(5,'0')
    let pokeTypes = poke.types.map(typeInfo => typeInfo.type.name)
    let abilities = poke.abilities.map(pokeAbs => pokeAbs.ability.name)
    let stats = poke.stats.map(pokeStats => pokeStats.base_stat)
    let color = pokeColors[pokeTypes[0]]
    var txtAbs = '';
    
    if(pokeTypes.length > 1) {
        let secondColor = pokeColors[pokeTypes[1]]
        card.style.background = 'linear-gradient('+color+' 20%, '+secondColor+' 100%)'
    } else {
        card.style.background = 'linear-gradient('+color+' 80%, white 150%'
    }
    
    for(let i=0; i<abilities.length; i++){
        txtAbs += '<span class="number">'+abilities[i]+'</span><br>';
    }
    
    card.innerHTML = `
    <div class="inner-card">
        <div class="front-card">
            <div class="image">
                <span class="middle"></span>
                <img src="${img}" alt="${name}">
            </div>
            <div class="info">
                <span class="number">#${number}</span>
                <h3 class="name">${name}</h3>
                <small class="type">${pokeTypes.join(' - ')}</small>
            </div>
        </div>
        <div class="back-card">
            <h3>Abilities:</h3>${txtAbs}<br>
            <h3>Base Stats:</h3>
            <p><small>HP: </small>${stats[0]}</p>
            <p><small>Attack: </small>${stats[1]}</p>
            <p><small>Defense: </small>${stats[2]}</p>
            <p><small>Sp. Attack: </small>${stats[3]}</p>
            <p><small>Sp. Defense: </small>${stats[4]}</p>
            <p><small>Speed: </small>${stats[5]}</p>
        </div>
    </div>`
    
    if(poke.is_default) pokeContainer.append(card)
}

getByGen(chosenGen)