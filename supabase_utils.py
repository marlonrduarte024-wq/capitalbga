import requests

# ===============================
# CONFIGURACIÓN
# ===============================
SUPABASE_URL = "https://rvbllqsbkizsgcdrdhtp.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2YmxscXNia2l6c2djZHJkaHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODA5NTIsImV4cCI6MjA5Mjk1Njk1Mn0.Z8sO3NSduu8xWlHUKQ23_Q5uyjbyG1dkJ4Q-mQ9pQ7c"
BUCKET = "conf_pagina"


# ===============================
# SUBIR ARCHIVO
# ===============================
def subir_archivo(nombre_archivo, ruta_local):
    try:
        with open(ruta_local, "rb") as f:
            archivo = f.read()

        url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{nombre_archivo}"

        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            # "x-upsert": "true" le dice a Supabase: "Si ya existe, reemplázalo"
            "x-upsert": "true", 
            "Content-Type": "application/json"
        }

        # Intentamos subirlo directamente con x-upsert
        response = requests.post(url, headers=headers, data=archivo)

        if response.status_code in [200, 201]:
            print(f"☁️ Subido y actualizado en Supabase: {nombre_archivo}")
        else:
            # Si el POST falla aun con x-upsert, intentamos el PUT tradicional
            response = requests.put(url, headers=headers, data=archivo)
            
            if response.status_code in [200, 201]:
                print(f"☁️ Reemplazado vía PUT en Supabase: {nombre_archivo}")
            else:
                print(f"❌ Error Supabase ({nombre_archivo}): {response.text}")

    except Exception as e:
        print(f"❌ Error subiendo {nombre_archivo}:", e)