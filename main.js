const dropdownElementList = document.querySelectorAll('.dropdown-toggle')
const dropdownList = [...dropdownElementList].map(dropdownToggleEl => new bootstrap.Dropdown(dropdownToggleEl))

let horaLimitPedido = "00:00"

try {
    // Tenta obter a hora limite do Local Storage
    horaLimitPedido = localStorage.getItem('horaLimit');
    if (!horaLimitPedido) {
        horaLimitPedido = "09:00";
        localStorage.setItem('horaLimit', '09:00')
    }
} catch (x) {
    // Fallback em caso de erro no Local Storage
    horaLimitPedido = "09:01"
}

document.addEventListener('DOMContentLoaded', () => {

    const listaIngredientesContainer = document.getElementById('listaAddIngredientes');
    const cardapioEditor = document.getElementById('cardapio-editable');
    let ingredientesAtivos = [];

    // O cardapioBase agora contém a estrutura para separar itens e refrigerantes
    let cardapioBase = {
        cabecalho: `*Cardápio de hoje ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} 📅*`,
        itens: [],
        refrigerantes: [],
        rodape: (hora) => `*⚠️ FAZER OS SEUS PEDIDOS ATÉ ${hora} ⏰*<br><br>*Pix : 61823579000187*`
    };

    function atualizarCardapioVisual() {
        // Separa os itens ativos em "itens" (comida) e "refrigerantes" (bebidas)
        cardapioBase.itens = ingredientesAtivos
            .filter(item => item.data_produto !== 'refrigerante')
            .map(item => `•⁠  ⁠${item.texto}`); // Adiciona os espaços non-breaking conforme o exemplo
        
        // Formata os refrigerantes (Remove o emoji e a descrição da embalagem, mantendo apenas o texto essencial)
        cardapioBase.refrigerantes = ingredientesAtivos
            .filter(item => item.data_produto === 'refrigerante')
            .map(item => {
                // Extrai o nome do produto sem o emoji (ex: "Coca-Cola 1l 🥤" -> "*Coca-cola 1 LT")
                const textoLimpo = item.texto.replace(/(\s[0-9]+[lL].*|[^a-zA-Z\s\-])/g, '').trim();
                const embalagem = item.texto.match(/[0-9]+[lL]/i)[0].toUpperCase();
                return `*${textoLimpo} ${embalagem}*`;
            });

        let novoConteudo = cardapioBase.cabecalho + '<br><br>';

        // Adiciona os itens principais
        if (cardapioBase.itens.length > 0) {
            novoConteudo += cardapioBase.itens.join('<br>') + '<br>';
        }

        // Adiciona a seção de refrigerantes se houver
        if (cardapioBase.refrigerantes.length > 0) {
            novoConteudo += '<br>*Vendemos também refrigerantes*<br>';
            novoConteudo += cardapioBase.refrigerantes.join('<br>') + '<br><br>';
        } else {
             // Garante a quebra de linha se não houver refrigerantes, para espaçamento
             novoConteudo += '<br>';
        }

        // Adiciona o rodapé dinâmico
        novoConteudo += cardapioBase.rodape(horaLimitPedido);
        
        cardapioEditor.innerHTML = novoConteudo;
    }

    listaIngredientesContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const botaoClicado = e.target;
            const idProduto = botaoClicado.id;

            // Identifica se é um refrigerante com base no atributo data-content da categoria
            const categoria = botaoClicado.closest('.row').getAttribute('data-content');
            
            const novoIngrediente = {
                id: idProduto,
                data_produto: (categoria === 'refrigerante' ? 'refrigerante' : botaoClicado.getAttribute('data-content')),
                texto: botaoClicado.textContent.trim()
            };
            
            const index = ingredientesAtivos.findIndex(item => item.id === idProduto);
            
            if (index === -1) {
                ingredientesAtivos.push(novoIngrediente);
                botaoClicado.classList.replace('btn-default', 'btn-success');
            } else {
                ingredientesAtivos.splice(index, 1);
                botaoClicado.classList.replace('btn-success', 'btn-default');
            }

            // Ordena itens principais pelo ID e refrigerantes por ordem de clique (ou ID)
            ingredientesAtivos.sort((a, b) => {
                if (a.data_produto === 'refrigerante' && b.data_produto !== 'refrigerante') return 1;
                if (a.data_produto !== 'refrigerante' && b.data_produto === 'refrigerante') return -1;
                return parseInt(a.id) - parseInt(b.id);
            });

            atualizarCardapioVisual();
        }
    });

    async function carregarCardapioResponsivo() {
        let response;
        try {
            response = await fetch('cardapio.json');
        } catch (error) {
            // Se o fetch falhar (ex: arquivo não encontrado), usa um array vazio
            response = { ok: false };
        }
        try {
            listaIngredientesContainer.innerHTML = '';
            listaIngredientesContainer.classList.add('container-xl', 'text-center');
            
            if (!response.ok) throw new Error(`Erro HTTP! Status: ${response.status || 'N/A'}`);
            
            const cardapioData = await response.json();
            const categorias = Object.keys(cardapioData);
            const ultimaCategoria = categorias[categorias.length - 1];
            
            for (const categoria of categorias) {
                const itensDaCategoria = cardapioData[categoria];
                const rowDiv = document.createElement('div');
                let rowClasses = 'row g-2 mb-4';
                
                if (categoria !== ultimaCategoria) {
                    rowClasses += ' border-bottom pb-3';
                } else {
                    rowClasses += ' mb-2';
                }
                
                rowDiv.className = rowClasses;
                rowDiv.setAttribute('data-content', categoria); // Define a categoria aqui
                
                const tituloRow = document.createElement('h5');
                tituloRow.textContent = categoria.toUpperCase();
                tituloRow.className = 'col-12 text-start mt-2';
                rowDiv.appendChild(tituloRow);
                
                itensDaCategoria.forEach(item => {
                    const colDiv = document.createElement('div');
                    colDiv.className = 'col-6 col-md-4 col-lg-3';
                    const buttonHTML = `
                        <button 
                            id="${item.id}" 
                            data-content="${item.data_produto}" 
                            type="button" 
                            class="btn btn-default w-100 fs-5 btn-ajust"
                        >
                            ${item.texto}
                        </button>
                    `;
                    colDiv.innerHTML = buttonHTML;
                    rowDiv.appendChild(colDiv);
                });
                listaIngredientesContainer.appendChild(rowDiv);
            }
            
            ingredientesAtivos = [];
            atualizarCardapioVisual();
            
        } catch (error) {
            console.error('Falha ao carregar o cardápio:', error);
            listaIngredientesContainer.innerHTML = '<p class="text-danger">Erro ao carregar o cardápio. Verifique o arquivo cardapio.json.</p>';
        }
    };

    carregarCardapioResponsivo();
});

function copiarTexto() {
    const div = document.getElementById('cardapio-editable');
    const range = document.createRange();
    range.selectNodeContents(div);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    try {
        document.execCommand('copy');
        const mensagem = document.getElementById('mensagem-copia');
        mensagem.style.display = 'block';
        setTimeout(() => {
            mensagem.style.display = 'none';
        }, 2000);

    } catch (err) {
        alert('Falha ao copiar. Por favor, selecione e copie manualmente.');
    }
    selection.removeAllRanges();
}