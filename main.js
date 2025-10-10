const dropdownElementList = document.querySelectorAll('.dropdown-toggle')
const dropdownList = [...dropdownElementList].map(dropdownToggleEl => new bootstrap.Dropdown(dropdownToggleEl))

let horaLimitPedido = "00:00"

try {
    horaLimitPedido = localStorage.getItem('horaLimit');
    if (!horaLimitPedido) {
        horaLimitPedido = "09:00";
        localStorage.setItem('horaLimit', '09:00')
    }
} catch (x) {
    horaLimitPedido = "09:01"
}

document.addEventListener('DOMContentLoaded', () => {

    const listaIngredientesContainer = document.getElementById('listaAddIngredientes');
    const cardapioEditor = document.getElementById('cardapio-editable');
    let ingredientesAtivos = [];

    let cardapioBase = {
        cabecalho: `*Cardápio de hoje ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} 📅*`,
        itens: [],
        rodape: `*⚠️ FAZER OS SEUS PEDIDOS ATÉ ${horaLimitPedido} ⏰*<br><br>*Pix : 61823579000187*`
    };

    function atualizarCardapioVisual() {
        cardapioBase.itens = ingredientesAtivos.map(item => `• ${item.texto}`);
        let novoConteudo = cardapioBase.cabecalho + '<br><br>';
        if (cardapioBase.itens.length > 0) {
            novoConteudo += cardapioBase.itens.join('<br>') + '<br><br>';
        } else {
            novoConteudo += '<br>';
        }
        novoConteudo += cardapioBase.rodape;
        cardapioEditor.innerHTML = novoConteudo;
    }

    listaIngredientesContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const botaoClicado = e.target;
            const idProduto = botaoClicado.id;
            const novoIngrediente = {
                id: idProduto,
                data_produto: botaoClicado.getAttribute('data-content'),
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
            ingredientesAtivos.sort((a, b) => parseInt(a.id) - parseInt(b.id));
            atualizarCardapioVisual();
        }
    });

    async function carregarCardapioResponsivo() {
        let response;
        try {
            response = await fetch('cardapio.json');
        } catch (error) {
            response = [];
        }
        try {
            listaIngredientesContainer.innerHTML = '';
            listaIngredientesContainer.classList.add('container-xl', 'text-center');
            if (!response.ok) throw new Error(`Erro HTTP! Status: ${response.status}`);
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
                rowDiv.setAttribute('data-content', categoria);
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