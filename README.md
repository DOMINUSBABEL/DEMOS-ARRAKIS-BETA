
# DEMOS ARRAKIS - Sistema de Inteligencia y Predicción Electoral

**Versión:** Beta 1.1
**Motor:** React + TypeScript + Google Gemini AI

## 📋 Descripción General

**DEMOS ARRAKIS** es una plataforma avanzada de análisis de datos y simulación electoral diseñada para estrategas políticos, partidos y analistas. Su objetivo es transformar datos electorales históricos (E-14, E-24, E-26) en inteligencia accionable.

El sistema combina **modelos matemáticos determinísticos** (Cifra Repartidora D'Hondt) y **modelos probabilísticos** (Simulaciones de Monte Carlo) con la potencia de la **Inteligencia Artificial Generativa** (Google Gemini) para ofrecer proyecciones, perfiles de candidatos y estrategias de campaña.

---

## 🚀 Características Principales

1.  **Gestión de Datos Agnóstica:** Carga datos desde CSV, Excel, PDF o Imágenes. El sistema normaliza y estructura la información automáticamente.
2.  **Simulador D'Hondt en Tiempo Real:** Cálculo instantáneo de asignación de curules con ajustes manuales de votación (escenarios "What-If").
3.  **Proyecciones Monte Carlo:** Simulación de miles de escenarios electorales considerando variables como fragmentación, desgaste de gobierno y efecto arrastre.
4.  **Inteligencia de Candidatos (Perfil 360°):** Búsqueda profunda de candidatos específicos, combinando historial electoral interno y análisis de opinión pública/gestión vía web.
5.  **Auditoría Electoral (Simulación de Formularios):** Desglose jerárquico de votos (Municipio -> Zona -> Puesto) para simular la estructura de formularios E-26 y E-24.
6.  **Marketing de Guerra:** Generación de estrategias de campaña y perfiles de votante (Buyer Persona) enfocados en el voto elástico.
7.  **Análisis de Listas:** Recomendación estratégica basada en datos para decidir entre Listas Abiertas o Cerradas.

---

## 🛠️ Guía de Uso por Módulos

### 1. Gestor de Datos (Data Manager)
Es el punto de entrada. Aquí se alimenta el "cerebro" del sistema.
*   **Carga de Archivos:** Arrastre archivos `.csv`, `.xlsx`, `.pdf` o imágenes de formularios. La IA intentará extraer y estructurar los datos automáticamente.
*   **Ingreso Manual:** Para pruebas rápidas sin archivos.
*   **Fusión (Merge):** Seleccione dos o más conjuntos de datos para crear uno consolidado (ej. unir "Norte" y "Sur" para tener "Departamento Completo").
*   **Datos Remotos:** Carga proyecciones preestablecidas (ej. Cámara 2026) desde la barra lateral.

### 2. Análisis General
El tablero de control principal del conjunto de datos activo.
*   **Ranking de Poder Electoral Base (PEB):** Muestra la fuerza inicial de cada partido/candidato.
*   **Estratega IA:** Un botón que solicita a Gemini un análisis cualitativo de los datos, identificando fortalezas y debilidades.
*   **Estadísticas Globales:** Participación total, votos válidos, nulos y blancos.

### 3. Simulador D'Hondt
Herramienta matemática para la asignación de escaños.
*   **Configuración:** Defina el número de curules a repartir (ej. 17 para Cámara Antioquia).
*   **Sliders de Ajuste:** Modifique los votos de cada partido manualmente. El gráfico de curules y la tabla de resultados se actualizan en tiempo real.
*   **Umbral y Cifra Repartidora:** El sistema calcula automáticamente el umbral electoral y la cifra repartidora basándose en los votos ingresados.

### 4. Proyecciones (Escenarios)
Módulo probabilístico para medir riesgos.
*   **Variables de Entorno:** Configure factores como:
    *   *Fragmentación:* ¿Qué pasa si el partido X se divide en 3 listas?
    *   *Factor Gobierno/Oposición:* Penalización porcentual automática para partidos de gobierno.
    *   *Apoyo Local y Fuerza de Campaña:* Bonificadores manuales.
*   **Oráculo (Monte Carlo):** Ejecuta 5,000+ simulaciones con variaciones aleatorias para determinar la **Probabilidad de Curul (%)** de cada candidato.

### 5. Simulación Histórica (Flujo de Votos)
Entienda de dónde vienen y hacia dónde van los votos.
*   **Diagrama de Sankey:** Visualiza la transferencia de votos entre una elección "Origen" (ej. 2018) y una "Destino" (ej. 2022).
*   **Modelo de Transferencia:** La IA estima qué porcentaje de votantes de un partido antiguo migró a uno nuevo basándose en afinidad ideológica.

### 6. Inteligencia de Candidatos
Módulo de investigación profunda sobre individuos.
*   **Pestaña Perfil Estratégico:** Resumen generado por IA sobre la opinión pública, trayectoria y escándalos del candidato (usando Google Search).
*   **Pestaña Rastro Electoral (Formularios):** Auditoría de datos pura. Muestra un árbol colapsable de votos: `Elección -> Municipio -> Zona -> Puesto`. Ideal para identificar bastiones territoriales.
*   **Botón "Simular en D'Hondt":** Inyecta al candidato buscado (con su proyección de votos) directamente en el simulador de curules.

### 7. Coaliciones y Listas
*   **Coaliciones:** Ingeniería inversa. Estima cuántos votos aportó cada partido miembro a una coalición cerrada (ej. Pacto Histórico) basándose en elecciones de referencia.
*   **Análisis de Listas:** Evalúa si a un partido le conviene más una lista Abierta (Voto Preferente) o Cerrada, analizando la "concentración" de votos en líderes históricos.

---

## ⚙️ Instalación y Configuración Técnica

### Requisitos Previos
*   Node.js (v18 o superior recomendado)
*   Una API KEY de Google Gemini (AI Studio).

### Pasos de Instalación

1.  **Clonar el Repositorio:**
    ```bash
    git clone [url-del-repositorio]
    cd demos-arrakis
    ```

2.  **Instalar Dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno:**
    El sistema requiere la API Key de Gemini para todas las funciones de IA. El código espera que esté disponible en `process.env.API_KEY`.
    
    *Opción A (Local):* Crear un archivo `.env` en la raíz:
    ```env
    API_KEY=tu_clave_de_google_ai_studio_aqui
    ```
    *Nota: Asegúrate de que tu bundler (Vite) esté configurado para exponer esta variable (ej. `VITE_API_KEY`) y actualiza la inicialización en el código si es necesario, o usa el método de inyección de tu entorno de despliegue.*

4.  **Ejecutar en Desarrollo:**
    ```bash
    npm run dev
    ```

### Estructura de Archivos Clave
*   `components/Dashboard.tsx`: Orquestador principal de la interfaz.
*   `components/DHondtSimulator.tsx`: Lógica matemática de asignación de escaños.
*   `components/CandidateIntelligence.tsx`: Módulo de perfiles y desglose de formularios.
*   `services/geminiService.ts`: Todas las llamadas a la IA (Prompts, extracción de datos, análisis).
*   `services/electoralProcessor.ts`: Lógica de normalización de datos y cálculos estadísticos.

---

## 📚 Glosario Metodológico

*   **PEB (Poder Electoral Base):** Promedio ponderado de votos históricos ajustado por factores como si fue cabeza de lista o no.
*   **Voto Elástico:** Votante indeciso o de opinión que puede cambiar su preferencia fácilmente.
*   **Voto Inelástico (Estructural):** Voto duro, leal o de maquinaria.
*   **Cifra Repartidora:** El cociente más bajo que permite asignar la última curul en el sistema D'Hondt.
*   **Umbral:** Votación mínima necesaria para que una lista entre en la repartición de escaños.

---

**DEMOS ARRAKIS**
*Intelligence for the Political Battlefield.*
