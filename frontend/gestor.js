// --- ELEMENTOS DA PÁGINA ---
const tabelaCorpo = document.getElementById('tabela-denuncias-corpo');
const modal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const closeModal = document.querySelector('.close-modal');

const apiUrl = 'http://localhost:3000';

// --- FUNÇÕES ---

// Função principal para carregar e exibir todas as denúncias na tabela
async function carregarDenuncias() {
    try {
        const response = await fetch(`${apiUrl}/denuncias`);
        const denuncias = await response.json();

        // Limpa a tabela antes de preencher
        tabelaCorpo.innerHTML = '';

        denuncias.forEach(denuncia => {
            const tr = document.createElement('tr');

            const statusClass = `status-${denuncia.status.replace(' ', '_')}`;

            tr.innerHTML = `
        <td>${denuncia.id}</td>
        <td>${denuncia.nome_cidadao}</td>
        <td>${denuncia.local_problema}</td>
        <td><span class="status ${statusClass}">${denuncia.status}</span></td>
        <td>${new Date(denuncia.data_criacao).toLocaleString('pt-BR')}</td>
        <td>
          <button class="btn-ver-foto" data-id="${denuncia.id}">Ver Foto</button>
        </td>
        <td class="acoes">
          <button class="btn-analise" data-id="${denuncia.id}" title="Mover para Análise">Analisar</button>
          <button class="btn-resolver" data-id="${denuncia.id}" title="Marcar como Resolvida">Resolver</button>
          <button class="btn-deletar" data-id="${denuncia.id}" title="Deletar Denúncia">Excluir</button>
        </td>
      `;
            tabelaCorpo.appendChild(tr);
        });
    } catch (error) {
        console.error('Erro ao carregar denúncias:', error);
    }
}

// Função para atualizar o status de uma denúncia
async function atualizarStatus(id, novoStatus) {
    try {
        await fetch(`${apiUrl}/denuncias/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus })
        });
        // Recarrega a tabela para mostrar a atualização
        carregarDenuncias();
    } catch (error) {
        console.error(`Erro ao atualizar status para ${novoStatus}:`, error);
    }
}

// Função para deletar uma denúncia
async function deletarDenuncia(id) {
    // Pede uma confirmação antes de deletar
    if (confirm(`Tem certeza que deseja deletar a denúncia #${id}?`)) {
        try {
            await fetch(`${apiUrl}/denuncias/${id}`, { method: 'DELETE' });
            // Recarrega a tabela para mostrar a atualização
            carregarDenuncias();
        } catch (error) {
            console.error('Erro ao deletar denúncia:', error);
        }
    }
}

// --- LÓGICA DO MODAL DE IMAGEM ---
function abrirModalComFoto(id) {
    modalImage.src = `${apiUrl}/denuncias/${id}/foto`;
    modal.style.display = "block";
}

function fecharModal() {
    modal.style.display = "none";
}

// --- EVENT LISTENERS ---

// Listener principal na tabela para capturar cliques nos botões (event delegation)
tabelaCorpo.addEventListener('click', (event) => {
    const target = event.target;
    const id = target.dataset.id;

    if (target.classList.contains('btn-ver-foto')) {
        abrirModalComFoto(id);
    }
    if (target.classList.contains('btn-analise')) {
        atualizarStatus(id, 'analise');
    }
    if (target.classList.contains('btn-resolver')) {
        atualizarStatus(id, 'resolvida');
    }
    if (target.classList.contains('btn-deletar')) {
        deletarDenuncia(id);
    }
});

// Listeners para fechar o modal
closeModal.addEventListener('click', fecharModal);
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        fecharModal();
    }
});

// --- INICIALIZAÇÃO ---
// Carrega as denúncias assim que a página é aberta
carregarDenuncias();