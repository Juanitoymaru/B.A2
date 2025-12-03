// ==========================================================
// 1. CONFIGURACIÓN INICIAL & FIREBASE
// ==========================================================

// Tasa de cambio (opcional, para futuras conversiones)
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

// ** TUS CREDENCIALES DE FIREBASE (NO LAS CAMBIES) **
const firebaseConfig = {
    apiKey: "AIzaSyDk-Yl2D-WWkIrEU7pSbt4JkDTSMyODLRU",
    authDomain: "ahorros-75301.firebaseapp.com",
    databaseURL: "https://ahorros-75301-default-rtdb.firebaseio.com",
    projectId: "ahorros-75301",
    storageBucket: "ahorros-75301.firebasestorage.app",
    messagingSenderId: "534597766092",
    appId: "1:534597766092:web:2d0d32fc727ff2076a2b69",
    measurementId: "G-6RWD65F1FT"
};

// Inicializar Firebase y obtener referencia a la base de datos
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const dbRef = database.ref('/'); // Referencia a la raíz de tu base de datos

// Estructura de datos local (se sobrescribe con los datos de Firebase)
let balances = {
    juan: { usd: 0, bs: 0 },
    brithany: { usd: 0, bs: 0 }
};

let proposals = [];

// ==========================================================
// 2. FUNCIONES DE MANEJO DE DATOS Y FIREBASE (SINCRONIZACIÓN)
// ==========================================================

/**
 * Guarda el estado actual de balances y proposals en Firebase.
 */
function saveData() {
    const dataToSave = {
        balances: balances,
        proposals: proposals
    };
    dbRef.set(dataToSave)
        .catch(error => console.error("Error al guardar en Firebase:", error));
}

/**
 * Configura un listener para escuchar cambios en tiempo real en Firebase.
 */
function setupRealtimeListener() {
    dbRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            // Sobrescribe las variables locales con los datos de Firebase
            balances = data.balances || balances;
            proposals = data.proposals || proposals; 
            
            // Actualiza la vista de la aplicación para ambos usuarios
            updateDisplay();
        } else {
            // Si la base de datos está vacía, guarda la estructura inicial para empezar
            saveData();
        }
    });
}

/**
 * Actualiza la visualización de los saldos en el HTML.
 */
function updateDisplay() {
    // Redondea los dólares a 2 decimales y los bolívares a enteros
    myBalanceUsdEl.textContent = `$${balances.juan.usd.toFixed(2)}`;
    myBalanceBsEl.textContent = `${Math.round(balances.juan.bs)} Bs`;
    
    herBalanceUsdEl.textContent = `$${balances.brithany.usd.toFixed(2)}`;
    herBalanceBsEl.textContent = `${Math.round(balances.brithany.bs)} Bs`;

    renderProposals();
}

// ==========================================================
// 3. MANEJO DE APORTES 
// ==========================================================

function handleContribution(event, contributor) {
    event.preventDefault();

    let usdAmount, bsAmount;
    
    if (contributor === 'juan') {
        usdAmount = parseFloat(document.getElementById('my-amount-usd').value) || 0;
        bsAmount = parseFloat(document.getElementById('my-amount-bs').value) || 0;
    } else { // brithany
        usdAmount = parseFloat(document.getElementById('her-amount-usd').value) || 0;
        bsAmount = parseFloat(document.getElementById('her-amount-bs').value) || 0;
    }

    if (usdAmount <= 0 && bsAmount <= 0) {
        console.error('Por favor, ingresa un monto positivo en Dólares ($) O en Bolívares (Bs).');
        return;
    }

    // Actualizar el saldo
    balances[contributor].usd += usdAmount;
    balances[contributor].bs += bsAmount;

    // Guardar en Firebase (activa la sincronización)
    saveData();

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
        console.error('El costo estimado debe ser un monto positivo.');
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

    // Añadir la propuesta
    proposals.push(newProposal);
    
    // Guardar en Firebase
    saveData();
    event.target.reset();
}

newProposalForm.addEventListener('submit', handleNewProposal);

/**
 * Renderiza las propuestas en las secciones de Pendientes y Aprobadas/Gastadas.
 */
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
            
            // Asegura que los valores existan antes de mostrarlos
            const juanUsd = details && details.juan && details.juan.usd !== undefined ? details.juan.usd : 0;
            const juanBs = details && details.juan && details.juan.bs !== undefined ? details.juan.bs : 0;
            const brithanyUsd = details && details.brithany && details.brithany.usd !== undefined ? details.brithany.usd : 0;
            const brithanyBs = details && details.brithany && details.brithany.bs !== undefined ? details.brithany.bs : 0;

            const spentDetails = `
                <div>
                    <strong>¡Gasto Completado!</strong><br>
                    <small>
                        Juan descontó: $${juanUsd.toFixed(2)} / ${Math.round(juanBs)} Bs<br>
                        Brithany descontó: $${brithanyUsd.toFixed(2)} / ${Math.round(brithanyBs)} Bs
                    </small>
                </div>
            `;
            item.innerHTML = spentDetails;
            approvedProposalsEl.appendChild(item);
        }
    });
}

/**
 * Muestra el formulario para registrar el gasto real y descontar saldos.
 */
window.showSpendForm = function(id) {
    const proposal = proposals.find(p => p.id === id);
    if (!proposal) return;

    const itemEl = document.querySelector(`.proposal-item[data-id="${id}"]`);
    
    // Evitar que se cree más de un formulario de gasto
    if (itemEl.querySelector('.spend-form')) return;

    // Calcula el monto sugerido (50% de la propuesta)
    const suggestedCost = (proposal.cost / 2).toFixed(2);
    
    const spendForm = document.createElement('form');
    spendForm.className = 'spend-form';
    spendForm.style.marginTop = '15px';
    
    spendForm.innerHTML = `
        <h4>Distribución del Gasto (Descuento)</h4>
        
        <div class="spend-row">
            <h5>Descuento de Juan:</h5>
            <div class="input-group">
                <label for="juan-spent-usd-${id}">USD ($):</label>
                <input type="number" id="juan-spent-usd-${id}" value="${suggestedCost}" required min="0" step="0.01">
            </div>
            <div class="input-group">
                <label for="juan-spent-bs-${id}">Bs:</label>
                <input type="number" id="juan-spent-bs-${id}" value="0" required min="0" step="1">
            </div>
        </div>

        <div class="spend-row">
            <h5>Descuento de Brithany:</h5>
            <div class="input-group">
                <label for="brithany-spent-usd-${id}">USD ($):</label>
                <input type="number" id="brithany-spent-usd-${id}" value="${suggestedCost}" required min="0" step="0.01">
            </div>
            <div class="input-group">
                <label for="brithany-spent-bs-${id}">Bs:</label>
                <input type="number" id="brithany-spent-bs-${id}" value="0" required min="0" step="1">
            </div>
        </div>

        <button type="submit" style="background-color:#4CAF50;">Confirmar y Descontar</button>
    `;

    // Manejar el envío del formulario de gasto
    spendForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // --- Obtener Montos de Gasto ---
        const juanSpentUsd = parseFloat(document.getElementById(`juan-spent-usd-${id}`).value) || 0;
        const juanSpentBs = parseFloat(document.getElementById(`juan-spent-bs-${id}`).value) || 0;
        const brithanySpentUsd = parseFloat(document.getElementById(`brithany-spent-usd-${id}`).value) || 0;
        const brithanySpentBs = parseFloat(document.getElementById(`brithany-spent-bs-${id}`).value) || 0;
        
        // --- Validación del Saldo ---
        if (juanSpentUsd > balances.juan.usd || brithanySpentUsd > balances.brithany.usd) {
             console.error('¡Error! Uno de los saldos en USD no es suficiente para cubrir el descuento.');
             return;
        }
        if (juanSpentBs > balances.juan.bs || brithanySpentBs > balances.brithany.bs) {
             console.error('¡Error! Uno de los saldos en Bolívares (Bs) no es suficiente para cubrir el descuento.');
             return;
        }

        // --- Aplicar Descuento a los saldos correctos ---
        balances.juan.usd -= juanSpentUsd;
        balances.juan.bs -= juanSpentBs;
        balances.brithany.usd -= brithanySpentUsd;
        balances.brithany.bs -= brithanySpentBs;

        // Marcar como gastado y guardar detalles
        proposal.spent = true;
        proposal.spendingDetails = { 
            juan: { usd: juanSpentUsd, bs: juanSpentBs }, 
            brithany: { usd: brithanySpentUsd, bs: brithanySpentBs } 
        };

        // Guardar en Firebase (activa la sincronización)
        saveData();
    });

    // Remover botones de acción y agregar el formulario
    const actionEl = itemEl.querySelector('.proposal-actions');
    actionEl.remove();
    itemEl.appendChild(spendForm);
}

/**
 * Función global para aprobar una propuesta.
 */
window.approveProposal = function(id) {
    const proposal = proposals.find(p => p.id === id);
    if (proposal) {
        proposal.approved = true;
        // Guardar en Firebase (activa la sincronización)
        saveData();
    }
}

/**
 * Función global para eliminar una propuesta.
 */
window.deleteProposal = function(id) {
    console.warn(`Intentando eliminar la propuesta con ID: ${id}`);
    
    proposals = proposals.filter(p => p.id !== id);
    // Guardar en Firebase (activa la sincronización)
    saveData();
}


// ==========================================================
// 5. INICIALIZACIÓN
// ==========================================================

// Inicia el listener para cargar datos y mantenerse sincronizado en tiempo real
setupRealtimeListener();
