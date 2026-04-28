import json
import os
import customtkinter as ctk
from tkinter import messagebox, filedialog

import cloudinary
import cloudinary.uploader

# 👇 NUEVO
from supabase_utils import subir_archivo


# ===============================
# CONFIG CLOUDINARY
# ===============================
cloudinary.config(
    cloud_name="dwybifbi1",
    api_key="423837462813586",
    api_secret="biwa-T8ai99tpYgJiqSpEMz5cEI"
)



FOLDER_CLOUDINARY = "menu/restaurante1"

# ===============================
# ARCHIVOS
# ===============================
MENU_FILE = "c:/posred/bot/menu.json"
DESC_FILE = "c:/posred/bot/web/descripciones.json"
IMG_FILE = "c:/posred/bot/web/imagenes.json"


# ===============================
# CARGAR MENU
# ===============================
def cargar_menu():
    with open(MENU_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["menu"]


# ===============================
# CARGAR DESCRIPCIONES
# ===============================
def cargar_descripciones():
    if not os.path.exists(DESC_FILE):
        return {}

    with open(DESC_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


# ===============================
# CARGAR IMAGENES
# ===============================
def cargar_imagenes():
    if not os.path.exists(IMG_FILE):
        return {}

    with open(IMG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


# ===============================
# GUARDAR DESCRIPCION
# ===============================
def guardar_descripcion(codigo, entry):

    descripcion = entry.get().strip()

    if descripcion:
        descripciones[codigo] = descripcion
    else:
        if codigo in descripciones:
            del descripciones[codigo]

    with open(DESC_FILE, "w", encoding="utf-8") as f:
        json.dump(descripciones, f, indent=4, ensure_ascii=False)

    # 🔥 SUBIR A SUPABASE
    subir_archivo("descripciones.json", DESC_FILE)

    messagebox.showinfo("Guardado", "Descripción guardada correctamente")


# ===============================
# GUARDAR IMAGEN
# ===============================
def guardar_imagen(codigo, entry):

    url = entry.get().strip()

    if url:
        imagenes[codigo] = url
    else:
        if codigo in imagenes:
            del imagenes[codigo]

    with open(IMG_FILE, "w", encoding="utf-8") as f:
        json.dump(imagenes, f, indent=4, ensure_ascii=False)

    # 🔥 SUBIR A SUPABASE
    subir_archivo("imagenes.json", IMG_FILE)

    messagebox.showinfo("Guardado", "Imagen guardada correctamente")


# ===============================
# SUBIR IMAGEN A CLOUDINARY
# ===============================
def subir_imagen(codigo, entry):

    file_path = filedialog.askopenfilename(
        filetypes=[("Imagenes", "*.jpg *.jpeg *.png *.webp")]
    )

    if not file_path:
        return

    try:
        result = cloudinary.uploader.upload(
            file_path,
            folder=FOLDER_CLOUDINARY,
            public_id=str(codigo),
            overwrite=True
        )

        url = result["secure_url"]

        entry.delete(0, "end")
        entry.insert(0, url)

        imagenes[codigo] = url

        with open(IMG_FILE, "w", encoding="utf-8") as f:
            json.dump(imagenes, f, indent=4, ensure_ascii=False)

        # 🔥 SUBIR A SUPABASE AUTOMÁTICO
        subir_archivo("imagenes.json", IMG_FILE)

        messagebox.showinfo("Éxito", "Imagen subida correctamente")

    except Exception as e:
        messagebox.showerror("Error", f"No se pudo subir la imagen:\n{e}")


# ===============================
# TOGGLE CATEGORIA
# ===============================
def toggle(frame):

    if frame.winfo_viewable():
        frame.pack_forget()
    else:
        frame.pack(fill="x", padx=20)


# ===============================
# CERRAR APP
# ===============================
def cerrar_app():
    root.destroy()


# ===============================
# INTERFAZ
# ===============================
ctk.set_appearance_mode("dark")

root = ctk.CTk()
root.title("Editor de Menú")

root.attributes("-fullscreen", True)


menu = cargar_menu()
descripciones = cargar_descripciones()
imagenes = cargar_imagenes()


# ===============================
# BARRA SUPERIOR
# ===============================
topbar = ctk.CTkFrame(root, height=50)
topbar.pack(fill="x")

titulo = ctk.CTkLabel(
    topbar,
    text="Editor de Menú (Descripciones + Imágenes)",
    font=("Arial", 18, "bold")
)
titulo.pack(side="left", padx=20)

btn_cerrar = ctk.CTkButton(
    topbar,
    text="Cerrar",
    width=120,
    command=cerrar_app
)
btn_cerrar.pack(side="right", padx=20, pady=10)


# ===============================
# SCROLL PRINCIPAL
# ===============================
scroll = ctk.CTkScrollableFrame(root)
scroll.pack(fill="both", expand=True, padx=20, pady=20)


# ===============================
# CREAR INTERFAZ
# ===============================
for categoria, items in menu.items():

    btn_categoria = ctk.CTkButton(
        scroll,
        text=f"▼ {categoria}",
        anchor="w",
        height=40
    )
    btn_categoria.pack(fill="x", pady=5)

    frame_items = ctk.CTkFrame(scroll)

    btn_categoria.configure(
        command=lambda f=frame_items: toggle(f)
    )

    for item in items:

        codigo = item["codigo"]
        articulo = item["articulo"]

        frame_item = ctk.CTkFrame(frame_items)
        frame_item.pack(fill="x", pady=5, padx=10)

        label = ctk.CTkLabel(
            frame_item,
            text=articulo,
            width=300,
            anchor="w"
        )
        label.pack(side="left", padx=10)

        # ===============================
        # DESCRIPCION
        # ===============================
        entry_desc = ctk.CTkEntry(frame_item, width=350)
        entry_desc.pack(side="left", padx=10, pady=10)

        if codigo in descripciones:
            entry_desc.insert(0, descripciones[codigo])

        btn_desc = ctk.CTkButton(
            frame_item,
            text="Guardar Desc",
            width=120,
            command=lambda c=codigo, e=entry_desc: guardar_descripcion(c, e)
        )
        btn_desc.pack(side="left", padx=10)

        # ===============================
        # IMAGEN
        # ===============================
        entry_img = ctk.CTkEntry(frame_item, width=350, placeholder_text="URL imagen")
        entry_img.pack(side="left", padx=10)

        if codigo in imagenes:
            entry_img.insert(0, imagenes[codigo])

        btn_subir = ctk.CTkButton(
            frame_item,
            text="Subir Img",
            width=120,
            command=lambda c=codigo, e=entry_img: subir_imagen(c, e)
        )
        btn_subir.pack(side="left", padx=10)

        btn_guardar_img = ctk.CTkButton(
            frame_item,
            text="Guardar URL",
            width=120,
            command=lambda c=codigo, e=entry_img: guardar_imagen(c, e)
        )
        btn_guardar_img.pack(side="left", padx=10)


# ===============================
# SALIR FULLSCREEN CON ESC
# ===============================
def salir_fullscreen(event=None):
    root.attributes("-fullscreen", False)

root.bind("<Escape>", salir_fullscreen)

root.mainloop()