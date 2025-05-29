document.addEventListener('DOMContentLoaded', function() {
    const quartosContainer = document.getElementById('quartos-container');
    const searchForm = document.querySelector('form');

    async function fetchQuartos(filters = {}) {
        try {
            const url = new URL('http://localhost:3332/quarto');
            Object.entries(filters).forEach(([key, value]) => {
                if (value) url.searchParams.append(key, value);
            });

            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`Erro HTTP! status: ${response.status}`);
            
            return await response.json();
        } catch (error) {
            console.error('Falha na requisição:', error);
            throw error;
        }
    }

    function renderQuartos(quartos) {
    quartosContainer.innerHTML = '';
    
    if (quartos.length === 0) {
        quartosContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <h4>Nenhum quarto encontrado com os filtros selecionados</h4>
            </div>
        `;
        return;
    }
   
    quartos.forEach(quarto => {
        const cardHTML = `
            <div class="col-lg-4">
                        <div class="card shadow mt-4">
                            <img src="img/${quarto.tipo}.png" class="card-img-top img-card img-solid" alt="">
                            <div class="card-body px-4">
                                <div class="card-title d-flex  justify-content-between">
                                <h3>${quarto.tipo}</h3>  
                                <div class="star d-flex align-items-center">
                                <i class="fa-solid fa-star mb-2 px-1" style="color: #E5A000;" aria-hidden="true"></i>
                                <h5>4.9</h5>
                            </div>
                            </div>                             
                                <div class="row pt-2">

                                    <div class="col-6">
                                        <div class="d-flex align-items-center pb-3">
                                            <i class="fa-solid fa-ruler-combined fa-xl" style="color: #000000;" aria-hidden="true"></i>
                                            <p class="px-3">${quarto.tamanho}</p>
                                        </div>
                                        <div class="d-flex align-items-center">
                                            <i class="fa-solid fa-bed fa-lg" style="color: #000000;" aria-hidden="true"></i>
                                            <p class="px-3">${quarto.tipo_cama}</p>
                                        </div>
                                    </div>

                                    <div class="col-6">
                                        <div class="d-flex align-items-center pb-3">
                                            <i class="fa-solid fa-users fa-lg" style="color: #000000;" aria-hidden="true"></i>
                                            <p class="px-3">${quarto.num_hospedes} hóspedes</p>
                                        </div>
                                        <div class="d-flex align-items-center pb-3">
                                            <i class="fa-solid fa-building fa-xl" style="color: #000000;" aria-hidden="true"></i>
                                            <p class="px-3">${quarto.hotel}</p>
                                        </div>
                                    </div>
                                    
                                    <div class="col-6">
                                        <div class="d-flex align-items-center pb-3">
                                            <p>R$${quarto.preco_noite}/noite</p>
                                        </div>
                                    </div>

                                    <div class="col-6 mb-2">
                                        <div class="d-flex justify-content-end">
                                            <a href="reserva.html?id=${quarto.quarto_id}" class="btn btn-royal">
                                        Reserve Agora
                                            </a>
                                </div>
                            </div>

                                 
                                </div>

                            </div>
                        </div>
                    </div>
        `;
        
        quartosContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

    function showError(error) {
        quartosContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-danger">
                    Erro ao carregar quartos: ${error.message}
                </div>
            </div>
        `;
    }

async function handleSearch(e) {
    e.preventDefault();
    
    const filters = {
        hotel: document.getElementById('hotel').value,
        tipo: document.getElementById('room').value,
        capacidade: document.getElementById('guests').value
    };

    try {
        const quartos = await fetchQuartos(filters);
        renderQuartos(quartos);
    } catch (error) {
        showError(error);
    }
}

    fetchQuartos()
        .then(renderQuartos)
        .catch(showError);

    searchForm.addEventListener('submit', handleSearch);
});
