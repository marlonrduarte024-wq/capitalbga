import pyodbc
from collections import defaultdict
import json
from datetime import datetime
import os
import customtkinter as ctk
import sys
import traceback

# 👇 IMPORT DEL MÓDULO NUEVO
from supabase_utils import subir_archivo


# ===============================
# FUNCIÓN PARA MOSTRAR VENTANA
# ===============================
def mostrar_ventana(titulo, mensaje, es_error=False):
    app = ctk.CTk()
    app.title(titulo)
    app.geometry("320x170")
    app.resizable(False, False)

    if es_error:
        color = "#ff4d4d"
        icono = "❌"
    else:
        color = "#2ecc71"
        icono = "✅"

    ctk.CTkLabel(
        app,
        text=f"{icono} {mensaje}",
        font=ctk.CTkFont(size=15, weight="bold"),
        wraplength=280,
        justify="center",
        text_color=color
    ).pack(pady=30)

    ctk.CTkButton(
        app,
        text="Cerrar",
        command=app.destroy,
        width=120
    ).pack(pady=5)

    app.mainloop()


# ===============================
# PROCESO PRINCIPAL
# ===============================
try:

    # Conexión a SQL Server
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 18 for SQL Server};"
        "SERVER=CAJA\\POSRED;"
        "DATABASE=Tempomes;"
        "UID=touch;"
        "PWD=touchuser;"
        "TrustServerCertificate=yes;"
    )

    cursor = conn.cursor()

    query = """
    SELECT
        g.grupomadre,
        g.Descripcion AS grupo,
        a.codigo,
        a.articulo,
        a.[precio de venta] AS precio_venta,
        a.iva
    FROM grupos AS g
    INNER JOIN [tabla de articulos] AS a
        ON a.codgrupo = g.grupomadre
    WHERE (g.grupomadre IS NOT NULL)
    ORDER BY grupo, a.articulo;
    """

    cursor.execute(query)

    menu = defaultdict(list)

    for row in cursor.fetchall():
        menu[row.grupo].append({
            "codigo": str(row.codigo).strip(),
            "articulo": str(row.articulo).strip(),
            "precio": float(row.precio_venta),
            "iva": float(row.iva or 0)
        })

    conn.close()

    # ===============================
    # ESTRUCTURA FINAL
    # ===============================
    menu_final = {
        "actualizado": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "menu": menu
    }

    # ===============================
    # GUARDAR LOCAL
    # ===============================
    rutas = [
        r"c:\posred\bot\menu.json",
        r"c:\posred\bot\web\menu.json"
    ]

    for ruta in rutas:
        os.makedirs(os.path.dirname(ruta), exist_ok=True)

        with open(ruta, "w", encoding="utf-8") as f:
            json.dump(menu_final, f, indent=4, ensure_ascii=False)

        print(f"✅ Generado en: {ruta}")

    # ===============================
    # SUBIR A SUPABASE
    # ===============================
    subir_archivo("menu.json", r"c:\posred\bot\web\menu.json")

    # ===============================
    # VENTANA OK
    # ===============================
    mostrar_ventana("Menú", "Menú actualizado correctamente")

except Exception as e:
    error_detalle = str(e)

    print("❌ ERROR:", error_detalle)
    traceback.print_exc()

    mostrar_ventana("Error", f"Ocurrió un error:\n{error_detalle}", es_error=True)

    sys.exit(1)