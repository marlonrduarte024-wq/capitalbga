// =======================
// ESTADO GLOBAL
// =======================
let carrito = [];
let menuConfig = null;
let menuData = null;
let descripciones = {};
let imagenes = {};
let observacionesConfig = {};
let acompanamientosConfig = {};
window.acompanamientosConfig = null;


// =======================
// CARGAR ACOMPAÑAMIENTOS
// =======================


// =======================
// CARGAR CONFIG EMPAQUES
// =======================
window.empaquesConfig = null;

fetch("custom/empaques.json?v=" + new Date().getTime())
.then(r=>r.json())
.then(data=>{
  console.log("CONFIG EMPAQUES CARGADA:", data);
  window.empaquesConfig = data;
});
// =======================
// CONFIGURACIÓN (PORTADA / ORDEN / BANNERS)
// =======================
fetch("menu_config.json")
  .then(r => r.json())
  .then(cfg => {
    menuConfig = cfg;
    aplicarPortada();
  });


// =======================
// DESCRIPCIONES
// =======================
fetch("descripciones.json")
  .then(r => r.json())
  .then(data => {
    descripciones = data;
  });


// =======================
// PORTADA
// =======================
function aplicarPortada() {
  if (!menuConfig || !menuConfig.portada) return;

  const { banner, logo } = menuConfig.portada;
  const cont = document.getElementById("portada");
  if (!cont) return;

  cont.innerHTML = `
    <div class="portada" style="background-image:url('${limpiarRuta(banner)}')">
      <div class="portada-overlay glass">
        <img src="${limpiarRuta(logo)}" class="portada-logo">
      </div>
    </div>
  `;
}


// =======================
// LIMPIAR RUTA
// =======================
function limpiarRuta(ruta) {

  if (!ruta) return "";

  const partesAssets = ruta.split("assets");
  const partesImagenes = ruta.split("imagenes");

  let limpia = ruta;

  if (partesAssets.length > 1) {
    limpia = "assets" + partesAssets[1];
  }

  if (partesImagenes.length > 1) {
    limpia = "imagenes" + partesImagenes[1];
  }

  limpia = limpia.replace(/\\/g, "/");

  return limpia + "?v=" + new Date().getTime();
}


// =======================
// RECOMENDADOS
// =======================
fetch("top_items.json")
  .then(r => r.json())
  .then(items => {
    const cont = document.getElementById("recomendados");
    if(!cont) return;

    items.forEach(p => {
      cont.innerHTML += `
        <div class="card-recomendado animar">
          <img src="${limpiarRuta(p.imagen)}">
          <div class="card-body">
            <h3>${p.nombre}</h3>
            <div class="precio">$${Number(p.precio).toLocaleString()}</div>
            <div class="descripcion">${p.descripcion || ""}</div>
            <button class="btn-agregar" onclick='agregarAlCarrito({
              codigo: "${p.codigo}",
              nombre: "${p.nombre}",
              precio: ${p.precio}
            })'>
              ➕ Agregar
            </button>
          </div>
        </div>
      `;
    });
  });


// =======================
// MENU + NAV
// =======================
async function cargarMenuCompleto() {

  try {

    const [menuRes, descRes, configRes, imgRes, obsRes, acompRes] = await Promise.all([
      fetch("menu.json?v=" + new Date().getTime()),
      fetch("descripciones.json?v=" + new Date().getTime()),
      fetch("menu_config.json?v=" + new Date().getTime()),
      fetch("imagenes.json?v=" + new Date().getTime()),
      fetch("observaciones.json?v=" + new Date().getTime()),
      fetch("custom/acompanamientos.json?v=" + new Date().getTime())
    ]);

    // ===============================
    // VALIDAR RESPUESTAS
    // ===============================
    if (!menuRes.ok) throw new Error("menu.json no cargó");
    if (!descRes.ok) throw new Error("descripciones.json no cargó");
    if (!configRes.ok) throw new Error("menu_config.json no cargó");
    if (!imgRes.ok) throw new Error("imagenes.json no cargó");
    if (!obsRes.ok) throw new Error("observaciones.json no cargó");
    if (!acompRes.ok) throw new Error("acompanamientos.json no cargó");

    // ===============================
    // PARSEAR JSON
    // ===============================
    const menuJson = await menuRes.json();
    const descJson = await descRes.json();
    const configJson = await configRes.json();
    const imgJson = await imgRes.json();
    const obsJson = await obsRes.json();
    const acompJson = await acompRes.json();

    // ===============================
    // ASIGNAR VARIABLES
    // ===============================
    menuData = menuJson.menu || {};
    descripciones = descJson || {};
    menuConfig = configJson || {};
    imagenes = imgJson || {};
    observacionesConfig = obsJson || {};
    acompanamientosConfig = acompJson || {};

    console.log("MENU OK", menuData);
    console.log("IMAGENES OK", imagenes);
    console.log("ACOMPAÑAMIENTOS OK", acompanamientosConfig);

    // ===============================
    // RENDER
    // ===============================
    renderMenu();

  } catch (e) {
    console.error("❌ Error cargando menu:", e);
  }
}

cargarMenuCompleto();


function renderMenu() {

  const cont = document.getElementById("menu");
  const nav = document.getElementById("nav-categorias");

  cont.innerHTML = "";
  nav.innerHTML = "";

  Object.keys(menuData).forEach(cat => {

    const btn = document.createElement("button");
    btn.innerText = cat;
    btn.onclick = () => toggleCategoria(cat);

    nav.appendChild(btn);

    const banner = menuConfig?.banners_categoria?.[cat] || "";

    let html = `
      <div class="bloque-categoria categoria"
           id="${cat}"
           style="display:none">

        ${banner ? `
          <div class="banner-categoria">
            <img src="${limpiarRuta(banner)}">
          </div>
        ` : ""}

        <h3>${cat}</h3>

        <div class="grid-productos">
    `;

    menuData[cat].forEach(p => {

      const img = imagenes?.[p.codigo.trim()] || p.imagen || "";

      html += `
        <div class="card-producto"
             onclick='abrirModalProducto(${JSON.stringify(p)})'>

          <img src="${limpiarRuta(img)}"
               onerror="this.style.display='none'">

          <div class="info">
            <span class="nombre">${p.articulo}</span>
            <span class="precio">$${Number(p.precio).toLocaleString()}</span>
          </div>

        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    cont.innerHTML += html;
  });
}

function toggleCategoria(cat) {

  const bloque = document.getElementById(cat);
  const botones = document.querySelectorAll(".categorias-nav button");

  const abierto = bloque.style.display === "block";

  // cerrar todos
  document.querySelectorAll(".bloque-categoria")
    .forEach(el => el.style.display = "none");

  botones.forEach(b => b.classList.remove("activo"));

  // abrir si estaba cerrado
  if (!abierto) {
    bloque.style.display = "block";

    // activar botón
    botones.forEach(b => {
      if (b.innerText === cat) {
        b.classList.add("activo");
      }
    });
  }
}
// =======================
// ORDEN DE CATEGORÍAS
// =======================
function aplicarOrdenCategorias() {

  if (!menuConfig || !menuConfig.orden_categorias) return;

  const menu = document.getElementById("menu");

  menuConfig.orden_categorias.forEach(nombre => {

    const cat = menu.querySelector(
      `.categoria[data-categoria="${nombre}"]`
    );

    if (cat) menu.appendChild(cat);

  });
}


// =======================
// BANNERS POR CATEGORÍA
// =======================
function aplicarBannersCategoria() {

  if (!menuConfig || !menuConfig.banners_categoria) return;

  Object.entries(menuConfig.banners_categoria).forEach(([nombre, banner]) => {

    const cat = document.querySelector(
      `.categoria[data-categoria="${nombre}"]`
    );

    if (!cat) return;

    cat.insertAdjacentHTML("afterbegin", `
      <div class="banner-categoria sombra">
        <img src="${limpiarRuta(banner)}">
      </div>
    `);

  });
}


// =======================
// ANIMACIONES CATEGORIAS
// =======================
function animarCategorias(){

  const cats = document.querySelectorAll(".fadein");

  cats.forEach((c,i)=>{

    setTimeout(()=>{
      c.classList.add("visible");
    }, i*120);

  });

}


// =======================
// LÓGICA DE AGREGAR (CORREGIDA PARA LÍNEAS APARTE)
// =======================
function agregarAlCarrito(producto) {

  if(window.acompanamientosConfig){

    const codigo = String(producto.codigo).trim();
    const grupos = acompanamientosConfig[codigo];

    if(grupos){
      // Llama a la función del modal en el index.html
      abrirModalAcompanamientos(codigo, (obs)=>{
        // Clonamos el objeto para no afectar la referencia original
        let nuevoProducto = {...producto};
        nuevoProducto.observacion = obs;
        agregarAlCarritoFinal(nuevoProducto);
      });
      return;
    }
  }

  agregarAlCarritoFinal(producto);
}

function agregarAlCarritoFinal(producto){
  
  // Ahora buscamos un item que coincida en CODIGO Y OBSERVACION
  const obsActual = producto.observacion || "";
  
  const existente = carrito.find(p => 
    p.codigo === producto.codigo && 
    (p.observacion || "") === obsActual
  );

  if (existente) {
    // Si es idéntico (mismo código y mismos acompañamientos), sumamos cantidad
    existente.cantidad += 1;
  }
  else {
    // Si algo cambia (el código o el acompañamiento), se crea una línea nueva
    carrito.push({
      codigo: producto.codigo,
      nombre: producto.nombre,
      precio: Number(producto.precio),
      cantidad: 1,
      observacion: obsActual
    });
  }

  // =======================
  // VERIFICAR EMPAQUE
  // =======================
  if(window.empaquesConfig){

    const codigo = String(producto.codigo).trim();
    const config = window.empaquesConfig[codigo];

    if(config){

      const codigoEmpaque = String(config.empaque);

      // buscar el producto del empaque en el menu
      let productoEmpaque = null;

      Object.values(menuData).forEach(cat=>{
        cat.forEach(p=>{
          if(String(p.codigo).trim() === codigoEmpaque){
            productoEmpaque = p;
          }
        });
      });

      if(productoEmpaque){

        const existenteEmp = carrito.find(p => 
          p.codigo === codigoEmpaque && 
          (p.observacion || "") === ""
        );

        if(existenteEmp){
          existenteEmp.cantidad += 1;
        } else {
          carrito.push({
            codigo: codigoEmpaque,
            nombre: productoEmpaque.articulo,
            precio: Number(productoEmpaque.precio),
            cantidad: 1,
            observacion: ""
          });
        }

      }

    }

  }

  renderCarrito();
  mostrarToast(`✅ ${producto.nombre} agregado`);
}


// =======================
// QUITAR DEL CARRITO (CORREGIDA)
// =======================
function quitarDelCarrito(index) {
  // Ahora usamos el INDEX del array para mayor precisión al borrar
  if (carrito[index]) {
    if (carrito[index].cantidad > 1) {
      carrito[index].cantidad -= 1;
    } else {
      carrito.splice(index, 1);
    }
  }

  renderCarrito();
}


// =======================
// RENDERIZAR CARRITO
// =======================
function renderCarrito() {

  const cont = document.getElementById("carrito-items");
  const count = document.getElementById("carrito-count");
  const totalDiv = document.getElementById("carrito-total");
  const btn = document.getElementById("btn-whatsapp");

  if(!cont) return;
  cont.innerHTML = "";

  let totalItems = 0;
  let total = 0;

  carrito.forEach((p, index)=>{

    totalItems += p.cantidad;
    total += p.precio * p.cantidad;

    cont.innerHTML += `
      <div class="carrito-item animar" data-index="${index}">
        <div>
          <strong>${p.nombre}</strong><br>
          <small>x${p.cantidad}</small>
          ${p.observacion ? `<br><span style="font-size:0.8em; color:var(--color-secundario)">${p.observacion}</span>` : ''}

          <textarea
            class="input-obs"
            placeholder="Observaciones adicionales..."
            oninput="actualizarObservacion(${index}, this.value)"
          >${p.observacion || ""}</textarea>
        </div>

        <div>
          <span>$${(p.precio * p.cantidad).toLocaleString()}</span>
          <button class="btn-quitar"
          onclick="quitarDelCarrito(${index})">➖</button>
        </div>
      </div>
    `;
  });

  if(count) count.innerText = totalItems;
  if(totalDiv) totalDiv.innerText = `$${total.toLocaleString()}`;
  if(btn) btn.disabled = carrito.length === 0;

}


// =======================
// OBSERVACIONES
// =======================
function actualizarObservacion(index, valor) {
  if (carrito[index]) {
    carrito[index].observacion = valor.trim();
  }
}


// =======================
// WHATSAPP
// =======================
async function enviarWhatsApp() {

  if (carrito.length === 0) return;

  const lineas = [];

  carrito.forEach(p => {
    lineas.push(`RKO|${p.codigo}|${p.cantidad}`);
    if (p.observacion && p.observacion.length > 0) {
      lineas.push(`RKO|CONTROLRESTRICCIONES|0|0|${p.observacion}`);
    }
  });

  const mensaje = lineas.join("\n");
  const telefono = await obtenerTelefono();

  mostrarModalConfirmacion(mensaje, telefono);
}


function mostrarModalConfirmacion(mensaje, telefono) {

  const modal = document.getElementById("modal-confirmacion");
  const texto = document.getElementById("modal-mensaje-preview");

  if(!modal || !texto) return;

  texto.textContent =
    "PEDIDO LISTO💥:\n\n" +
    "Envía el mensaje EXACTAMENTE como está.\n" +
    "Desde el chat puedes darnos tus datos completos.\n\n" +
    "¿Deseas continuar?";

  modal.classList.add("activo");

  document.getElementById("btn-confirmar-envio").onclick = () => {
    window.open(
      `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`,
      "_blank"
    );
    modal.classList.remove("activo");
  };

  document.getElementById("btn-cancelar-envio").onclick = () => {
    modal.classList.remove("activo");
  };
}


async function obtenerTelefono(){
  try {
    const r = await fetch("config_whatsapp1.txt");
    const txt = await r.text();
    const linea = txt.split("\n").find(l => l.startsWith("telefono="));
    return linea.split("=")[1].trim();
  } catch (e) {
    console.error("Error obteniendo telefono:", e);
    return "";
  }
}


// =======================
// TOAST
// =======================
function mostrarToast(texto){

  const toast = document.getElementById("toast");
  if(!toast) return;

  toast.textContent = texto;
  toast.classList.add("show");

  clearTimeout(toast._timer);

  toast._timer = setTimeout(()=>{
    toast.classList.remove("show");
  },1300);

}


// =======================
// TOGGLE CARRITO
// =======================
function toggleCarrito(){
  const panel = document.getElementById("carrito-panel");
  if(panel) panel.classList.toggle("activo");
}
let productoModal = null;

function abrirModalProducto(p) {

  productoModal = p;

  const codigo = p.codigo.trim();

  // ===============================
  // DATOS BÁSICOS
  // ===============================
  document.getElementById("modal-nombre").innerText = p.articulo;

  const img = imagenes?.[codigo] || p.imagen || "";
  document.getElementById("modal-img").src = limpiarRuta(img);

  document.getElementById("modal-desc").innerText =
    descripciones[codigo] || "";

  document.getElementById("modal-precio").innerText =
    "$" + Number(p.precio).toLocaleString();


  // ===============================
  // OBSERVACIONES
  // ===============================
  const obsInput = document.getElementById("modal-obs");

  if (obsInput) {
    obsInput.value = "";
  }


  // ===============================
  // ACOMPAÑAMIENTOS
  // ===============================
  const cont = document.getElementById("modal-acompanamientos-list");

  if (cont) {

    cont.innerHTML = "";

    const lista = acompanamientosConfig?.[codigo] || [];

    if (lista.length > 0) {

      cont.innerHTML += `<h4>Acompañamientos</h4>`;

      lista.forEach(op => {

        cont.innerHTML += `
          <label class="item-acomp">
            <input type="checkbox" value="${op}">
            ${op}
          </label>
        `;
      });

    }

  }

  // ===============================
  // MOSTRAR MODAL
  // ===============================
  document.getElementById("modal-producto").classList.add("activo");
}

function agregarDesdeModal() {
  if (!productoModal) return;

  agregarAlCarrito({
    codigo: productoModal.codigo.trim(),
    nombre: productoModal.articulo,
    precio: productoModal.precio
  });

  cerrarModalProducto();
}

function cerrarModalProducto() {
  document.getElementById("modal-producto").classList.remove("activo");
}