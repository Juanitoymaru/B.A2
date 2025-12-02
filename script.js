// --- DATOS INICIALES (Configuración) ---

const RECOMPENSAS_DATA = [
    { id: 'r1', nombre: 'Masaje de 15 minutos', costo: 1, mensaje: 'Quiero canjear mi cupón de Masaje de 15 minutos. ¡Prepárate! 😉' },
    { id: 'r2', nombre: 'Tú eliges la cena de hoy', costo: 2, mensaje: 'Quiero canjear mi cupón para elegir la cena de hoy. 🍕' },
    { id: 'r3', nombre: 'Un deseo sin preguntas', costo: 3, mensaje: 'Quiero canjear mi cupón de "Un deseo sin preguntas". ¿Cuál es el tuyo? 😈' }
];

const MISIONES_DATA = [
    { id: 'm1', nombre: 'Salir a un lugar que nos guste a ambos', recompensa: 1, completada: false },
    { id: 'm2', nombre: 'Desayunar, almorzar o cenar juntos', recompensa: 1, completada: false },
    { id: 'm3', nombre: 'Darnos algun detalle bonito', recompensa: 1, completada: false },
    { id: 'm4', nombre: 'Darnos un beso bajo la lluvia', recompensa: 2, completada: false }
];

// --- VARIABLES GLOBALES Y LOCAL STORAGE ---

let cuponesDisponibles = 0;
let misiones = [...MISIONES_DATA]; // Copia de las misiones para manipular su estado

const WHATSAPP_NUMBER = 'TUNUMERODETELF'; // *** +584246998129 ***

// Cargar el estado guardado al iniciar la página
function cargarEstado() {
    const estadoGuardado = localStorage.getItem('cupones_app_estado');
    if (estadoGuardado) {
        const estado = JSON.parse(estadoGuardado);
        cuponesDisponibles = estado.cupones || 0;
        misiones = estado.misiones || [...MISIONES_DATA];
    }
}

// Guardar el estado después de un cambio
function guardarEstado() {
    const estado = {
        cupones: cuponesDisponibles,
        misiones: misiones
    };
    localStorage.setItem('cupones_app_estado', JSON.stringify(estado));
}

// --- FUNCIONES DE INTERACCIÓN ---

// Genera el enlace de WhatsApp para notificación
function generarWhatsAppLink(accion, detalle) {
    const mensaje = `¡ADMIN! Solicitud de ${accion}: ${detalle}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
}

// Misión completada (Ella gana cupones)
function completarMision(misionId) {
    const misionIndex = misiones.findIndex(m => m.id === misionId);
    if (misionIndex > -1 && !misiones[misionIndex].completada) {
        
        const mision = misiones[misionIndex];
        mision.completada = true; // Marcar como completada
        
        // 1. Notificar al admin
        const link = generarWhatsAppLink('Misión Completada', `Acabo de terminar: "${mision.nombre}". Por favor, confírmame los ${mision.recompensa} cupones.`);
        window.open(link, '_blank');

        // 2. Por simplicidad, agregamos el cupón automáticamente después de la notificación.
        // TÚ, el admin, debes confirmarle después si lo puede usar o no.
        cuponesDisponibles += mision.recompensa;
        
        guardarEstado();
        actualizarInterfaz();
        
        alert(`✅ Misión enviada a revisión. Al recibir mi confirmación, los ${mision.recompensa} cupones estarán listos para usar.`);
    }
}

// Recompensa canjeada (Ella gasta cupones)
function canjearRecompensa(recompensaId) {
    const recompensa = RECOMPENSAS_DATA.find(r => r.id === recompensaId);
    
    if (!recompensa) return;
    
    if (cuponesDisponibles >= recompensa.costo) {
        
        // 1. Notificar al admin (Te enviará el mensaje de canjeo)
        const link = generarWhatsAppLink('Canjeo de Recompensa', recompensa.mensaje + ` Esto cuesta ${recompensa.costo} cupones.`);
        window.open(link, '_blank');
        
        // 2. Gastamos el cupón automáticamente (TÚ, el admin, debes honrarlo).
        cuponesDisponibles -= recompensa.costo;
        
        guardarEstado();
        actualizarInterfaz();
        
        alert(`🎁 ¡Canjeo enviado! ¡Prepárate para recibir tu recompensa!`);
        
    } else {
        alert(`¡Ups! Necesitas ${recompensa.costo} cupones y solo tienes ${cuponesDisponibles}. ¡A por las misiones!`);
    }
}

// --- FUNCIONES DE RENDERIZADO (Dibujar en la pantalla) ---

function actualizarInterfaz() {
    // Actualiza el contador de cupones
    document.getElementById('cupones-contador').textContent = cuponesDisponibles;
    
    // 1. Renderizar Misiones
    const misionesContainer = document.getElementById('misiones-container');
    misionesContainer.innerHTML = ''; // Limpiar
    
    misiones.forEach(mision => {
        const card = document.createElement('div');
        card.className = `item-card ${mision.completada ? 'completada' : ''}`;
        
        let buttonText = 'Confirmar Misión';
        let buttonDisabled = mision.completada;

        if(mision.completada) {
            buttonText = '¡Completada!';
        }
        
        card.innerHTML = `
            <h3>${mision.nombre}</h3>
            <p>Recompensa: <strong>${mision.recompensa} Cupón(es)</strong></p>
            <button onclick="completarMision('${mision.id}')" ${buttonDisabled ? 'disabled' : ''}>
                ${buttonText}
            </button>
        `;
        misionesContainer.appendChild(card);
    });

    // 2. Renderizar Recompensas
    const recompensasContainer = document.getElementById('recompensas-container');
    recompensasContainer.innerHTML = ''; // Limpiar
    
    RECOMPENSAS_DATA.forEach(recompensa => {
        const card = document.createElement('div');
        card.className = 'item-card';

        let buttonText = `Canjear (${recompensa.costo} Cupón)`;
        let buttonDisabled = cuponesDisponibles < recompensa.costo;
        
        card.innerHTML = `
            <h3>${recompensa.nombre}</h3>
            <p>Costo: <strong>${recompensa.costo} Cupón(es)</strong></p>
            <button onclick="canjearRecompensa('${recompensa.id}')" ${buttonDisabled ? 'disabled' : ''}>
                ${buttonText}
            </button>
        `;
        recompensasContainer.appendChild(card);
    });
}

// --- INICIALIZACIÓN ---

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarEstado();
    actualizarInterfaz();
});

// Reseteo para pruebas (Puedes borrar esta función cuando termines)
// Puedes llamarla en la consola del navegador si quieres empezar de cero
window.resetearSistema = function() {
    localStorage.removeItem('cupones_app_estado');
    cuponesDisponibles = 0;
    misiones = [...MISIONES_DATA];
    actualizarInterfaz();
    alert('Sistema de cupones reiniciado.');
}
