// ==========================================================
// 1. CONFIGURACIÓN INICIAL
// ==========================================================

// Tasa de cambio (puedes ajustarla si cambia la economía)
const EXCHANGE_RATE = 36.5; 

// Obtener elementos del DOM (HTML)
const myBalanceUsdEl = document.getElementById('my-balance-usd');
const myBalanceBsEl = document.getElementById('my-balance-bs');
const herBalanceUsdEl = document.getElementById('her-balance-usd');
const herBalanceBsEl = document.getElementById('her-balance-bs');

const myContributionForm = document.getElementById('my-contribution-form');
const herContributionForm = document.getElementById('her-contribution-form');
const newProposalForm = document.getElementById('new-proposal-form');
const pendingProposalsEl = document.getElementById('pending-proposals');
const approvedProposalsEl = document.getElementById('approved-proposals');

// Estructura de datos inicial
let balances = {
    juan: { usd: 0, bs: 0 },
    brithany: { usd: 0, bs: 0 }
};

let proposals = [];

// ==========================================================
// 2. FUNCIONES DE MANEJO DE DATOS Y LOCALSTORAGE
// ==========================================================

// Carga los datos guardados en localStorage
function loadData() {
    const savedBalances = localStorage.getItem('savingsBalances');
    if (savedBalances) {
        balances = JSON.parse(savedBalances);
    }
    const savedProposals = localStorage.getItem('savingsProposals');
    if (savedProposals) {
        proposals = JSON.parse(savedProposals);
    }
}

// Guarda los balances y propuestas en localStorage
function saveData() {
    localStorage.setItem('savingsBalances', JSON.stringify(balances));
    localStorage.setItem('savingsProposals', JSON.stringify(proposals));
}

// Actualiza la visualización de los saldos en el HTML
function updateDisplay() {
    // Redondea los dólares a 2 decimales y los bolívares a enteros
    myBalanceUsdEl.textContent = `$${balances.juan.usd.toFixed(2)}`;
    myBalanceBsEl.textContent = `${Math.round(balances.juan.bs)} Bs`;
    
    herBalanceUsdEl.textContent = `$${balances.brithany.usd.toFixed(2)}`;
    herBalanceBsEl.textContent = `${Math.round(balances.brithany.bs)} Bs`;

    renderProposals();
}

// ==========================================================
// 3. MANEJO DE APORTES (Aporte flexible $)
// ==========================================================

function handleContribution(event, contributor) {
    event.preventDefault();

    let usdAmount, bsAmount;
    
    if (contributor === 'juan') {
        // Usa || 0 para que si el campo está vacío, lo trate como cero.
        usdAmount = parseFloat(document.getElementById('my-amount-usd').value) || 0;
        bsAmount = parseFloat(document.getElementById('my-amount-bs').value) || 0;
    } else { // brithany
        usdAmount = parseFloat(document.getElementById('her-amount-usd').value) || 0;
        bsAmount = parseFloat(document.getElementById('her-amount-bs').value) || 0;
    }

    // Validación: Debe aportar al menos un monto positivo en cualquiera de las monedas.
    if (usdAmount <= 0 && bsAmount <= 0) {
        alert('Por favor, ingresa un monto positivo en Dólares ($) O en Bolívares (Bs).');
        return;
    }

    // Actualizar el saldo
    balances[contributor].usd += usdAmount;
    balances[contributor].bs += bsAmount;

    saveData();
    updateDisplay();

    // Limpiar el formulario
    event.target.reset();
}

myContributionForm.addEventListener('submit', (e) => handleContribution(e, 'juan'));
herContributionForm.addEventListener('submit', (e) => handleContribution(e, 'brithany'));


// ==========================================================
// 4. MANEJO DE PROPUESTAS Y GASTOS
// ==========================================================

function handleNewProposal(event) {
    event.preventDefault();

    const name = document.getElementById('proposal-name').value;
    const cost = parseFloat(document.getElementById('proposal-cost').value);
    const proposer = document.getElementById('proposal-proposer').value;

    if (cost <= 0) {
        alert('El costo estimado debe ser un monto positivo.');
        return;
    }

    const newProposal = {
        id: Date.now(), // ID único
        name,
        cost,
        proposer,
        approved: false,
        spent: false,
        spendingDetails: null 
    };

    proposals.push(newProposal);
    saveData();
    updateDisplay();
    event.target.reset();
}

newProposalForm.addEventListener('submit', handleNewProposal);

// Renderiza las propuestas en las listas correspondientes
function renderProposals() {
    // Limpiar listas
    pendingProposalsEl.innerHTML = '<h3>Ideas Pendientes de Aprobación:</h3>';
    approvedProposalsEl.innerHTML = '<h3>Ideas Aprobadas y Gastos:</h3>';

    proposals.forEach(prop => {
        const item = document.createElement('div');
        item.className = 'proposal-item';
        item.setAttribute('data-id', prop.id);

        let html = `<div><strong>${prop.name}</strong> ($${prop.cost.toFixed(2)})<br><small>Propuesto por: ${prop.proposer}</small></div>`;

        if (!prop.approved) {
            // Idea pendiente de aprobación
            const pendingActions = `
                <div class="proposal-actions">
                    <button onclick="approveProposal(${prop.id})" class="approve-btn">Aprobar</button>
                    <button onclick="deleteProposal(${prop.id})" class="delete-btn">Eliminar</button>
                </div>
            `;
            item.innerHTML = html + pendingActions;
            pendingProposalsEl.appendChild(item);

        } else if (prop.approved && !prop.spent) {
            // Idea aprobada, pendiente de gasto
            item.classList.add('approved');
            const spendingActions = `
                <div class="proposal-actions">
                    <button onclick="showSpendForm(${prop.id})">Registrar Gasto</button>
                    <button onclick="deleteProposal(${prop.id})" class="delete-btn">Cancelar Idea</button>
                </div>
            `;
            item.innerHTML = html + spendingActions;
            approvedProposalsEl.appendChild(item);

        } else {
            // Gasto completado
            item.classList.add('spent');
            const details = prop.spendingDetails;
            const spentDetails = `
                <div>
                    <strong>¡Gasto Completado!</strong><br>
                    <small>Juan descontó: $${details.juan.toFixed(2)} - Brithany descontó: $${details.brithany.toFixed(2)}</small>
                </div>
            `;
            item.innerHTML = spentDetails;
            approvedProposalsEl.appendChild(item);
        }
    });
}

// Función para mostrar el formulario de registro de gastos
window.showSpendForm = function(id) {
    const proposal = proposals.find(p => p.id === id);
    if (!proposal) return;

    const itemEl = document.querySelector(`.proposal-item[data-id="${id}"]`);
    
    // Si el formulario ya está visible, no hacer nada o quitarlo
    if (itemEl.querySelector('.spend-form')) return;

    // Crear el formulario de gasto dinámicamente
    const spendForm = document.createElement('form');
    spendForm.className = 'spend-form';
    spendForm.style.marginTop = '15px';
    spendForm.innerHTML = `
        <h4>Distribución del Gasto (Descuento de USD)</h4>
        <div style="display:flex; gap:10px;">
            <div style="flex:1;">
                <label for="juan-spent-${id}">Juan descuenta ($):</label>
                <input type="number" id="juan-spent-${id}" value="${(proposal.cost / 2).toFixed(2)}" required min="0" step="0.01" style="width:100%;">
            </div>
            <div style="flex:1;">
                <label for="brithany-spent-${id}">Brithany descuenta ($):</label>
                <input type="number" id="brithany-spent-${id}" value="${(proposal.cost / 2).toFixed(2)}" required min="0" step="0.01" style="width:100%;">
            </div>
        </div>
        <button type="submit" style="background-color:#4CAF50;">Confirmar y Descontar</button>
    `;

    // Manejar el envío del formulario de gasto
    spendForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const juanSpent = parseFloat(document.getElementById(`juan-spent-${id}`).value) || 0;
        const brithanySpent = parseFloat(document.getElementById(`brithany-spent-${id}`).value) || 0;
        
        // --- Validación de saldo simple (opcional) ---
        if (juanSpent > balances.juan.usd || brithanySpent > balances.brithany.usd) {
             alert('¡Error! Uno de los saldos en USD no es suficiente para cubrir el descuento.');
             return;
        }

        // Aplicar descuento
        balances.juan.usd -= juanSpent;
        balances.brithany.usd -= brithanySpent;

        // Marcar como gastado
        proposal.spent = true;
        proposal.spendingDetails = { juan: juanSpent, brithany: brithanySpent };

        saveData();
        updateDisplay();
    });

    // Agregar el formulario al elemento de la propuesta
    itemEl.appendChild(spendForm);
}

// Función para aprobar una propuesta
window.approveProposal = function(id) {
    const proposal = proposals.find(p => p.id === id);
    if (proposal) {
        proposal.approved = true;
        saveData();
        updateDisplay();
    }
}

// Función para eliminar una propuesta
window.deleteProposal = function(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta idea?')) {
        proposals = proposals.filter(p => p.id !== id);
        saveData();
        updateDisplay();
    }
}


// ==========================================================
// 5. INICIALIZACIÓN
// ==========================================================

// Carga los datos al iniciar la página y actualiza la vista
loadData(); 
updateDisplay();
