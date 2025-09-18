// --- CONSTANTES E VARIÁVEIS GLOBAIS ---
const API_URL = 'http://localhost:3000';
let map;
let tempMarker = null;
let goiasPolygon = null;
let approvedMarkersLayer = null;
let pendingMarkersLayer = null;

// Ícone customizado para os pontos pendentes
const yellowIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// --- ELEMENTOS DO DOM ---
const form = document.getElementById('ponto-form');
const latitudeInput = document.getElementById('latitude');
const longitudeInput = document.getElementById('longitude');
const btnCidadao = document.getElementById('btn-cidadao');
const btnGestor = document.getElementById('btn-gestor');
const viewCidadao = document.getElementById('view-cidadao');
const viewGestor = document.getElementById('view-gestor');
const listaPendentes = document.getElementById('lista-pendentes');
// NOVO: Elementos para a nova aba do gestor
const btnTabPendentes = document.getElementById('btn-tab-pendentes');
const btnTabAprovados = document.getElementById('btn-tab-aprovados');
const tabPendentes = document.getElementById('tab-pendentes');
const tabAprovados = document.getElementById('tab-aprovados');
const listaAprovados = document.getElementById('lista-aprovados');


// --- FUNÇÕES PRINCIPAIS ---

// 1. INICIALIZA O MAPA
async function inicializarMapa() {
    const cantoSudoeste = L.latLng(-19.8, -53.3);
    const cantoNordeste = L.latLng(-12.3, -45.8);
    const limitesGoiás = L.latLngBounds(cantoSudoeste, cantoNordeste);

    map = L.map('map', {
        center: [-16.3, -49.5],
        zoom: 7,
        maxBounds: limitesGoiás,
        minZoom: 7
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    approvedMarkersLayer = L.layerGroup().addTo(map);
    pendingMarkersLayer = L.layerGroup();

    try {
        const response = await fetch(`goias.geojson?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`Erro ao buscar o arquivo: ${response.statusText}`);
        const goiasData = await response.json();

        goiasPolygon = turf.multiPolygon(goiasData.features[0].geometry.coordinates);
        const goiasCoords = goiasData.features[0].geometry.coordinates[0][0].map(coord => [coord[1], coord[0]]);
        const worldRectangle = [[90, -180], [90, 180], [-90, 180], [-90, -180]];

        L.polygon([worldRectangle, goiasCoords], {
            color: '#212529', fillColor: '#212529', fillOpacity: 0.4,
            stroke: false, interactive: false
        }).addTo(map);
    } catch (error) {
        console.error("ERRO CRÍTICO ao carregar goias.geojson.", error);
        alert("Não foi possível carregar o contorno do estado.");
    }

    carregarPontosAprovados();
    map.on('click', onMapClick);

    L.Control.geocoder({
        placeholder: 'Buscar endereço ou local em Goiás...',
        defaultMarkGeocode: false,
        geocoder: L.Control.Geocoder.nominatim({ viewbox: [-53.2, -12.4, -49.5, -19.5], bounded: true })
    })
        .on('markgeocode', function (e) {
            const center = e.geocode.center;
            const ponto = turf.point([center.lng, center.lat]);
            if (goiasPolygon && turf.booleanPointInPolygon(ponto, goiasPolygon)) {
                map.setView(center, 16);
                onMapClick({ latlng: center });
            } else {
                alert("O local pesquisado está fora dos limites de Goiás.");
            }
        })
        .addTo(map);
}

// 2. CARREGA E EXIBE OS PONTOS APROVADOS NO MAPA
async function carregarPontosAprovados() {
    try {
        const response = await fetch(`${API_URL}/pontos/aprovados`);
        const pontos = await response.json();

        approvedMarkersLayer.clearLayers();

        pontos.forEach(ponto => {
            L.marker([ponto.latitude, ponto.longitude])
                .addTo(approvedMarkersLayer)
                .bindPopup(`<b>${ponto.nome_ponto}</b><br>${ponto.descricao}`);
        });
    } catch (error) {
        console.error('Erro ao carregar pontos aprovados:', error);
    }
}

// 3. LIDA COM O CLIQUE NO MAPA
function onMapClick(e) {
    const { lat, lng } = e.latlng;
    const pontoClicado = turf.point([lng, lat]);

    if (goiasPolygon && !turf.booleanPointInPolygon(pontoClicado, goiasPolygon)) {
        alert("Você só pode adicionar pontos dentro do estado de Goiás.");
        return;
    }

    if (tempMarker) map.removeLayer(tempMarker);
    tempMarker = L.marker([lat, lng]).addTo(map)
        .bindPopup('Novo ponto ecológico será adicionado aqui.').openPopup();

    latitudeInput.value = lat;
    longitudeInput.value = lng;
}

// 4. CARREGA OS PONTOS PENDENTES PARA A LISTA E MAPA DO GESTOR
async function carregarPontosPendentes() {
    try {
        const response = await fetch(`${API_URL}/pontos/pendentes`);
        const pontos = await response.json();

        listaPendentes.innerHTML = '';
        pendingMarkersLayer.clearLayers();

        if (pontos.length === 0) {
            listaPendentes.innerHTML = '<p>Nenhum ponto pendente de análise.</p>';
            return;
        }

        pontos.forEach(ponto => {
            const item = document.createElement('li');
            item.innerHTML = `
                <h3>${ponto.nome_ponto}</h3>
                <p>${ponto.descricao}</p>
                <div class="botoes-gestor">
                    <button class="btn-aprovar" data-id="${ponto.id}">Aprovar</button>
                    <button class="btn-recusar" data-id="${ponto.id}">Recusar</button>
                </div>
            `;
            listaPendentes.appendChild(item);

            const marker = L.marker([ponto.latitude, ponto.longitude], { icon: yellowIcon })
                .addTo(pendingMarkersLayer)
                .bindPopup(`<b>Pendente:</b> ${ponto.nome_ponto}`);

            item.addEventListener('click', () => {
                map.flyTo([ponto.latitude, ponto.longitude], 15);
                marker.openPopup();
            });
        });
    } catch (error) {
        console.error('Erro ao carregar pontos pendentes:', error);
    }
}

// NOVO: Função para carregar os pontos aprovados na lista do gestor
async function carregarListaDeAprovados() {
    try {
        const response = await fetch(`${API_URL}/pontos/aprovados`);
        const pontos = await response.json();

        listaAprovados.innerHTML = '';
        if (pontos.length === 0) {
            listaAprovados.innerHTML = '<p>Nenhum ponto aprovado no mapa.</p>';
            return;
        }

        pontos.forEach(ponto => {
            const item = document.createElement('li');
            item.innerHTML = `
                <h3>${ponto.nome_ponto}</h3>
                <p>${ponto.descricao}</p>
                <div class="botoes-gestor">
                    <button class="btn-recusar" data-id="${ponto.id}">Excluir do Mapa</button>
                </div>
            `;
            listaAprovados.appendChild(item);
        });
    } catch (error) {
        console.error('Erro ao carregar lista de aprovados:', error);
    }
}

// --- EVENT LISTENERS ---

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!latitudeInput.value || !longitudeInput.value) {
        alert('Por favor, clique no mapa para selecionar uma localização.');
        return;
    }
    const dados = {
        nome_ponto: document.getElementById('nome_ponto').value,
        descricao: document.getElementById('descricao').value,
        latitude: latitudeInput.value,
        longitude: longitudeInput.value
    };
    try {
        await fetch(`${API_URL}/pontos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        alert('Sugestão enviada com sucesso! Aguardando análise do gestor.');
        form.reset();
        if (tempMarker) map.removeLayer(tempMarker);
        tempMarker = null;
    } catch (error) {
        console.error('Erro ao enviar ponto:', error);
        alert('Falha ao enviar sugestão.');
    }
});

// Listeners de navegação principal
btnCidadao.addEventListener('click', () => {
    viewCidadao.classList.remove('hidden');
    viewGestor.classList.add('hidden');
    btnCidadao.classList.add('active');
    btnGestor.classList.remove('active');
    if (map.hasLayer(pendingMarkersLayer)) {
        map.removeLayer(pendingMarkersLayer);
    }
});

btnGestor.addEventListener('click', () => {
    viewGestor.classList.remove('hidden');
    viewCidadao.classList.add('hidden');
    btnGestor.classList.add('active');
    btnCidadao.classList.remove('active');
    map.addLayer(pendingMarkersLayer);
    carregarPontosPendentes();
    // Garante que a aba de pendentes seja a padrão
    btnTabPendentes.click();
});

// Listeners das abas do gestor
btnTabPendentes.addEventListener('click', () => {
    tabPendentes.classList.remove('hidden');
    tabAprovados.classList.add('hidden');
    btnTabPendentes.classList.add('active');
    btnTabAprovados.classList.remove('active');
    map.addLayer(pendingMarkersLayer); // Mostra marcadores amarelos
    carregarPontosPendentes();
});

btnTabAprovados.addEventListener('click', () => {
    tabAprovados.classList.remove('hidden');
    tabPendentes.classList.add('hidden');
    btnTabAprovados.classList.add('active');
    btnTabPendentes.classList.remove('active');
    if (map.hasLayer(pendingMarkersLayer)) { // Esconde marcadores amarelos
        map.removeLayer(pendingMarkersLayer);
    }
    carregarListaDeAprovados();
});


// Listener para a lista de PENDENTES (Aprovar/Recusar)
listaPendentes.addEventListener('click', async (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains('btn-aprovar')) {
        await fetch(`${API_URL}/pontos/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'aprovado' })
        });
        alert('Ponto aprovado e adicionado ao mapa!');
        carregarPontosAprovados(); // Recarrega os pontos azuis no mapa
    }

    if (e.target.classList.contains('btn-recusar')) {
        await fetch(`${API_URL}/pontos/${id}`, { method: 'DELETE' });
        alert('Ponto recusado e removido.');
    }

    carregarPontosPendentes(); // Recarrega a lista de pendentes
});

// NOVO: Listener para a lista de APROVADOS (Excluir)
listaAprovados.addEventListener('click', async (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains('btn-recusar')) { // Usamos a mesma classe de botão para deletar
        if (confirm(`Tem certeza que deseja excluir o ponto #${id} do mapa?`)) {
            await fetch(`${API_URL}/pontos/${id}`, { method: 'DELETE' });
            alert('Ponto removido do mapa.');
            carregarPontosAprovados(); // Recarrega os pontos azuis no mapa
            carregarListaDeAprovados(); // Recarrega a lista de aprovados
        }
    }
});

// --- INICIALIZAÇÃO DO SCRIPT ---
inicializarMapa();