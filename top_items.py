import json
import os
import tkinter as tk
from tkinter import messagebox
import customtkinter as ctk

# ✅ IMPORTACIÓN DE TU UTILIDAD
from supabase_utils import subir_archivo

# ======================
# CONFIG VISUAL Y RUTAS
# ======================
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

RUTA_MENU = "c:/posred/bot/menu.json"
# Archivo de configuración unificado
RUTA_CONFIG = "c:/posred/bot/web/menu_config.json"

# ======================
# CARGA / GUARDADO
# ======================

def cargar_menu():
    try:
        with open(RUTA_MENU, "r", encoding="utf-8") as f:
            data = json.load(f)
        productos = []
        menu = data.get("menu", {})
        for categoria, items in menu.items():
            for p in items:
                productos.append({
                    "codigo": str(p.get("codigo", "")).strip(),
                    "nombre": p.get("articulo", "").strip(),
                    "categoria": categoria
                })
        return productos
    except Exception as e:
        messagebox.showerror("Error", f"No se pudo cargar menu.json: {e}")
        return []

def cargar_recomendados_actuales():
    if os.path.exists(RUTA_CONFIG):
        with open(RUTA_CONFIG, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("recomendados", [])
    return []

def guardar_recomendados():
    if os.path.exists(RUTA_CONFIG):
        try:
            with open(RUTA_CONFIG, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            # Actualizamos la lista de códigos recomendados
            data["recomendados"] = [p["codigo"] for p in top_items]
            
            # 1. Guardar localmente
            with open(RUTA_CONFIG, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            # 2. 🔥 SUBIR A SUPABASE AUTOMÁTICAMENTE
            # Usamos el nombre del archivo y la ruta local
            subir_archivo("menu_config.json", RUTA_CONFIG)

            messagebox.showinfo("Listo", "Productos recomendados guardados y actualizados en la web ☁️")
        
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo guardar o subir: {e}")

# ======================
# UI LOGIC
# ======================

menu_productos = cargar_menu()
codigos_top = cargar_recomendados_actuales()
top_items = [p for p in menu_productos if p["codigo"] in codigos_top]

root = ctk.CTk()
root.title("Gestor de Recomendados ⭐ - MenWapp")
root.geometry("900x650")

# Panel Izquierdo (Búsqueda)
panel_izq = ctk.CTkFrame(root, width=320)
panel_izq.pack(side="left", fill="y", padx=10, pady=10)

ctk.CTkLabel(panel_izq, text="🔍 Buscar Producto", font=("Arial", 14, "bold")).pack(pady=10)
buscar_var = tk.StringVar()
ctk.CTkEntry(panel_izq, textvariable=buscar_var, placeholder_text="Escribe el nombre...").pack(fill="x", padx=15)

lista_busqueda = tk.Listbox(panel_izq, bg="#1a1a1a", fg="white", font=("Arial", 10), borderwidth=0, highlightthickness=0)
lista_busqueda.pack(expand=True, fill="both", padx=15, pady=15)

# Panel Derecho (Seleccionados)
panel_der = ctk.CTkFrame(root)
panel_der.pack(side="right", expand=True, fill="both", padx=10, pady=10)
ctk.CTkLabel(panel_der, text="Productos con Estrella ⭐", font=("Arial", 16, "bold")).pack(pady=10)

frame_lista_top = ctk.CTkScrollableFrame(panel_der, fg_color="#1a1a1a")
frame_lista_top.pack(expand=True, fill="both", padx=10, pady=10)

def reconstruir_panel():
    for w in frame_lista_top.winfo_children():
        w.destroy()
    for prod in top_items:
        f = ctk.CTkFrame(frame_lista_top, fg_color="#2a2a2a")
        f.pack(fill="x", pady=3, padx=5)
        ctk.CTkLabel(f, text=f"⭐ {prod['nombre']}", font=("Arial", 12)).pack(side="left", padx=15, pady=10)
        ctk.CTkButton(f, text="Quitar", width=60, height=25, fg_color="#c0392b", hover_color="#e74c3c", 
                      command=lambda p=prod: eliminar(p)).pack(side="right", padx=10)

def eliminar(p):
    top_items.remove(p)
    reconstruir_panel()

def filtrar(*args):
    texto = buscar_var.get().lower()
    lista_busqueda.delete(0, "end")
    for p in menu_productos:
        if texto in p["nombre"].lower():
            lista_busqueda.insert("end", p["nombre"])

def agregar(event):
    if not lista_busqueda.curselection(): return
    seleccion = lista_busqueda.get(lista_busqueda.curselection())
    prod = next(p for p in menu_productos if p["nombre"] == seleccion)
    if prod["codigo"] not in [t["codigo"] for t in top_items]:
        top_items.append(prod)
        reconstruir_panel()

buscar_var.trace_add("write", filtrar)
lista_busqueda.bind("<Double-Button-1>", agregar)

# BOTÓN GUARDAR FINAL
btn_guardar = ctk.CTkButton(
    root, 
    text="💾 GUARDAR Y ACTUALIZAR ESTRELLAS EN LA WEB", 
    command=guardar_recomendados, 
    fg_color="#27ae60", 
    hover_color="#219150",
    font=("Arial", 14, "bold"),
    height=50
)
btn_guardar.pack(fill="x", padx=20, pady=15)

# INICIO
filtrar()
reconstruir_panel()
root.mainloop()