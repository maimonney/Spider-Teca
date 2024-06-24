const busqueda = document.querySelector('#busqueda');
const busquedaInput = document.querySelector('#busquedaInput');
const resultado = document.querySelector('#resultado');
const recomendacionesTitulo = document.querySelector('#recomendaciones h2');
const keyApi = 'af2310de';

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('index.html')) {
        cargarRecomendaciones();
        
        busqueda.addEventListener('submit', function(e) {
            e.preventDefault();
            const valorIngresado = busquedaInput.value.trim();
            
            if (valorIngresado) {
                cargarPeli(valorIngresado);
            }
        });
        
        resultado.addEventListener('click', function(event) {
            if (event.target.classList.contains('verMasBtn')) {
                const idPeli = event.target.getAttribute('data-id');
                window.location.href = `info_completa.html?id=${idPeli}`;
            } else if (event.target.classList.contains('favoritoBtn')) {
                const idPeli = event.target.getAttribute('data-id');
                const tituloPeli = event.target.getAttribute('data-title');
                const posterPeli = event.target.getAttribute('data-poster');
                
                const pelicula = {
                    imdbID: idPeli,
                    Title: tituloPeli,
                    Poster: posterPeli
                };
        
                agregarFav(pelicula);
        
                let isFavorito = false;
                const favoritoBtn = event.target;
                
                isFavorito = !isFavorito;
                
                if (isFavorito) {
                    favoritoBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
                } else {
                    favoritoBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
                }
            }
        });
    }
    
    if (window.location.pathname.includes('historial.html')) {
        mostrarFavoritos();
    
        document.getElementById('fav').addEventListener('click', function(event) {
            if (event.target.classList.contains('favoritoBtn')) {
                const idPeli = event.target.getAttribute('data-id');
                
                quitarDeFavoritos(idPeli);
                
                event.target.innerHTML = '<i class="fa-regular fa-heart"></i>';
            }
        });
    }

    if (window.location.pathname.includes('info_completa.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const idPeli = urlParams.get('id');
        
        if (idPeli) {
            mostrarInfoCompleta(idPeli);
        } else {
            const infoPeli = document.getElementById('info_peli');
            infoPeli.innerHTML = '<p>No se ha proporcionado una película válida</p>';
        }
    }
});

async function cargarPeli(buscarPeli) {
    const urlApi = `https://www.omdbapi.com/?s=${buscarPeli}&apikey=${keyApi}`;
    
    try {
        const response = await fetch(urlApi);
        const data = await response.json();
        
        if (data.Response === 'True') {
            listaPelis(data.Search);
            actualizarTituloRecomendaciones(buscarPeli);
        } else {
            resultado.innerHTML = '<p>No se encontraron resultados</p>';
            actualizarTituloRecomendaciones('');
        }
    } catch (error) {
        console.error('Error al obtener datos:', error);
        resultado.innerHTML = '<p>Error al cargar datos</p>';
    }
}

async function cargarRecomendaciones() {
    const peliculasRecomendadas = ["Batman", "Avengers", "Titanic", "Jurassic Park"];
    
    let todasPelis = [];

    for (const pelicula of peliculasRecomendadas) {
        const urlApi = `https://www.omdbapi.com/?s=${pelicula}&apikey=${keyApi}`;
        try {
            const response = await fetch(urlApi);
            const data = await response.json();
            
            if (data.Response === 'True') {
                todasPelis = todasPelis.concat(data.Search);
            }
        } catch (error) {
            console.error('Error al obtener datos:', error);
        }
    }

    listaPelis(todasPelis);
}

function listaPelis(pelis) {
    resultado.innerHTML = '';

    const promesas = pelis.map(async (peli) => {
        const peliculaDiv = document.createElement('div');
        const tituloPeli = peli.Title;
        const posterPeli = peli.Poster;
        const idPeli = peli.imdbID;
        
        resultado.appendChild(peliculaDiv);

        peliculaDiv.innerHTML = `
        <div class="card m-3" style="width: 15rem;">
            <img src="${posterPeli}" class="card-img-top" alt="${tituloPeli}" onerror="this.alt = 'Imagen no encontrada';">
            <div class="card-body">
                <h3 class="card-title" style="color: #3a125f;">${tituloPeli}</h3>
                <button class="favoritoBtn" data-id="${idPeli}" data-title="${tituloPeli}" data-poster="${posterPeli}"><i class="fa-regular fa-heart"></i></button>
                <p class="card-text" id="fecha-${idPeli}"></p>
                <p class="card-text" id="autor-${idPeli}"></p>
                <button class="verMasBtn btn btn-primary" data-id="${idPeli}">Ver Más</button>
            </div>
        </div>
        `;        

        return obtenerDetalles(idPeli, peliculaDiv);
    });

    Promise.all(promesas)
    .then((detalles) => {
        console.log('Se encontraron detalles', detalles);
    })
    .catch(error => {
        console.error('Error al obtener los detalles:', error);
        resultado.innerHTML = '<p>No se encontró la información</p>';
    });
}

async function obtenerDetalles(id, div){
    const urlApi = `https://www.omdbapi.com/?i=${id}&apikey=${keyApi}`;
    const resultadoApi = await fetch(urlApi);
    const data = await resultadoApi.json();

    const fecha = data.Year;
    const autor = data.Writer;

    div.querySelector(`#fecha-${id}`).textContent = `Año: ${fecha}`;
    
    const autorElement = div.querySelector(`#autor-${id}`);
    
    if (autor && autor !== "N/A") {
        autorElement.textContent = `Autor: ${autor}`;
    } else {
        autorElement.textContent = 'Autor no encontrado';
    }

    return { id, fecha, autor };
}

function actualizarTituloRecomendaciones(busqueda) {
    if (busqueda) {
        recomendacionesTitulo.textContent = `Recomendaciones para "${busqueda}"`;
    } else {
        recomendacionesTitulo.textContent = 'Recomendaciones de la página';
    }
}

function agregarFav(pelicula) {
    let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
    
    let isDuplicate = false;

    for (let i = 0; i < favoritos.length; i++) {
        if (favoritos[i].imdbID === pelicula.imdbID) {
            isDuplicate = true;
            break;
        }
    }

    if (!isDuplicate) {
        favoritos.push(pelicula);
        localStorage.setItem('favoritos', JSON.stringify(favoritos));
    }
}

function mostrarFavoritos() {
    const favoritos = obtenerFav(); 
    const favDiv = document.getElementById('fav');

    favDiv.innerHTML = '';
    
    if (favoritos.length === 0) {
        favDiv.innerHTML = '<p>Todavía no agregaste ninguna película a tus favoritos</p>';
        return;
    }

    const promesas = favoritos.map(async (pelicula) => {
        const peliculaDiv = document.createElement('div');
        const tituloPeli = pelicula.Title;
        const posterPeli = pelicula.Poster;
        const idPeli = pelicula.imdbID;

        peliculaDiv.innerHTML = `
        <div class="card m-3" style="width: 15rem;">
            <img src="${posterPeli}" class="card-img-top" alt="${tituloPeli}" onerror="this.alt = 'Imagen no encontrada';">
            <div class="card-body">
                <h3 class="card-title" style="color: #3a125f;">${tituloPeli}</h3>
                <button class="favoritoBtn" data-id="${idPeli}" data-title="${tituloPeli}" data-poster="${posterPeli}"><i class="fa-solid fa-heart"></i></button>
                <p class="card-text" id="fecha-${idPeli}"></p>
                <p class="card-text" id="autor-${idPeli}"></p>
                <button class="verMasBtn btn btn-primary" data-id="${idPeli}">Ver Más</button>
            </div>
        </div>
        `;

        favDiv.appendChild(peliculaDiv);
        
        return obtenerDetalles(idPeli, peliculaDiv);
    });

    Promise.all(promesas)
    .then((detalles) => {
        console.log('Se encontraron detalles', detalles);
    })
    .catch(error => {
        console.error('Error al obtener los detalles:', error);
        favDiv.innerHTML = '<p>Error al cargar los detalles de las películas favoritas</p>';
    });

    favDiv.addEventListener('click', function(event) {
        if (event.target.classList.contains('favoritoBtn')) {
            const idPeli = event.target.getAttribute('data-id');
            quitarDeFavoritos(idPeli);
            event.target.innerHTML = '<i class="fa-regular fa-heart"></i>';
        } else if (event.target.classList.contains('verMasBtn')) {
            const idPeli = event.target.getAttribute('data-id');
            window.location.href = `info_completa.html?id=${idPeli}`;
        }
    });
}

function obtenerFav() {
    return JSON.parse(localStorage.getItem('favoritos')) || [];
}

function quitarDeFavoritos(idPeli) {
    let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
    
    favoritos = favoritos.filter(pelicula => pelicula.imdbID !== idPeli);
    
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
    
    mostrarFavoritos();
}

async function mostrarInfoCompleta(idPeli) {
    const urlApi = `https://www.omdbapi.com/?i=${idPeli}&apikey=${keyApi}`;
    try {
        const response = await fetch(urlApi);
        const data = await response.json();
        
        const infoPeli = document.getElementById('info_peli');
        if (data.Response === 'True') {
            infoPeli.innerHTML = `
                <div class="tarjeta_info">
                    <img src="${data.Poster}" alt="${data.Title}" onerror="this.alt = 'Imagen no encontrada';" class="mb-3">
                    <div class="card-body ms-3">
                        <div class="d-flex">
                        <h3 class="card-title" style="color: #3a125f;">${data.Title}</h3>
                        <button class="favoritoBtn ms-3" data-id="${data.imdbID}" data-title="${data.Title}" data-poster="${data.Poster}"><i class="fa-regular fa-heart"></i></button>
                        </div>
                        <p class="card-text"><strong>Año:</strong> ${data.Year}</p>
                        <p class="card-text"><strong>Autor:</strong> ${data.Writer}</p>
                        <p class="card-text"><strong>Director:</strong> ${data.Director}</p>
                        <p class="card-text"><strong>Actores:</strong> ${data.Actors}</p>
                        <p class="card-text"><strong>Sinopsis:</strong> ${data.Plot}</p>
                    </div>
                </div>
            `;
        } else {
            infoPeli.innerHTML = '<p>No se encontró la información de la película</p>';
        }
    } catch (error) {
        console.error('Error al obtener los detalles completos:', error);
        const infoPeli = document.getElementById('info_peli');
        infoPeli.innerHTML = '<p>Error al cargar los detalles completos de la película</p>';
    }
}
