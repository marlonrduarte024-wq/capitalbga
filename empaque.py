import json
import tkinter as tk
from tkinter import ttk

MENU_JSON = "menu.json"
SALIDA_JSON = "custom/empaques.json"


# cargar menu
with open(MENU_JSON, encoding="utf8") as f:
    data = json.load(f)

menu = data["menu"]


# convertir menu en lista plana
productos = []

for categoria in menu.values():
    for item in categoria:
        productos.append(item)


relaciones = {}


root = tk.Tk()
root.title("Configurador de empaques")
root.geometry("900x500")


# ------------------------
# PRODUCTOS
# ------------------------

frame_productos = tk.Frame(root)
frame_productos.pack(side="left", fill="both", expand=True, padx=10, pady=10)

tk.Label(frame_productos, text="Productos").pack()

lista_productos = tk.Listbox(frame_productos)
lista_productos.pack(fill="both", expand=True)

for p in productos:
    lista_productos.insert("end", f'{p["codigo"]} - {p["articulo"]}')


# ------------------------
# EMPAQUES
# ------------------------

frame_empaque = tk.Frame(root)
frame_empaque.pack(side="left", padx=10)

tk.Label(frame_empaque, text="Empaque").pack()

combo_empaque = ttk.Combobox(frame_empaque)

empaques = []
for p in productos:
    empaques.append(f'{p["codigo"]} - {p["articulo"]}')

combo_empaque["values"] = empaques
combo_empaque.pack()


# ------------------------
# RELACIONES
# ------------------------

frame_relaciones = tk.Frame(root)
frame_relaciones.pack(side="right", fill="both", expand=True, padx=10, pady=10)

tk.Label(frame_relaciones, text="Relaciones creadas").pack()

lista_relaciones = tk.Listbox(frame_relaciones)
lista_relaciones.pack(fill="both", expand=True)


def agregar():

    if not lista_productos.curselection():
        return

    prod = lista_productos.get(lista_productos.curselection())
    emp = combo_empaque.get()

    if not emp:
        return

    cod_prod = prod.split(" - ")[0]
    cod_emp = emp.split(" - ")[0]

    relaciones[cod_prod] = {"empaque": cod_emp}

    lista_relaciones.insert("end", f"{cod_prod} -> {cod_emp}")


def guardar():

    with open(SALIDA_JSON, "w", encoding="utf8") as f:
        json.dump(relaciones, f, indent=2)

    print("empaques.json guardado")


tk.Button(frame_empaque, text="Agregar", command=agregar).pack(pady=10)
tk.Button(frame_empaque, text="Guardar", command=guardar).pack()

root.mainloop()