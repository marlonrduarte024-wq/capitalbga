// ============================================================
// ESTADO GLOBAL
// ============================================================
let carrito = [];
let menuData = null;
let menuConfig = null;
let descripciones = {};
let imagenes = {};
let acompanamientosConfig = { grupos: {}, productos: {} };
let productoModal = null;

const BUCKET_URL = "https://rvbllqsbkizsgcdrdhtp.supabase.co/storage/v1/object/public/conf_pagina";
const cb = `?t=${new Date().getTime()}`; 

// ============================================================
// MOTOR DE CARGA (SUPABASE)
// ============================================================
async function inicializarApp() {
    console.log("🚀 Iniciando MenWapp...");

    const cargarArchivo = async (ruta) => {
        try {
            const res = await fetch(ruta, { mode: 'cors' });
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            console.error("Error cargando:", ruta, e);
            return null;
        }
    };

    try {
        const resultados = await Promise.all([
            cargarArchivo(`${BUCKET_URL}/menu.json${cb}`),
            cargarArchivo(`${BUCKET_URL}/menu_config.json${cb}`),
            cargarArchivo(`${BUCKET_URL}/descripciones.json${cb}`),
            cargarArchivo(`${BUCKET_URL}/imagenes.json${cb}`),
            cargarArchivo(`${BUCKET_URL}/promo.json${cb}`),
            cargarArchivo(`${BUCKET_URL}/sugeridos_promo.json${cb}`),
            cargarArchivo(`${BUCKET_URL}/acompanamientos.json${cb}`)
        ]);

        const [mRaw, cfg, desc, img, prm, sug, acmp] = resultados;

        if (mRaw && mRaw.menu) {
            menuData = mRaw.menu;
        } else {
            alert("Error: No se pudo cargar el menú principal.");
            return;
        }

        menuConfig = cfg || { horarios: {}, portada: {}, recomendados: [] };
        descripciones = desc || {};
        imagenes = img || {};
        acompanamientosConfig = acmp || { grupos: {}, productos: {} };
        window.productosSugeridos = sug || {};

        aplicarPortada();
        renderMenu();
        if (prm) mostrarPromoInicio(prm); 

        // Aviso de cierre
        if (!verificarHorario()) {
            const btnFlotante = document.querySelector(".btn-carrito-flotante");
            if (btnFlotante) btnFlotante.style.display = "none";
            document.body.insertAdjacentHTML('afterbegin', `
                <div id="aviso-cerrado" style="background:#d32f2f; color:white; text-align:center; padding:10px; font-weight:bold; position:sticky; top:0; z-index:10000;">
                    🌙 Estamos cerrados temporalmente, revisa nuestros horarios de servicio.
                </div>`);
        }

    } catch (error) {
        console.error("Error crítico:", error);
    }
}

// ============================================================
// LÓGICA DE PRODUCTOS Y MODAL
// ============================================================
function abrirModalProducto(p) {
    productoModal = p;
    const cod = String(p.codigo).trim();

    document.getElementById("modal-nombre").innerText = p.articulo;
    document.getElementById("modal-desc").innerText = descripciones[cod] || p.descripcion || "";
    document.getElementById("modal-precio").innerText = "$" + Number(p.precio).toLocaleString();
    
    const imgModal = document.getElementById("modal-img");
    const rutaImg = imagenes[cod] || p.imagen;
    imgModal.src = rutaImg ? limpiarRuta(rutaImg) : "";
    imgModal.style.display = rutaImg ? "block" : "none";

    document.getElementById("modal-obs").value = "";
    document.getElementById("modal-cantidad").value = 1;

    // Acompañamientos
    const listCont = document.getElementById("modal-acompanamientos-list");
    listCont.innerHTML = "";
    if (acompanamientosConfig?.productos?.[cod]) {
        acompanamientosConfig.productos[cod].forEach(nombreGrupo => {
            const opciones = acompanamientosConfig.grupos[nombreGrupo];
            if (opciones) {
                const div = document.createElement("div");
                div.innerHTML = `<h4 style="margin:15px 0 8px 0; font-size:0.9rem;">Selecciona tu ${nombreGrupo}:</h4>`;
                opciones.forEach((op, idx) => {
                    div.innerHTML += `
                        <label class="item-acomp">
                            <input type="radio" name="grupo_${nombreGrupo}" value="${op}" ${idx === 0 ? 'checked' : ''}> 
                            <span>${op}</span>
                        </label>`;
                });
                listCont.appendChild(div);
            }
        });
    }

    // Control de botón agregar
    const btnAgregar = document.querySelector(".btn-agregar-modal");
    const estaAbierto = verificarHorario(); 
    if (!estaAbierto) {
        btnAgregar.innerText = "Cerrado temporalmente";
        btnAgregar.style.background = "#555";
        btnAgregar.disabled = true;
    } else {
        btnAgregar.innerText = "Confirmar pedido 🛒";
        btnAgregar.style.background = "var(--color-principal)";
        btnAgregar.disabled = false;
    }
    btnAgregar.style.marginBottom = "30px"; 
    btnAgregar.style.position = "relative";
    document.getElementById("modal-producto").classList.add("activo");
    history.pushState({ modal: "producto" }, "");
}

function cambiarCantidad(delta) {
    const input = document.getElementById("modal-cantidad");
    let val = parseInt(input.value) + delta;
    if (val < 1) val = 1;
    input.value = val;
}

function cerrarModalProducto() {
    document.getElementById("modal-producto").classList.remove("activo");
}

// ============================================================
// CARRITO Y WHATSAPP
// ============================================================
function actualizarVistaCarrito() {
    const cont = document.getElementById("carrito-items");
    const btnFlotante = document.querySelector(".btn-carrito-flotante");
    const countFlotante = document.getElementById("carrito-count");
    
    let total = 0;
    let itemsTotales = 0;
    cont.innerHTML = "";

    carrito.forEach((p, index) => {
        total += p.precio * p.cantidad;
        itemsTotales += p.cantidad;
        cont.innerHTML += `
            <div class="carrito-item" style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom:5px;">
                <div style="flex:1">
                    <strong>${p.nombre}</strong> (x${p.cantidad})<br>
                    <small style="color:#aaa;">${p.observacion}</small>
                </div>
                <div style="text-align:right;">
                    $${(p.precio * p.cantidad).toLocaleString()} 
                    <button onclick="eliminarDelCarrito(${index})" style="background:none; border:none; color:#ff4444; margin-left:10px;">✕</button>
                </div>
            </div>`;
    });

   if (carrito.length > 0) {
        cont.innerHTML += `
            <div style="margin-top:20px; 
                    padding:15px; 
                    padding-bottom: 60px; /* ESTO sube el contenido del carrito */
                    background:#1a1a1a; 
                    border-radius:12px; 
                    border:1px solid #333; 
                    margin-bottom: 50px;"> <p style="font-size:0.75rem; font-weight:bold; margin-bottom:12px; text-align:center; color:#fff; letter-spacing:1px;">¿DOMICILIO O RECOGER EN LOCAL?</p>
            <div style="display:flex; gap:10px;">
                <label style="flex:1; cursor:pointer;">
                    <input type="radio" name="tipo_pedido" value="RKO" style="display:none;" onchange="ajustarEstiloMetodo(this)">
                    <div class="btn-metodo" style="background:#fff; color:#000; text-align:center; padding:12px 5px; border:2px solid var(--color-principal); border-radius:10px; font-weight:bold; font-size:0.8rem; transition:0.3s;">🛵 Domicilio</div>
                </label>
                <label style="flex:1; cursor:pointer;">
                    <input type="radio" name="tipo_pedido" value="HBK" style="display:none;" onchange="ajustarEstiloMetodo(this)">
                    <div class="btn-metodo" style="background:#fff; color:#000; text-align:center; padding:12px 5px; border:2px solid var(--color-principal); border-radius:10px; font-weight:bold; font-size:0.8rem; transition:0.3s;">🥡 Recoger</div>
                </label>
            </div>
        </div>`;
    }

    document.getElementById("carrito-total").innerText = "$" + total.toLocaleString();
    document.getElementById("btn-whatsapp").disabled = (carrito.length === 0);
    if (countFlotante) countFlotante.innerText = itemsTotales;
    if (btnFlotante) btnFlotante.style.display = itemsTotales > 0 ? "flex" : "none";
}

function agregarDesdeModal() {
    if (!productoModal) return;
    const seleccionados = Array.from(document.querySelectorAll("#modal-acompanamientos-list input:checked")).map(c => c.value);
    const obs = document.getElementById("modal-obs").value.trim();
    const cant = parseInt(document.getElementById("modal-cantidad").value) || 1;
    
    let finalObs = seleccionados.length ? "Con: " + seleccionados.join(", ") : "";
    if (obs) finalObs += (finalObs ? " | " : "") + obs;

    const item = { 
        codigo: String(productoModal.codigo).trim(), 
        nombre: productoModal.articulo, 
        precio: Number(productoModal.precio), 
        observacion: finalObs, 
        cantidad: cant 
    };

    const index = carrito.findIndex(x => x.codigo === item.codigo && x.observacion === item.observacion);
    if (index > -1) carrito[index].cantidad += cant; else carrito.push(item);

    actualizarVistaCarrito();
    cerrarModalProducto();
    mostrarToast(`${item.nombre} agregado al pedido`);
}

async function enviarWhatsApp() {
    if (!verificarHorario()) {
        Swal.fire("Cerrado", "Lo sentimos, no estamos recibiendo pedidos ahora.", "error");
        return;
    }
    const metodo = document.querySelector('input[name="tipo_pedido"]:checked');
    if (!metodo) {
        mostrarToast("⚠️ Selecciona Domicilio o Recoger");
        return;
    }
    document.getElementById("modal-confirmacion").classList.add("activo");
    history.pushState({ modal: "confirmacion" }, "");
}

async function confirmarYEnviar() {
    const prefijo = document.querySelector('input[name="tipo_pedido"]:checked').value;
    let msg = "";
    carrito.forEach(p => {
        msg += `${prefijo}|${p.codigo}|${p.cantidad}\n`;
        if (p.observacion) msg += `${prefijo}|CONTROLRESTRICCIONES|0|0|${p.observacion.replace(/[|\n]/g, " ")}\n`;
    });

    try {
        const r = await fetch(`${BUCKET_URL}/config_whatsapp1.txt${cb}`);
        const t = await r.text();
        const tel = t.match(/telefono=(.+)/)[1].trim();
        window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, "_blank");
    } catch {
        window.open(`https://wa.me/573108094441?text=${encodeURIComponent(msg)}`, "_blank");
    }
    document.getElementById("modal-confirmacion").classList.remove("activo");
}

// ============================================================
// PROMOS Y UTILS
// ============================================================
function mostrarPromoInicio(promo) {
    if (!promo) return;
    const promoHTML = `
        <div id="modal-promo" class="modal-overlay activo" 
             style="z-index: 99999; 
                    position: fixed; 
                    top: 0; 
                    left: 0; 
                    width: 100%; 
                    height: 100%; 
                    background: rgba(0, 0, 0, 0.5); /* Oscurece el fondo sin taparlo */
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    padding: 20px;">
            
            <div class="modal-box" 
                 style="text-align:center; 
                        max-width: 400px; /* Un poco más angosto */
                        width: 90%; 
                        background: white; 
                        padding: 20px; 
                        border-radius: 20px; 
                        position: relative; 
                        box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
                
                <button class="btn-cerrar-modal" 
                        onclick="cerrarPromo()" 
                        style="position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 20px; cursor: pointer;">✕</button>
                
                <h2 style="color:var(--color-principal); margin-top: 10px;">✨ ${promo.nombre}</h2>
                
                <img src="${limpiarRuta(promo.imagen)}" 
                     style="width:100%; max-height: 250px; object-fit: cover; border-radius:15px; margin:10px 0;">
                
                <p style="font-size: 0.95rem; color: #444;">${promo.descripcion}</p>
                
                <button class="btn-agregar-modal" 
                        style="width:100%; background:#25D366; color:white; border:none; padding: 12px; border-radius: 10px; font-weight: bold; margin-top:15px; cursor: pointer;" 
                        onclick="prepararCompraPromo('${promo.codigo}')">
                    Añadir al Pedido 🛒
                </button>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', promoHTML);
    history.pushState({ modal: "promo" }, "");
}

function prepararCompraPromo(codigo) {
    const modalP = document.getElementById('modal-promo');
    if (modalP) modalP.remove();
    const p = encontrarProductoPorCodigo(codigo);
    if (p) abrirModalProducto(p);
}

function cerrarPromo() {
    const m = document.getElementById('modal-promo');
    if (m) m.remove();
}

// ============================================================
// FUNCIONES DE INFORMACIÓN (HORARIOS Y UBICACIÓN)
// ============================================================

function mostrarHorarios() {
    // Si no han cargado los datos de Supabase aún
    if (!menuConfig || !menuConfig.horarios) {
        console.warn("Horarios no cargados de Supabase");
        return;
    }

    let tablaHTML = `<div style="text-align:left; font-family:'Inter', sans-serif; color:white;">`;
    const diasOrden = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    
    diasOrden.forEach(dia => {
        const h = menuConfig.horarios[dia];
        if (h) {
            const status = (h.cerrado === true || h.cerrado === "True") ? 
                '<span style="color:#ff4444; font-weight:bold;">Cerrado</span>' : 
                `<span style="color:#44ff44;">${h.inicio} - ${h.fin}</span>`;
            
            tablaHTML += `
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid #333; padding: 10px 0;">
                    <span style="font-weight:bold;">${dia}</span>
                    <span>${status}</span>
                </div>`;
        }
    });
    tablaHTML += `</div>`;

    Swal.fire({
        title: '🕒 Nuestros Horarios',
        html: tablaHTML,
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: 'var(--color-principal)',
        confirmButtonText: 'Entendido'
    });
}

function mostrarUbicacion() {
    const direccion = "Cra. 27 #84-46 Local edf, terranova, Bucaramanga, Santander";
    
    Swal.fire({
        title: '📍 Ubicación',
        html: `
            <p style="color:#fff; margin-bottom:15px;">${direccion}</p>
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}" 
               target="_blank" 
               style="display:inline-block; padding:12px 25px; background:var(--color-principal); color:#000; border-radius:8px; text-decoration:none; font-weight:bold; font-size:0.9rem;">
               VER EN GOOGLE MAPS
            </a>`,
        background: '#1a1a1a',
        showConfirmButton: false,
        showCloseButton: true
    });
}

// ============================================================
// DISPARADOR DE INICIO (MODIFICADO PARA VINCULAR BOTONES)
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Iniciar carga de datos
    inicializarApp();

    // 2. Vincular botones de la portada (Horarios y Ubicación)
    // Buscamos los botones por su texto o clase si existen
    const btnHorario = document.querySelector('button[onclick="mostrarHorarios()"]') || 
                       Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Horario'));
    
    const btnUbi = document.querySelector('button[onclick="mostrarUbicacion()"]') || 
                   Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Ubicación'));

    if (btnHorario) btnHorario.onclick = mostrarHorarios;
    if (btnUbi) btnUbi.onclick = mostrarUbicacion;
});
// ============================================================
// SISTEMA BASE (RENDER, PORTADA, HORARIO)
// ============================================================
function toggleCategorias() {
    document.getElementById("sidebar-categorias").classList.toggle("activo");
    document.getElementById("overlay-sidebar").classList.toggle("activo");
}

function renderMenu() {
    const menuCont = document.getElementById("menu");
    const navCont = document.getElementById("nav-categorias");
    if (!menuCont || !menuData) return;
    menuCont.innerHTML = ""; navCont.innerHTML = "";

    // --- SECCIÓN: RECOMENDADOS DEL CHEF (La que añadimos antes) ---
    // ... (Mantén aquí el código de los recomendados que pusimos en el paso anterior)

    Object.keys(menuData).forEach((cat, idx) => {
        const btn = document.createElement("button");
        btn.innerText = cat;
        if (idx === 0) btn.classList.add("activo");
        
        btn.onclick = (e) => {
            document.querySelectorAll(".categorias-nav button").forEach(b => b.classList.remove("activo"));
            e.target.classList.add("activo");
            
            cambiarCategoria(cat);
            toggleCategorias(); // <--- CIERRA EL MENÚ AL SELECCIONAR
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Sube al inicio al cambiar
        };
        navCont.appendChild(btn);

        const divCat = document.createElement("div");
        divCat.className = "bloque-categoria";
        divCat.id = "cat-" + cat.replace(/\s+/g, "");
        divCat.style.display = idx === 0 ? "block" : "none";

        // ... (Resto de tu lógica de renderizado de productos con banners y estrellas)
        let html = "";
        if (menuConfig?.banners_categoria?.[cat]) {
            html += `<div class="banner-categoria-grupo"><img src="${limpiarRuta(menuConfig.banners_categoria[cat])}"></div>`;
        }
        html += `<h3 class="titulo-categoria">${cat}</h3><div class="grid-productos">`;
        
        menuData[cat].forEach(p => {
            const cod = String(p.codigo).trim();
            const img = imagenes[cod] || p.imagen;
            const esRec = menuConfig?.recomendados?.includes(cod);
            const desc = descripciones[cod] || ""; // Añadimos descripción

            html += `
                <div class="card-producto" onclick='abrirModalProducto(${JSON.stringify(p)})'>
                    <div class="contenedor-media">
                        ${esRec ? '<span class="badge-estrella">⭐ Recomendado</span>' : ''}
                        ${img ? `<img src="${limpiarRuta(img)}">` : '<div class="sin-foto"></div>'}
                    </div>
                    <div class="info">
                        <span class="nombre">${p.articulo}</span>
                        <span class="precio">$${Number(p.precio).toLocaleString()}</span>
                        ${desc ? `<p class="descripcion-corta">${desc}</p>` : ''}
                    </div>
                </div>`;
        });
        divCat.innerHTML = html + `</div>`;
        menuCont.appendChild(divCat);
    });
}
function verificarHorario() {
    if (!menuConfig?.horarios) return true;
    const ahora = new Date();
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const config = menuConfig.horarios[dias[ahora.getDay()]];
    if (!config) return true;
    if (config.cerrado === true || config.cerrado === "True") return false;
    const [hi, mi] = config.inicio.split(':').map(Number);
    const [hf, mf] = config.fin.split(':').map(Number);
    const mAhora = ahora.getHours() * 60 + ahora.getMinutes();
    return mAhora >= (hi * 60 + mi) && mAhora <= (hf * 60 + mf);
}

function cambiarCategoria(cat) {
    const id = "cat-" + cat.replace(/\s+/g, "");
    document.querySelectorAll(".bloque-categoria").forEach(d => d.style.display = d.id === id ? "block" : "none");
}
function ajustarEstiloMetodo(radio) {
    document.querySelectorAll('.btn-metodo').forEach(el => {
        el.style.background = "#222"; el.style.color = "#fff";
    });
    radio.nextElementSibling.style.background = "var(--color-principal)";
    radio.nextElementSibling.style.color = "#000";
}

function limpiarRuta(r) {
    if (!r) return "";
    return r.replace(/\\/g, "/") + "?v=" + Date.now();
}

function aplicarPortada() {
    if (!menuConfig?.portada) return;
    const { banner, logo } = menuConfig.portada;
    if (banner) document.getElementById("portada").style.backgroundImage = `url('${limpiarRuta(banner)}')`;
    if (logo) document.getElementById("portada-logo").src = limpiarRuta(logo);
}

function encontrarProductoPorCodigo(codigo) {
    for (let cat in menuData) {
        let p = menuData[cat].find(x => String(x.codigo).trim() === String(codigo).trim());
        if (p) return p;
    }
    return null;
}

function mostrarToast(m) {
    const t = document.getElementById("toast");
    if (t) { t.innerText = m; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 2000); }
}

function toggleCarrito() {
    document.getElementById("carrito-panel").classList.toggle("activo");
}

function eliminarDelCarrito(i) {
    if (carrito[i].cantidad > 1) carrito[i].cantidad--; else carrito.splice(i, 1);
    actualizarVistaCarrito();
}

window.onpopstate = function() {
    document.getElementById("modal-producto")?.classList.remove("activo");
    document.getElementById("carrito-panel")?.classList.remove("activo");
    document.getElementById("modal-confirmacion")?.classList.remove("activo");
    document.getElementById("modal-promo")?.remove();
};

document.addEventListener("DOMContentLoaded", inicializarApp);
