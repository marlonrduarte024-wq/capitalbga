import pyodbc
import customtkinter as ctk
from tkinter import messagebox

ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

# ==========================
# CONEXIÓN SQL
# ==========================
CONN_STR = (
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=CAJA\\POSRED;"
    "DATABASE=Tempomes;"
    "UID=touch;"
    "PWD=touchuser;"
    "TrustServerCertificate=yes;"
)

# ==========================
# CARGAR GRUPOS
# ==========================
def cargar_grupos():
    conn = pyodbc.connect(CONN_STR)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT CodGrupo, Descripcion, grupomadre
        FROM grupos
        ORDER BY Descripcion
    """)

    datos = cursor.fetchall()
    conn.close()
    return datos

# ==========================
# GUARDAR CAMBIOS
# ==========================
def guardar():
    try:
        conn = pyodbc.connect(CONN_STR)
        cursor = conn.cursor()

        for codgrupo, var in check_vars.items():
            if var.get() == 1:
                cursor.execute("""
                    UPDATE grupos
                    SET grupomadre = CodGrupo
                    WHERE CodGrupo = ?
                """, codgrupo)
            else:
                cursor.execute("""
                    UPDATE grupos
                    SET grupomadre = NULL
                    WHERE CodGrupo = ?
                """, codgrupo)

        conn.commit()
        conn.close()

        messagebox.showinfo("Éxito", "Grupos actualizados correctamente")

        # 🔥 Cerrar ventana después de guardar
        app.destroy()

    except Exception as e:
        messagebox.showerror("Error", str(e))


# ==========================
# UI
# ==========================
app = ctk.CTk()
app.title("Selector de Grupos del Bot")
app.geometry("550x650")

titulo = ctk.CTkLabel(
    app,
    text="Selecciona los grupos que deseas mostrar en el Bot",
    font=ctk.CTkFont(size=18, weight="bold")
)
titulo.pack(pady=15)

# Frame scrollable moderno
scroll_frame = ctk.CTkScrollableFrame(app, width=500, height=500)
scroll_frame.pack(padx=20, pady=10, fill="both", expand=True)

check_vars = {}

datos = cargar_grupos()

for codgrupo, descripcion, grupomadre in datos:
    var = ctk.IntVar()

    if grupomadre == codgrupo:
        var.set(1)

    chk = ctk.CTkCheckBox(
        scroll_frame,
        text=f"{descripcion}   (Cod: {codgrupo})",
        variable=var
    )
    chk.pack(anchor="w", pady=5, padx=10)

    check_vars[codgrupo] = var

boton_guardar = ctk.CTkButton(
    app,
    text="💾 Guardar y cerrar",
    height=45,
    font=ctk.CTkFont(size=15, weight="bold"),
    command=guardar
)
boton_guardar.pack(pady=20, padx=20, fill="x")

app.mainloop()