// --- ELEMENTOS DA PÁGINA ---
const formDenuncia = document.getElementById('form-denuncia');
const nomeConsultaInput = document.getElementById('nome-consulta');
const btnConsultar = document.getElementById('btn-consultar');
const listaDenunciasDiv = document.getElementById('lista-denuncias');

const apiUrl = 'http://localhost:3000';

// --- EVENT LISTENERS ---

// Evento para o envio do formulário de nova denúncia
formDenuncia.addEventListener('submit', async (event) => {
    // Impede o recarregamento padrão da página
    event.preventDefault();

    // Cria um objeto FormData, que é especial para enviar formulários com arquivos
    const formData = new FormData();

    // Adiciona os campos de texto e o arquivo ao FormData
    formData.append('nome_cidadao', document.getElementById('nome_cidadao').value);
    formData.append('local_problema', document.getElementById('local_problema').value);
    formData.append('descricao', document.getElementById('descricao').value);
    // Para arquivos, pegamos o primeiro arquivo selecionado do input
    formData.append('foto', document.getElementById('foto').files[0]);

    try {
        const response = await fetch(`${apiUrl}/denuncias`, {
            method: 'POST',
            // Ao enviar FormData, o navegador define o Content-Type correto
            // (multipart/form-data) automaticamente. Não defina manualmente!
            body: formData,
        });

        if (!response.ok) {
            // Se o servidor retornar um erro, lança uma exceção
            throw new Error('Falha ao enviar denúncia. Status: ' + response.status);
        }

        const result = await response.json();
        alert(result.message); // Exibe a mensagem de sucesso
        formDenuncia.reset(); // Limpa o formulário

    } catch (error) {
        console.error('Erro no envio:', error);
        alert('Ocorreu um erro ao enviar sua denúncia. Tente novamente.');
    }
});


// Evento para o botão de consultar denúncias
btnConsultar.addEventListener('click', async () => {
    const nome = nomeConsultaInput.value.trim();
    if (!nome) {
        alert('Por favor, digite um nome para consultar.');
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/denuncias/cidadao/${nome}`);
        if (!response.ok) {
            throw new Error('Falha ao buscar denúncias.');
        }
        const denuncias = await response.json();
        exibirDenuncias(denuncias);
    } catch (error) {
        console.error('Erro na consulta:', error);
        alert('Não foi possível buscar suas denúncias.');
    }
});


// --- FUNÇÕES AUXILIARES ---

// Função para renderizar as denúncias na tela
// Função para renderizar as denúncias na tela (VERSÃO ATUALIZADA)
function exibirDenuncias(denuncias) {
    // Limpa a lista de resultados anteriores
    listaDenunciasDiv.innerHTML = '';

    if (denuncias.length === 0) {
        listaDenunciasDiv.innerHTML = '<p>Nenhuma denúncia em análise ou resolvida encontrada para este nome.</p>';
        return;
    }

    denuncias.forEach(denuncia => {
        // Cria um "card" para cada denúncia
        const card = document.createElement('div');
        // Adiciona a classe de cor baseada no status
        card.className = `denuncia-card status-${denuncia.status}`;

        card.innerHTML = `
      <h3>Local: ${denuncia.local_problema}</h3>
      <p><strong>Descrição:</strong> ${denuncia.descricao}</p>
      <p><strong>Data:</strong> ${new Date(denuncia.data_criacao).toLocaleDateString('pt-BR')}</p>
      <p>Status: <span class="status">${denuncia.status.toUpperCase()}</span></p>
      
      <img src="${apiUrl}/denuncias/${denuncia.id}/foto" alt="Foto da denúncia" class="denuncia-imagem">
    `;

        listaDenunciasDiv.appendChild(card);
    });
}