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
        getByGen(chosenGen)
    }
    console.log("Gen chosen: "+event.target.value)
})

optType.addEventListener('change', (event) => {
    console.log("Last type: "+chosenType)
    if(event.target.value != chosenType) {
        while (pokeContainer.firstChild) pokeContainer.removeChild(pokeContainer.firstChild)
        chosenType = event.target.value
        getByType(chosenType)
    }
    console.log("Type chosen: "+event.target.value)
})

if(document.querySelector('input[name="form"]')){
    document.querySelectorAll('input[name="form"]').forEach((elem) => {
        elem.addEventListener("click", function(event){
            chosenForm = event.target.value;
        });
    });
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
    fetchPokemons(data.pokemon_species, 'gen')
}

const getByType = async(id) => {
    let url = 'https://pokeapi.co/api/v2/type/'+id
    let resp = await fetch(url)
    let data = await resp.json()
    fetchPokemons(data.pokemon, 'type')
}

function countPkm(t){
    totalPkm.innerHTML = "Total: "+t;
}

const fetchPokemons = async(x, y) => {
    var t = countPkm();
    if(y==='gen'){
        let na = new Array;
        for (let i = 0; i < x.length; i++) {
            let id = x[i].url.replace('https://pokeapi.co/api/v2/pokemon-species/','')
            na.push(id.replace('/',''))
            na.sort((a, b) => a - b)
        }
        for (t = 0; t < na.length; t++) {
            await getPokemons('https://pokeapi.co/api/v2/pokemon/'+na[t]).then(countPkm("Loading..."));
        }
    } else {
        for (t = 0; t < x.length; t++) {
            await getPokemons(x[t].pokemon.url).then(countPkm("Loading..."));
        }
    }
    countPkm(t);
}

const getPokemons = async(url) => {
    let resp = await fetch(url)
    let data = await resp.json()
    createCard(data)
}

const createCard = (poke) => {
    const card = document.createElement('div')
    card.classList.add('pokemon')

    let img = poke.sprites.versions['generation-v']['black-white'].animated['front_'+chosenForm] || poke.sprites['front_'+chosenForm]
    let name = poke.species['name']
    let number = poke.id.toString().padStart(5,'0')
    let pokeTypes = poke.types.map(typeInfo => typeInfo.type.name)
    let color = pokeColors[pokeTypes[0]]
    
    if(pokeTypes.length > 1) {
        let secondColor = pokeColors[pokeTypes[1]]
        card.style.backgroundImage = 'linear-gradient('+color+' 20%, '+secondColor+' 100%)'
    } else {
        card.style.backgroundImage = 'linear-gradient('+color+' 40%, rgba(0,0,0,0.15) 80%, '+color+' 100%)'
    }

    card.innerHTML = `
    <div class="image">
        <span class="middle"></span>
        <img src="${img}" alt="${name}">
    </div>
    <div class="info">
        <span class="number">#${number}</span>
        <h3 class="name">${name}</h3>
        <small class="type">${pokeTypes.join(' - ')}</small>
    </div>`
    
    pokeContainer.appendChild(card)
}
getByGen(chosenGen)