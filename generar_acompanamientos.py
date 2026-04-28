import json
import os
import tkinter as tk
from tkinter import ttk, messagebox

# 👇 NUEVO
from supabase_utils import subir_archivo

MENU_FILE = "menu.json"
OUTPUT_FILE = "web/custom/acompanamientos.json"

grupos = {}
productos_por_grupo = {}

# -----------------------
# cargar menu
# -----------------------
def cargar_menu():
    with open(MENU_FILE, encoding="utf-8") as f:
        return json.load(f)["menu"]

menu = cargar_menu()

# -----------------------
# cargar config previa
# -----------------------
def cargar_config():

    global grupos, productos_por_grupo

    if not os.path.exists(OUTPUT_FILE):
        return

    with open(OUTPUT_FILE, encoding="utf-8") as f:
        data = json.load(f)

    grupos = data.get("grupos", {})

    productos = data.get("productos", {})

    for codigo, lista in productos.items():

        for g in lista:

            if g not in productos_por_grupo:
                productos_por_grupo[g] = []

            productos_por_grupo[g].append(codigo)

cargar_config()

# -----------------------
# UI
# -----------------------
app = tk.Tk()
app.title("Configurador de Acompañamientos")
app.geometry("1200x600")

frame = ttk.Frame(app)
frame.pack(fill="both", expand=True)

col1 = ttk.Frame(frame)
col1.pack(side="left", fill="y", padx=10)

col2 = ttk.Frame(frame)
col2.pack(side="left", fill="both", expand=True, padx=10)

col3 = ttk.Frame(frame)
col3.pack(side="left", fill="both", expand=True, padx=10)

# -----------------------
# columna grupos
# -----------------------
ttk.Label(col1,text="Grupos").pack()

lista_grupos=tk.Listbox(col1,height=25)
lista_grupos.pack()

grupo_entry=tk.Entry(col1)
grupo_entry.pack(pady=5)

def crear_grupo():

    nombre=grupo_entry.get().strip()

    if not nombre:
        return

    if nombre not in grupos:
        grupos[nombre]=[]
        productos_por_grupo[nombre]=[]

    refrescar_grupos()

ttk.Button(col1,text="Crear grupo",command=crear_grupo).pack()

# -----------------------
# columna opciones
# -----------------------
ttk.Label(col2,text="Opciones del grupo").pack()

lista_opciones=tk.Listbox(col2,height=20)
lista_opciones.pack(fill="x")

opcion_entry=tk.Entry(col2)
opcion_entry.pack(pady=5)

def agregar_opcion():

    g=grupo_actual()

    if not g:
        return

    texto=opcion_entry.get().strip()

    if not texto:
        return

    grupos[g].append(texto)

    mostrar_opciones(g)

ttk.Button(col2,text="Agregar opción",command=agregar_opcion).pack()

# -----------------------
# productos
# -----------------------
ttk.Label(col3,text="Productos del menú").pack()

canvas=tk.Canvas(col3)
scroll=ttk.Scrollbar(col3,orient="vertical",command=canvas.yview)

productos_frame=ttk.Frame(canvas)

productos_frame.bind(
"<Configure>",
lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
)

canvas.create_window((0,0),window=productos_frame,anchor="nw")

canvas.configure(yscrollcommand=scroll.set)

canvas.pack(side="left",fill="both",expand=True)
scroll.pack(side="right",fill="y")

checks={}

def cargar_productos():

    for widget in productos_frame.winfo_children():
        widget.destroy()

    for grupo_menu,items in menu.items():

        ttk.Label(
        productos_frame,
        text=grupo_menu,
        font=("Arial",11,"bold")
        ).pack(anchor="w",pady=5)

        for item in items:

            var=tk.BooleanVar()

            chk=ttk.Checkbutton(
            productos_frame,
            text=item["articulo"],
            variable=var
            )

            chk.pack(anchor="w")

            checks[item["codigo"]]=var

cargar_productos()

# -----------------------
# helpers
# -----------------------
def grupo_actual():

    if not lista_grupos.curselection():
        return None

    return lista_grupos.get(lista_grupos.curselection())

def refrescar_grupos():

    lista_grupos.delete(0,tk.END)

    for g in grupos:
        lista_grupos.insert(tk.END,g)

def mostrar_opciones(grupo):

    lista_opciones.delete(0,tk.END)

    for op in grupos[grupo]:
        lista_opciones.insert(tk.END,op)

# -----------------------
# seleccionar grupo
# -----------------------
def seleccionar_grupo(event):

    g=grupo_actual()

    if not g:
        return

    mostrar_opciones(g)

    for codigo,var in checks.items():

        if g in productos_por_grupo and codigo in productos_por_grupo[g]:
            var.set(True)
        else:
            var.set(False)

lista_grupos.bind("<<ListboxSelect>>",seleccionar_grupo)

# -----------------------
# guardar
# -----------------------
def guardar():

    g=grupo_actual()

    if not g:
        messagebox.showwarning("Aviso","Selecciona un grupo")
        return

    productos_por_grupo[g]=[]

    for codigo,var in checks.items():

        if var.get():
            productos_por_grupo[g].append(codigo)

    data={
        "grupos":grupos,
        "productos":{}
    }

    for grupo,productos in productos_por_grupo.items():

        for p in productos:

            if p not in data["productos"]:
                data["productos"][p]=[]

            data["productos"][p].append(grupo)

    os.makedirs("web/custom",exist_ok=True)

    with open(OUTPUT_FILE,"w",encoding="utf-8") as f:
        json.dump(data,f,indent=2,ensure_ascii=False)

    # 🔥 SUBIR A SUPABASE
    subir_archivo("acompanamientos.json", OUTPUT_FILE)

    messagebox.showinfo("Guardado","Configuración guardada")

ttk.Button(col3,text="Guardar grupo",command=guardar).pack(pady=10)

refrescar_grupos()

app.mainloop()