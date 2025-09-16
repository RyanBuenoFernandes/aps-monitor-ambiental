// --- CONFIGURAÇÕES E ELEMENTOS GLOBAIS ---
const apiUrl = 'http://localhost:3000';
let consumoChart = null;
let recursoAtual = 'agua';

// Formulários
const formLancamento = document.getElementById('form-lancamento');
const formMeta = document.getElementById('form-meta');

// Botões de Filtro
const btnAgua = document.getElementById('btn-agua');
const btnEnergia = document.getElementById('btn-energia');

// NOVO: Elementos dos cards
const ultimoConsumoEl = document.getElementById('ultimo-consumo');
const mediaMensalEl = document.getElementById('media-mensal');
const statusMetaEl = document.getElementById('status-meta');

// NOVO: Elemento da mensagem de sucesso
const msgSucessoEl = document.getElementById('msg-sucesso');

// --- FUNÇÕES ---

// Função principal para buscar dados e renderizar o dashboard
async function atualizarDashboard() {
    try {
        const [leiturasRes, metasRes] = await Promise.all([
            fetch(`${apiUrl}/leituras`),
            fetch(`${apiUrl}/metas`)
        ]);

        if (!leiturasRes.ok || !metasRes.ok) {
            throw new Error('Falha ao buscar dados do servidor.');
        }

        const leituras = await leiturasRes.json();
        const metas = await metasRes.json();

        const dadosFiltrados = leituras
            .filter(l => l.recurso === recursoAtual)
            .sort((a, b) => new Date(a.mesAno) - new Date(b.mesAno));

        const labels = dadosFiltrados.map(l => l.mesAno);
        const data = dadosFiltrados.map(l => l.consumo);
        const metaAtual = metas[recursoAtual] || 0;
        const metaData = labels.map(() => metaAtual);

        renderizarGrafico(labels, data, metaData);
        // NOVO: Chama a função para atualizar os cards
        atualizarCards(dadosFiltrados, metaAtual);

    } catch (error) {
        console.error("Erro ao atualizar dashboard:", error);
        // Lidar com o erro na UI se desejar
    }
}

// NOVO: Função dedicada para atualizar os cards de resumo
// NOVO: Função dedicada para atualizar os cards de resumo (COM A CORREÇÃO)
function atualizarCards(dados, meta) {
    if (dados.length === 0) {
        ultimoConsumoEl.textContent = '-';
        mediaMensalEl.textContent = '-';
        statusMetaEl.textContent = '-';
        statusMetaEl.className = '';
        return;
    }

    // Card: Último Consumo
    const ultimoConsumo = dados[dados.length - 1].consumo;
    ultimoConsumoEl.textContent = parseFloat(ultimoConsumo).toFixed(2); // Adicionado toFixed para padronizar a exibição

    // Card: Média Mensal
    const soma = dados.reduce((acc, l) => acc + parseFloat(l.consumo), 0);
    const media = soma / dados.length;
    mediaMensalEl.textContent = media.toFixed(2); // Adicionado toFixed

    // Card: Status da Meta
    // --- AQUI ESTÁ A CORREÇÃO ---
    // Comparamos os valores como números, e não como texto
    if (parseFloat(ultimoConsumo) > parseFloat(meta)) {
        statusMetaEl.textContent = 'Acima da Meta';
        statusMetaEl.className = 'status-ruim'; // Aplica a classe de cor vermelha
    } else {
        statusMetaEl.textContent = 'Abaixo da Meta';
        statusMetaEl.className = 'status-bom'; // Aplica a classe de cor verde
    }
}

// Função para criar ou atualizar o gráfico (sem alterações)
function renderizarGrafico(labels, data, metaData) {
    const ctx = document.getElementById('consumoChart').getContext('2d');
    if (consumoChart) {
        consumoChart.destroy();
    }
    consumoChart = new Chart(ctx, { /* ... (código do gráfico sem alterações) ... */
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: `Consumo de ${recursoAtual === 'agua' ? 'Água (m³)' : 'Energia (kWh)'}`,
                    data: data,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Meta',
                    data: metaData,
                    type: 'line',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0,
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// NOVO: Função para mostrar a mensagem de sucesso e escondê-la
function mostrarMensagemSucesso() {
    msgSucessoEl.classList.remove('hidden');
    setTimeout(() => {
        msgSucessoEl.classList.add('hidden');
    }, 3000); // A mensagem some após 3 segundos
}

// --- EVENT LISTENERS ---

// Adicionar novo lançamento
formLancamento.addEventListener('submit', async (event) => {
    event.preventDefault();
    // ... (código de pegar os dados do form) ...
    const novaLeitura = {
        recurso: document.getElementById('recurso').value,
        mesAno: document.getElementById('mes-ano').value,
        consumo: document.getElementById('consumo').value,
    };

    await fetch(`${apiUrl}/leituras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaLeitura),
    });

    formLancamento.reset();
    atualizarDashboard();
    mostrarMensagemSucesso(); // NOVO
});

// Atualizar meta
formMeta.addEventListener('submit', async (event) => {
    event.preventDefault();
    // ... (código de pegar os dados do form) ...
    const meta = {
        recurso: document.getElementById('recurso-meta').value,
        valor: document.getElementById('valor-meta').value
    };

    await fetch(`${apiUrl}/metas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meta),
    });

    formMeta.reset();
    atualizarDashboard();
    mostrarMensagemSucesso(); // NOVO
});

// Botões de filtro
btnAgua.addEventListener('click', () => {
    recursoAtual = 'agua';
    // NOVO: Lógica para destacar o botão ativo
    btnEnergia.classList.remove('filtro-ativo');
    btnAgua.classList.add('filtro-ativo');
    atualizarDashboard();
});

btnEnergia.addEventListener('click', () => {
    recursoAtual = 'energia';
    // NOVO: Lógica para destacar o botão ativo
    btnAgua.classList.remove('filtro-ativo');
    btnEnergia.classList.add('filtro-ativo');
    atualizarDashboard();
});


// --- INICIALIZAÇÃO ---
atualizarDashboard();